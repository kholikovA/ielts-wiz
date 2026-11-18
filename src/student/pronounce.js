// UK + US pronunciations for flashcard words: real human recordings only.
//   IPA:   freedictionaryapi.com (Wiktionary, tagged by accent)
//   Audio: Wikimedia Commons recordings (the files Wiktionary uses). We find them
//          two ways: dictionaryapi.dev lists the Commons file behind each of its
//          -uk / -us clips (its own media URLs can't be played in browsers), and
//          Commons is asked directly for the conventional En-uk / En-gb / En-us
//          file names. Commons serves an MP3 transcode, so Safari plays it too.
// When an accent has no human recording, an AI clip fills the gap: generated
// once per word + accent on our server (word-audio edge function, OpenAI
// gpt-4o-mini-tts), stored in the word-audio bucket and shared by everyone.
// Never the browser's built-in voice. Commons content is CC BY-SA (credited on
// the Flashcards page). Cached per browser.

import { supabase } from '../supabaseClient';
import { edgeFetch } from './api';

const FDA = 'https://freedictionaryapi.com/api/v1/entries/en/';
const DEV = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const STORE = 'iw-pron-v3:';
const RETRY = 60 * 60000; // re-check after an hour when AI audio couldn't be made yet
const TTL = 30 * 86400000;
const EMPTY = { uk: {}, us: {} };

const mem = new Map();

const UK_TAG = /^(uk|british|received pronunciation|rp|england|southern england|standard southern british)$/i;
const US_TAG = /^(us|general american|genam|american|north american)$/i;

const keyOf = (word) => (word || '').trim().toLowerCase();
// Only look up dictionary headwords: 1–3 plain words.
const lookupable = (k) => /^[a-z][a-z' -]*$/.test(k) && k.split(/\s+/).length <= 3;

async function getJson(url, ms = 7000, headers) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    return res.ok ? await res.json() : null;
  } finally {
    clearTimeout(t);
  }
}

/** Pick UK / US IPA from freedictionaryapi.com entries. */
export function ipaFrom(fda) {
  const all = (fda?.entries || []).flatMap((e) => e.pronunciations || []).filter((p) => p.type === 'ipa' && p.text);
  // Prefer phonemic /…/ over phonetic […], and full forms over fragments like /hə-/.
  const rank = (p) => (p.text.startsWith('/') ? 0 : 1) + (/-\/?$|^\/?-/.test(p.text) ? 2 : 0);
  const best = (list) => [...list].sort((a, b) => rank(a) - rank(b))[0]?.text;
  const uk = best(all.filter((p) => (p.tags || []).some((t) => UK_TAG.test(t))));
  const us = best(all.filter((p) => (p.tags || []).some((t) => US_TAG.test(t))));
  const any = best(all.filter((p) => !(p.tags || []).length)) || best(all);
  return { uk: uk || (!us ? any : undefined), us: us || (!uk ? any : undefined) };
}

/** Commons page ids (and accents) of the recordings dictionaryapi.dev knows about, plus fallback IPA. */
export function devSources(dev) {
  const phon = (Array.isArray(dev) ? dev : []).flatMap((e) => e.phonetics || []);
  const out = { ids: {}, ukText: undefined, usText: undefined };
  phon.forEach((p) => {
    const acc = /-(uk|us)\.mp3$/i.exec(p.audio || '')?.[1]?.toLowerCase();
    const id = /[?&]curid=(\d+)/.exec(p.sourceUrl || '')?.[1];
    if (!acc) return;
    if (id && !out.ids[id]) out.ids[id] = acc;
    if (p.text && !out[`${acc}Text`]) out[`${acc}Text`] = p.text;
  });
  return out;
}

/** A URL every browser can play: Commons' MP3 transcode for .ogg / .wav / .flac originals. */
export function playableUrl(url) {
  if (!url) return null;
  const clean = url.split('?')[0];
  if (/\.mp3$/i.test(clean)) return clean;
  const m = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/.exec(clean);
  return m ? `${m[1]}/transcoded/${m[2]}/${m[3]}/${m[4]}/${m[4]}.mp3` : null;
}

const accentOfTitle = (title) => {
  const m = /^File:En-(uk|gb|us)-/i.exec(title || '');
  if (!m) return null;
  return m[1].toLowerCase() === 'us' ? 'us' : 'uk';
};

/** { uk, us } MP3 URLs from a Commons imageinfo response. */
export function audioFromCommons(commons, idAccents = {}) {
  const out = { uk: null, us: null };
  // Conventionally named files (En-uk-…) first, then ones labelled by dictionaryapi.dev.
  const pages = (commons?.query?.pages || []).filter((p) => !p.missing && p.imageinfo?.[0]?.url);
  const ordered = [...pages].sort((a, b) => (accentOfTitle(b.title) ? 1 : 0) - (accentOfTitle(a.title) ? 1 : 0));
  ordered.forEach((p) => {
    const acc = accentOfTitle(p.title) || idAccents[p.pageid];
    const url = playableUrl(p.imageinfo[0].url);
    if (acc && url && !out[acc]) out[acc] = url;
  });
  return out;
}

