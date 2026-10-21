// Sentence cues for dictation audio: [{ s, e, text }] in seconds.
import { tokenize, align } from './diff';

const ABBR = new Set(['mr', 'mrs', 'ms', 'dr', 'st', 'prof', 'etc', 'vs', 'mt', 'jr', 'sr', 'approx']);

// Does a sentence end after `raw` (given the following word, if any)?
export function endsSentence(raw, next) {
  const core = raw.replace(/["'”’)\]]+$/, '');
  if (!/[.?!]$/.test(core)) return false;
  if (core.endsWith('.')) {
    const word = core.slice(0, -1).toLowerCase().replace(/[^a-z.]/g, '');
    if (ABBR.has(word)) return false;
    // a.m. / e.g. / i.e. only end a sentence before a capital.
    if (/^[a-z](\.[a-z])+$/.test(word) && next && !/^[A-Z]/.test(next)) return false;
  }
  return !next || /^[A-Z0-9"“‘(£$€]/.test(next);
}

// Whisper verbose_json (segments + word timestamps) -> one cue per sentence.
// Segment text carries the punctuation; the word list carries the timing.
export function sentencesFromWhisper({ segments = [], words = [] }) {
  const text = segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim();
  const toks = tokenize(text);
  if (!toks.length) return [];
  const wtoks = words.flatMap((w) => tokenize(w.word).map((t) => ({ ...t, start: w.start, end: w.end })));
  // Map each text token to a timed word.
  const times = new Array(toks.length).fill(null);
  align(toks, wtoks).forEach((op) => {
    if (op.si != null && op.ri != null) times[op.si] = { s: wtoks[op.ri].start, e: wtoks[op.ri].end };
  });
  // Fill gaps from neighbours (and from segment bounds at the edges).
  for (let i = 0; i < times.length; i += 1) {
    if (times[i]) continue;
    let j = i + 1;
    while (j < times.length && !times[j]) j += 1;
    const before = i > 0 ? times[i - 1].e : (segments[0]?.start ?? 0);
    const after = j < times.length ? times[j].s : (segments[segments.length - 1]?.end ?? before);
    const step = (after - before) / (j - i + 1);
    for (let k = i; k < j; k += 1) times[k] = { s: before + step * (k - i), e: before + step * (k - i + 1) };
    i = j - 1;
  }
  const cues = [];
  let startIdx = 0;
  toks.forEach((t, i) => {
    const next = toks[i + 1]?.raw;
    if (i === toks.length - 1 || endsSentence(t.raw, next)) {
      cues.push({
        s: round2(times[startIdx].s),
        e: round2(times[i].e),
        text: rawSlice(text, toks[startIdx], t),
      });
      startIdx = i + 1;
    }
  });
  return cues;
}

// The original words from token `a` to token `b` (hyphens etc. intact).
const rawSlice = (text, a, b) => text.split(/\s+/).slice(a.w, b.w + 1).join(' ');

const round2 = (x) => Math.round(x * 100) / 100;

// Put the teacher's own transcript onto the timed cues: every teacher word goes
// to the cue its matching (or nearest) recognised word belongs to.
export function alignTranscript(teacherText, cues) {
  const teacher = (teacherText || '').split(/\s+/).filter(Boolean);
  const tt = teacher.map((raw) => ({ raw, n: tokenize(raw).map((x) => x.n).join('') })).filter((t) => t.n || t.raw);
  const heard = [];
  cues.forEach((c, ci) => tokenize(c.text).forEach((t) => heard.push({ ...t, ci })));
  if (!tt.length || !heard.length) return cues;
  const owner = new Array(tt.length).fill(null);
  align(tt.map((t) => ({ raw: t.raw, n: t.n || '\u0000' })), heard).forEach((op) => {
    if (op.si != null && op.ri != null) owner[op.si] = heard[op.ri].ci;
  });
  // Unmatched teacher words stay with the previous word, unless a sentence
  // ends between them; then (and at the start) they join the next one.
  for (let i = 1; i < owner.length; i += 1) {
    if (owner[i] == null && owner[i - 1] != null && !endsSentence(tt[i - 1].raw, tt[i].raw)) owner[i] = owner[i - 1];
  }
  let nextKnown = null;
  for (let i = owner.length - 1; i >= 0; i -= 1) {
    if (owner[i] == null) owner[i] = nextKnown; else nextKnown = owner[i];
  }
  for (let i = 0; i < owner.length; i += 1) if (owner[i] == null) owner[i] = i ? owner[i - 1] : 0;
  // Cue owners must never go backwards.
  for (let i = 1; i < owner.length; i += 1) if (owner[i] < owner[i - 1]) owner[i] = owner[i - 1];
  const texts = cues.map(() => []);
  tt.forEach((t, i) => texts[owner[i]].push(t.raw));
  return cues.map((c, i) => ({ ...c, text: texts[i].join(' ') })).filter((c) => c.text);
}

// Measure where each cue's speech really ends: the last loud frame before the
// next cue starts (long exam pauses and trailing silence are cut off).
export function refineEnds(samples, rate, cues, duration = samples.length / rate) {
  const frame = Math.max(1, Math.round(rate * 0.02));
  const nFrames = Math.floor(samples.length / frame);
  const rms = new Float32Array(nFrames);
  for (let f = 0; f < nFrames; f += 1) {
    let sum = 0;
    const o = f * frame;
    for (let k = 0; k < frame; k += 1) { const v = samples[o + k]; sum += v * v; }
    rms[f] = Math.sqrt(sum / frame);
  }
  const sorted = Float32Array.from(rms).sort();
  const floor = sorted[Math.floor(sorted.length * 0.15)] || 0;
  const loud = sorted[Math.floor(sorted.length * 0.9)] || 0;
  const threshold = Math.max(0.004, floor + (loud - floor) * 0.08);
  const frameAt = (t) => Math.max(0, Math.min(nFrames - 1, Math.floor(t / 0.02)));
  return cues.map((c, i) => {
    const limit = i + 1 < cues.length ? cues[i + 1].s : duration;
    const lo = frameAt(c.s + 0.25);
    let f = frameAt(limit - 0.03);
    while (f > lo && rms[f] < threshold) f -= 1;
    const spoken = f > lo ? (f + 1) * 0.02 : (c.e ?? Math.min(limit, c.s + 3));
    const end = Math.min(limit, Math.max(spoken, c.s + 0.4) + 0.3);
    return { ...c, e: round2(end) };
  });
}

// Consecutive groups of `size` sentences.
export function chunkCues(cues, size) {
  const out = [];
  for (let i = 0; i < cues.length; i += size) {
    const group = cues.slice(i, i + size);
    out.push({ s: group[0].s, e: group[group.length - 1].e, from: i, to: i + group.length - 1 });
  }
  return out;
}

export const fmtTime = (sec) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
