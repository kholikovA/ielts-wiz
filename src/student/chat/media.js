import React, { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '../../components/ui/icons';
import * as api from './chatApi';
import { fileSize, duration as fmtDuration } from './format';

// Attachments in a bubble: photo, video, voice message, file.

export function useFileUrl(path) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let live = true;
    setUrl(null);
    if (path) api.fileUrl(path).then((u) => live && setUrl(u)).catch(() => {});
    return () => { live = false; };
  }, [path]);
  return url;
}

export async function downloadAttachment(a) {
  try {
    const url = await api.fileUrl(a.path, { download: a.name || true });
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch { /* expired or removed */ }
}

function fitBox(a, max = 320) {
  const w = a.width || max;
  const h = a.height || Math.round(max * 0.75);
  const scale = Math.min(1, max / w, max / h);
  return { width: Math.max(120, Math.round(w * scale)), aspectRatio: `${w} / ${h}` };
}

export function Attachment({ a, onOpenImage, onMediaLoad }) {
  if (a.kind === 'image') return <ImageAttachment a={a} onOpen={onOpenImage} onLoad={onMediaLoad} />;
  if (a.kind === 'voice') return <VoicePlayer a={a} />;
  if (a.kind === 'video') return <VideoAttachment a={a} onLoad={onMediaLoad} />;
  return <FileAttachment a={a} />;
}

function ImageAttachment({ a, onOpen, onLoad }) {
  const signed = useFileUrl(a.local ? null : a.path);
  const src = a.local || signed;
  return (
    <button type="button" className="chat-img" style={fitBox(a)} onClick={() => src && onOpen?.({ ...a, src })} aria-label={`Open photo ${a.name || ''}`}>
      {src ? <img src={src} alt={a.name || 'Photo'} onLoad={onLoad} /> : <span className="chat-img-ph"><Icon name="image" size={22} /></span>}
      {a.uploading && <span className="chat-uploading"><span className="hub-spinner" /></span>}
    </button>
  );
}

function VideoAttachment({ a, onLoad }) {
  const signed = useFileUrl(a.local ? null : a.path);
  const src = a.local || signed;
  return (
    <div className="chat-video" style={fitBox(a)}>
      {src ? <video src={src} controls preload="metadata" onLoadedMetadata={onLoad} /> : <span className="chat-img-ph"><Icon name="play" size={22} /></span>}
    </div>
  );
}

function FileAttachment({ a }) {
  return (
    <button type="button" className="chat-file" onClick={() => !a.uploading && downloadAttachment(a)} title="Download">
      <span className="chat-file-icon">{a.uploading ? <span className="hub-spinner" /> : <Icon name="file" size={18} />}</span>
      <span className="chat-file-meta"><strong>{a.name || 'File'}</strong><small>{a.uploading ? 'Uploading…' : fileSize(a.size)}</small></span>
      {!a.uploading && <Icon name="download" size={15} />}
    </button>
  );
}

const FLAT = Array.from({ length: 40 }, () => 0.25);

export function VoicePlayer({ a }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [src, setSrc] = useState(a.local || null);
  const bars = a.waveform?.length ? a.waveform : FLAT;
  const total = a.duration || 0;

  const toggle = async () => {
    if (a.uploading) return;
    let url = src;
    if (!url) {
      try { url = await api.fileUrl(a.path); setSrc(url); } catch { return; }
    }
    const el = audio.current;
    if (!el) return;
    if (el.src !== url) el.src = url;
    if (el.paused) {
      // One voice message at a time.
      document.querySelectorAll('.chat-voice audio').forEach((x) => { if (x !== el) x.pause(); });
      el.play().catch(() => {});
    } else el.pause();
  };
  const seek = (e) => {
    const el = audio.current;
    if (!el || !el.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    el.currentTime = ((e.clientX - r.left) / r.width) * el.duration;
  };
  const progress = total ? Math.min(1, t / total) : 0;

  return (
    <div className="chat-voice">
      <button type="button" className="chat-voice-btn" onClick={toggle} aria-label={playing ? 'Pause voice message' : 'Play voice message'}>
        {a.uploading ? <span className="hub-spinner" /> : <Icon name={playing ? 'pause' : 'play'} size={16} />}
      </button>
      <div className="chat-voice-body">
        <div className="chat-wave" onClick={seek} role="presentation">
          {bars.map((v, i) => (
            <span key={i} style={{ height: `${Math.max(12, Math.round(v * 100))}%` }} className={i / bars.length < progress ? 'is-played' : ''} />
          ))}
        </div>
        <small>{fmtDuration(playing || t ? t : total)}</small>
      </div>
      <audio ref={audio} preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setT(0); }}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} />
    </div>
  );
}