// Commons can't take titles and pageids in one query, so it's asked by one or the other.
// Wikimedia asks browser clients to identify themselves with Api-User-Agent.
function commons(lookup) {
  const q = new URLSearchParams({ action: 'query', prop: 'imageinfo', iiprop: 'url', format: 'json', formatversion: '2', origin: '*', ...lookup });
  return getJson(`${COMMONS}?${q}`, 7000, { 'Api-User-Agent': 'IELTS-Wiz/1.0 (https://www.ielts-wiz.com)' });
}

function readStore(k) {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORE + k));
    return v && Date.now() - v.at < (v.ttl || TTL) ? v.data : null;
  } catch (e) {
    return null;
  }
}
function writeStore(k, data, ttl = TTL) {
  try { window.localStorage.setItem(STORE + k, JSON.stringify({ at: Date.now(), ttl, data })); } catch (e) { /* storage full or blocked */ }
}

const publicUrl = (path) => supabase.storage.from('word-audio').getPublicUrl(path).data?.publicUrl || null;

/**
 * AI clips for the accents in `missing`: stored ones first, then ask the
 * word-audio function to make the rest. Returns { clips: { uk?, us? }, retry }
 * where retry means generation failed for a reason that may clear up.
 */
async function aiClips(k, missing, ipa) {
  const clips = {};
  let retry = false;
  try {
    const { data } = await supabase.from('word_audio').select('accent, path').eq('word', k);
    (data || []).forEach((r) => { if (missing.includes(r.accent)) clips[r.accent] = publicUrl(r.path); });
  } catch (e) { /* fall through to generation */ }
  await Promise.all(missing.filter((acc) => !clips[acc]).map(async (acc) => {
    try {
      const res = await edgeFetch('word-audio', { word: k, accent: acc, ipa: ipa[acc] || undefined });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.path) clips[acc] = publicUrl(body.path);
      else if (res.status !== 400 && res.status !== 404) retry = true;
    } catch (e) {
      retry = true;
    }
  }));
  return { clips, retry };
}

async function load(k) {
  const [fda, dev] = await Promise.allSettled([getJson(FDA + encodeURIComponent(k)), getJson(DEV + encodeURIComponent(k))]);
  const ipa = ipaFrom(fda.status === 'fulfilled' ? fda.value : null);
  const src = devSources(dev.status === 'fulfilled' ? dev.value : null);
  const word = k.replace(/\s+/g, '_');
  const ids = Object.keys(src.ids);
  const [byTitle, byId] = await Promise.allSettled([
    commons({ titles: ['uk', 'gb', 'us'].map((p) => `File:En-${p}-${word}.ogg`).join('|') }),
    ids.length ? commons({ pageids: ids.join('|') }) : Promise.resolve({}),
  ]);
  const a = audioFromCommons(byTitle.status === 'fulfilled' ? byTitle.value : null);
  const b = audioFromCommons(byId.status === 'fulfilled' ? byId.value : null, src.ids);
  const data = {
    uk: { ipa: ipa.uk || src.ukText, audio: a.uk || b.uk || null, ai: false },
    us: { ipa: ipa.us || src.usText, audio: a.us || b.us || null, ai: false },
  };
  // Cache only a complete answer: if Commons (or the dictionary) failed, try again next time
  // rather than remembering "no recording" for a month.
  const ok = (r) => r.status === 'fulfilled' && r.value;
  const answered = ok(byTitle) && ok(byId) && (ok(fda) || ok(dev));
  let retry = false;
  const missing = ['uk', 'us'].filter((acc) => !data[acc].audio);
  if (answered && missing.length) {
    const ai = await aiClips(k, missing, { uk: data.uk.ipa, us: data.us.ipa });
    Object.entries(ai.clips).forEach(([acc, url]) => { if (url) data[acc] = { ...data[acc], audio: url, ai: true }; });
    retry = ai.retry;
  }
  return { data, answered, retry };
}

/** { uk: { ipa?, audio? }, us: { ipa?, audio? } } — never throws. */
export function pronunciation(word) {
  const k = keyOf(word);
  if (!k || !lookupable(k)) return Promise.resolve(EMPTY);
  if (mem.has(k)) return mem.get(k);
  const stored = readStore(k);
  if (stored) {
    const p = Promise.resolve(stored);
    mem.set(k, p);
    return p;
  }
  const p = load(k)
    .then(({ data, answered, retry }) => {
      // Only cache when the services answered, so a network blip is retried later.
      if (answered) writeStore(k, data, retry ? RETRY : TTL);
      if (!answered || retry) mem.delete(k);
      return data;
    })
    .catch(() => { mem.delete(k); return EMPTY; });
  mem.set(k, p);
  return p;
}

// ── Playback ────────────────────────────────────────────────────────────────

let current = null;

/** Play the recording for 'uk' or 'us'. Resolves true if something played. */
export async function play(word, accent = 'uk') {
  if (current) { current.pause(); current = null; }
  const data = await pronunciation(word);
  const url = data[accent]?.audio || null;
  if (!url) return false;
  try {
    current = new Audio(url);
    await current.play();
    return true;
  } catch (e) {
    current = null;
    return false;
  }
}

/** The accent to use when only one button is shown (UK first). */
export const firstAccent = (data) => (data?.uk?.audio ? 'uk' : data?.us?.audio ? 'us' : null);
