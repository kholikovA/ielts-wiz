/**
 * Transcript files: transcripts/test_N.txt (one per test).
 *
 *   # comment
 *   [12.4] One cue (usually one sentence), starting 12.4 s into the audio.
 *   [15.0] Answer locations are marked inline: it's on the [[5|website]].
 *                                        <- blank line = new paragraph
 *   @7 Why the answer is right / why the distractor is wrong.
 *   !6 Reason the marked words need not contain the key (checked by build.mjs).
 *
 * Each question has exactly one [[n|…]] marker. For "Choose TWO" groups each
 * question number marks one of the correct options, numbered in the order heard.
 */
import fs from 'node:fs';

export function parseTranscript(text, file = 'transcript') {
  const paras = [];
  const why = {};
  const exempt = {};
  let cur = [];
  const flush = () => { if (cur.length) paras.push(cur); cur = []; };
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    const where = `${file}:${i + 1}`;
    if (!line) { flush(); return; }
    if (line.startsWith('#')) return;
    const w = line.match(/^@(\d+)\s+(.+)$/);
    if (w) {
      if (why[w[1]]) throw new Error(`${where}: second @${w[1]}`);
      why[w[1]] = w[2];
      return;
    }
    const x = line.match(/^!(\d+)\s+(.+)$/);
    if (x) { exempt[x[1]] = x[2]; return; }
    const m = line.match(/^\[(\d+(?:\.\d+)?)\]\s+(.+)$/);
    if (!m) throw new Error(`${where}: expected "[seconds] text"`);
    const parts = [];
    let rest = m[2];
    const re = /\[\[(\d+)\|([^\]|]+)\]\]/g;
    let last = 0;
    for (const mk of rest.matchAll(re)) {
      if (mk.index > last) parts.push(rest.slice(last, mk.index));
      parts.push({ q: +mk[1], x: mk[2] });
      last = mk.index + mk[0].length;
    }
    if (last < rest.length) parts.push(rest.slice(last));
    if (parts.some((p) => typeof p === 'string' && /\[\[|\]\]/.test(p))) throw new Error(`${where}: malformed marker`);
    cur.push({ t: +m[1], parts });
  });
  flush();
  // cue times must not go backwards
  let prev = -1;
  for (const p of paras) for (const c of p) {
    if (c.t < prev) throw new Error(`${file}: cue at ${c.t}s comes after ${prev}s`);
    prev = c.t;
  }
  return { paras, why, exempt };
}

export function loadTranscript(path) {
  if (!fs.existsSync(path)) return null;
  return parseTranscript(fs.readFileSync(path, 'utf8'), path.split('/').pop());
}

/** All markers in transcript order: [{ q, x, t }]. */
export function markers(tr) {
  const out = [];
  for (const p of tr.paras) for (const c of p) for (const part of c.parts) if (typeof part === 'object') out.push({ q: part.q, x: part.x, t: c.t });
  return out;
}

export const plainText = (tr) => tr.paras.map((p) => p.map((c) => c.parts.map((x) => (typeof x === 'string' ? x : x.x)).join('')).join(' ')).join('\n\n');