export function Lightbox({ image, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!image) return null;
  return (
    <div className="chat-lightbox" onClick={onClose} role="dialog" aria-label="Photo">
      <div className="chat-lightbox-bar" onClick={(e) => e.stopPropagation()}>
        <span>{image.name}</span>
        {image.path && !image.local && (
          <button type="button" className="hub-icon-btn" onClick={() => downloadAttachment(image)} aria-label="Download"><Icon name="download" size={18} /></button>
        )}
        <button type="button" className="hub-icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
      </div>
      <img src={image.src} alt={image.name || 'Photo'} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// Voice recording: returns { state, seconds, start, stop, cancel }.
// stop() resolves to { file, duration, waveform } (or null if too short).
const VOICE_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export function useRecorder() {
  const [state, setState] = useState('idle'); // idle | recording
  const [seconds, setSeconds] = useState(0);
  const rec = useRef(null);

  const cleanup = () => {
    const r = rec.current;
    if (!r) return;
    clearInterval(r.timer);
    r.stream.getTracks().forEach((tr) => tr.stop());
    r.ctx?.close().catch(() => {});
    rec.current = null;
    setState('idle');
    setSeconds(0);
  };
  useEffect(() => cleanup, []);

  const start = useCallback(async () => {
    if (rec.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = VOICE_TYPES.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || '';
    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    const levels = [];
    let ctx = null;
    let analyser = null;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
    } catch { /* no waveform */ }
    const buf = analyser ? new Uint8Array(analyser.fftSize) : null;
    const began = Date.now();
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - began) / 1000));
      if (analyser) {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) { const v = (buf[i] - 128) / 128; sum += v * v; }
        levels.push(Math.sqrt(sum / buf.length));
      }
    }, 100);
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.start(250);
    rec.current = { mr, stream, ctx, timer, chunks, levels, began, mimeType: mr.mimeType || mimeType };
    setState('recording');
  }, []);

  const stop = useCallback(() => new Promise((resolve) => {
    const r = rec.current;
    if (!r) { resolve(null); return; }
    r.mr.onstop = () => {
      const secs = (Date.now() - r.began) / 1000;
      const type = (r.mimeType || 'audio/webm').split(';')[0];
      const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
      const blob = new Blob(r.chunks, { type });
      cleanup();
      if (secs < 0.7 || !blob.size) { resolve(null); return; }
      const file = new File([blob], `voice-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`, { type });
      resolve({ file, duration: Math.round(secs * 10) / 10, waveform: waveform(r.levels) });
    };
    r.mr.stop();
  }), []);

  const cancel = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    r.mr.onstop = null;
    try { r.mr.stop(); } catch { /* already stopped */ }
    cleanup();
  }, []);

  return { state, seconds, start, stop, cancel };
}

// Squash RMS samples into 40 bars, normalised to 0..1.
export function waveform(levels, bars = 40) {
  if (!levels.length) return null;
  const out = [];
  for (let i = 0; i < bars; i += 1) {
    const from = Math.floor((i / bars) * levels.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / bars) * levels.length));
    const slice = levels.slice(from, to);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  const peak = Math.max(...out) || 1;
  return out.map((v) => Math.round((v / peak) * 100) / 100);
}
