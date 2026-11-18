// UK + US pronunciations for flashcard words.
//   IPA:   freedictionaryapi.com (Wiktionary, tagged by accent)
//   Audio: dictionaryapi.dev (Wiktionary / Wikimedia Commons recordings, -uk / -us)
// Where a recording is missing, the device's British / American voice reads the
// word instead, so both accents always work. Content is CC BY-SA 4.0 (credited
// on the Flashcards page). Results are cached in memory and localStorage.

const FDA = 'https://freedictionaryapi.com/api/v1/entries/en/';
const DEV = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const STORE = 'iw-pron-v1:';
const TTL = 30 * 86400000;
const EMPTY = { uk: {}, us: {} };

const mem = new Map();

const UK_TAG = /^(uk|british|received pronunciation|rp|england|southern england|standard southern british)$/i;
const US_TAG = /^(us|general american|genam|american|north american)$/i;

const keyOf = (word) => (word || '').trim().toLowerCase();
// Only look up dictionary headwords: 1–3 plain words.
const lookupable = (k) => /^[a-z][a-z' -]*$/.test(k) && k.split(/\s+/).length <= 3;

async function getJson(url, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? await res.json() : null;
  } finally {
    clearTimeout(t);
  }
}

/** Pick UK / US IPA from freedictionaryapi.com entries. Exported for tests. */
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

/** Pick -uk / -us recordings (and fallback IPA) from dictionaryapi.dev. Exported for tests. */
export function audioFrom(dev) {
  const phon = (Array.isArray(dev) ? dev : []).flatMap((e) => e.phonetics || []);
  const find = (acc) => phon.find((p) => p.audio && new RegExp(`-${acc}\\.mp3$`, 'i').test(p.audio));
  const uk = find('uk');
  const us = find('us');
  return { uk: uk?.audio || null, us: us?.audio || null, ukText: uk?.text, usText: us?.text };
}

function readStore(k) {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORE + k));
    return v && Date.now() - v.at < TTL ? v.data : null;
  } catch (e) {
    return null;
  }
}
function writeStore(k, data) {
  try { window.localStorage.setItem(STORE + k, JSON.stringify({ at: Date.now(), data })); } catch (e) { /* storage full or blocked */ }
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
  const p = Promise.allSettled([getJson(FDA + encodeURIComponent(k)), getJson(DEV + encodeURIComponent(k))])
    .then(([fda, dev]) => {
      const ipa = ipaFrom(fda.status === 'fulfilled' ? fda.value : null);
      const audio = audioFrom(dev.status === 'fulfilled' ? dev.value : null);
      const data = {
        uk: { ipa: ipa.uk || audio.ukText, audio: audio.uk },
        us: { ipa: ipa.us || audio.usText, audio: audio.us },
      };
      // Only cache when at least one source answered, so a network blip is retried later.
      if (fda.status === 'fulfilled' || dev.status === 'fulfilled') writeStore(k, data);
      return data;
    })
    .catch(() => EMPTY);
  mem.set(k, p);
  return p;
}

// ── Playback ────────────────────────────────────────────────────────────────

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
let current = null;

function voiceFor(lang) {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
  const good = /natural|neural|premium|enhanced|google|siri|daniel|samantha|serena|kate|aaron/i;
  return voices.find((v) => good.test(v.name)) || voices[0] || null;
}

function speakWith(text, accent) {
  if (!canSpeak || !text) return;
  const lang = accent === 'us' ? 'en-US' : 'en-GB';
  const u = new window.SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  const v = voiceFor(lang);
  if (v) u.voice = v;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/** Play a word in 'uk' or 'us': the real recording if there is one, else a device voice. */
export async function play(word, accent = 'uk') {
  if (current) { current.pause(); current = null; }
  const data = await pronunciation(word);
  const url = data[accent]?.audio;
  if (url) {
    try {
      current = new Audio(url);
      await current.play();
      return;
    } catch (e) {
      current = null; // blocked or failed: fall through to the device voice
    }
  }
  speakWith(word, accent);
}

export const canPlay = canSpeak || typeof Audio !== 'undefined';
