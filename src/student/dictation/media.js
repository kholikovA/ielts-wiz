// Teacher-side preparation of dictation audio, all in the browser:
//   file / link / practice test -> mono mp3 in the dictation-media bucket
//   -> Whisper transcript with word timings -> one cue per sentence
//   -> sentence ends measured from the audio itself.
import { supabase } from '../../supabaseClient';
import { sentencesFromWhisper, alignTranscript, refineEnds } from './cues';
import { edgeFetch } from '../api';

const RATE = 22050; // speech-quality mono; ~0.36 MB per minute at 48 kbps
const KBPS = 48;
export const MAX_MINUTES = 20;

const isYouTube = (url) => /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i.test(safeHost(url));
function safeHost(url) { try { return new URL(url).hostname; } catch { return ''; } }

async function callFunction(body) {
  const res = await edgeFetch('dictation-media', body);
  if (!res.ok) {
    const msg = await res.json().then((j) => j.error).catch(() => null);
    throw new Error(msg || `Request failed (${res.status}).`);
  }
  return res;
}

// Read a response body with progress (0..1, or null when the size is unknown).
async function readWithProgress(res, onProgress) {
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !res.body.getReader) return res.blob();
  const reader = res.body.getReader();
  const parts = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read(); // eslint-disable-line no-await-in-loop
    if (done) break;
    parts.push(value);
    got += value.byteLength;
    onProgress?.(total ? got / total : null, got);
  }
  return new Blob(parts, { type: res.headers.get('content-type') || '' });
}

export async function fetchLinked(url, onProgress) {
  if (isYouTube(url)) throw new Error("YouTube links can't be converted. Download the video and upload the file instead.");
  const res = await callFunction({ action: 'fetch', url });
  return readWithProgress(res, onProgress);
}

export async function fetchPublic(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load the recording (${res.status}).`);
  return readWithProgress(res, onProgress);
}

// Duration from the browser's own media element, before decoding anything.
function probeDuration(blob) {
  return new Promise((resolve) => {
    const el = document.createElement(blob.type.startsWith('video') ? 'video' : 'audio');
    const url = URL.createObjectURL(blob);
    const done = (d) => { URL.revokeObjectURL(url); resolve(d); };
    el.preload = 'metadata';
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null);
    el.onerror = () => done(null);
    setTimeout(() => done(null), 8000);
    el.src = url;
  });
}

// Any audio or video file -> mono Float32 samples at RATE.
export async function decodeToMono(blob) {
  const duration = await probeDuration(blob);
  if (duration && duration > MAX_MINUTES * 60) {
    throw new Error(`That recording is ${Math.round(duration / 60)} minutes long. Dictations can be up to ${MAX_MINUTES} minutes; trim it first.`);
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  } catch {
    throw new Error("Couldn't read any audio from that file. Try an mp3, m4a, wav or mp4.");
  } finally {
    ctx.close?.();
  }
  if (decoded.duration > MAX_MINUTES * 60) {
    throw new Error(`That recording is ${Math.round(decoded.duration / 60)} minutes long. Dictations can be up to ${MAX_MINUTES} minutes.`);
  }
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * RATE), RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded; // multi-channel input is down-mixed to the mono destination
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return { samples: rendered.getChannelData(0), rate: RATE, duration: rendered.duration };
}

const nextFrame = () => new Promise((r) => setTimeout(r, 0));

export async function encodeMp3(samples, rate, onProgress) {
  const { Mp3Encoder } = await import('@breezystack/lamejs');
  const enc = new Mp3Encoder(1, rate, KBPS);
  const block = 1152 * 20;
  const out = [];
  const pcm = new Int16Array(block);
  let lastYield = performance.now();
  for (let i = 0; i < samples.length; i += block) {
    const n = Math.min(block, samples.length - i);
    for (let k = 0; k < n; k += 1) {
      const v = Math.max(-1, Math.min(1, samples[i + k]));
      pcm[k] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    const buf = enc.encodeBuffer(n === block ? pcm : pcm.subarray(0, n));
    if (buf.length) out.push(new Uint8Array(buf));
    if (performance.now() - lastYield > 120) {
      onProgress?.(i / samples.length);
      await nextFrame(); // eslint-disable-line no-await-in-loop
      lastYield = performance.now();
    }
  }
  const tail = enc.flush();
  if (tail.length) out.push(new Uint8Array(tail));
  onProgress?.(1);
  return new Blob(out, { type: 'audio/mpeg' });
}

const randomId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export async function uploadMp3(uid, blob) {
  const path = `${uid}/${randomId()}.mp3`;
  const { error } = await supabase.storage.from('dictation-media').upload(path, blob, { contentType: 'audio/mpeg', cacheControl: '31536000' });
  if (error) throw new Error(error.message || 'Upload failed.');
  const { data } = supabase.storage.from('dictation-media').getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function transcribe(path, prompt) {
  const res = await callFunction({ action: 'transcribe', path, prompt });
  return res.json();
}

/**
 * Prepare dictation audio. `step(label, progress)` reports what's happening.
 *   source: { kind: 'file', file } | { kind: 'link', url } | { kind: 'test', id }
 *   transcript: the teacher's own transcript (optional, file/link only)
 * Returns { audio_url, duration, cues: [{ s, e, text, a? }], transcript_source, label }.
 */
export async function prepareDictation({ uid, source, transcript, step = () => {} }) {
  if (source.kind === 'test') {
    step('Loading the test', null);
    const res = await fetch(`/dictation/test_${source.id}.json`);
    if (!res.ok) throw new Error('Test transcript not found.');
    const data = await res.json();
    step('Downloading the recording', 0);
    const blob = await fetchPublic(data.audio, (p) => step('Downloading the recording', p));
    step('Measuring sentences', null);
    const { samples, rate, duration } = await decodeToMono(blob);
    const cues = refineEnds(samples, rate, data.cues.map((c) => ({ s: c.s, text: c.text, a: c.a })), duration);
    return { audio_url: data.audio, duration, cues, transcript_source: 'test' };
  }

  let blob;
  if (source.kind === 'file') {
    blob = source.file;
  } else {
    step('Downloading', 0);
    blob = await fetchLinked(source.url, (p) => step('Downloading', p));
  }
  step(blob.type.startsWith('video') ? 'Extracting the audio' : 'Reading the audio', null);
  const { samples, rate, duration } = await decodeToMono(blob);
  step('Converting to mp3', 0);
  const mp3 = await encodeMp3(samples, rate, (p) => step('Converting to mp3', p));
  step('Uploading', null);
  const { path, url } = await uploadMp3(uid, mp3);
  step('Transcribing', null);
  const teacherText = (transcript || '').trim();
  const whisper = await transcribe(path, teacherText ? teacherText.slice(0, 800) : undefined);
  let cues = sentencesFromWhisper(whisper);
  if (!cues.length) throw new Error("No speech was found in that recording.");
  if (teacherText) cues = alignTranscript(teacherText, cues);
  step('Measuring sentences', null);
  cues = refineEnds(samples, rate, cues, duration);
  return { audio_url: url, duration, cues, transcript_source: teacherText ? 'teacher' : 'generated' };
}
