#!/usr/bin/env node
/**
 * Cross-checks the authored content against the source PDF's text layer.
 *
 *   node tools/listening-part-practice/verify.mjs <pdf_pages.json> [testIds…]
 *
 * pdf_pages.json is an array of per-page strings extracted from
 * "80 IELTS Listening Tests.pdf" (e.g. with PyMuPDF: page.get_text("text")).
 * The PDF itself is not in the repo.
 *
 * Every text fragment (titles, labels, prompts, options, table cells, list
 * items) must appear in that test's own pages, word for word and in order.
 * Words may be separated by a few other words only to tolerate table cells
 * that the PDF's text layer interleaves. Intentional corrections of PDF
 * typos are declared per test in `edits` and reported, never silently passed.
 */
import fs from 'node:fs';
import { loadTests } from './build.mjs';

const argv = process.argv.slice(2);
const COVERAGE = argv.includes('--coverage');
const [pagesFile, ...only] = argv.filter((a) => a !== '--coverage');
if (!pagesFile) { console.error('usage: verify.mjs <pdf_pages.json> [ids]'); process.exit(2); }
const pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));

// Gap tokens are dropped (the PDF prints the number in a different place,
// e.g. "6 £ ……" vs "£ [6]"); so are currency symbols, for the same reason.
const words = (s) => mergeOrdinals(String(s)
  .replace(/<\/?sup>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\{\{d?(\d+)\}\}/g, ' ')
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/[–—]/g, ' ')
  .toLowerCase()
  .replace(/[^a-z0-9£$%&']+/g, ' ')
  .split(' ').filter((w) => w && w !== "'" && w !== '£' && w !== '$'));
function ordinal(n) {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
}
function mergeOrdinals(ws) {
  const out = [];
  for (const w of ws) {
    const prev = out[out.length - 1];
    if (/^(st|nd|rd|th)$/.test(w) && /^\d+$/.test(prev || '') && ordinal(+prev) === w) out[out.length - 1] += w;
    else out.push(w);
  }
  return out;
}

// ---- locate each test's pages (questions only: pages 4–125)
const starts = {};
pages.forEach((p, i) => {
  if (i < 3 || i > 127) return;
  for (const m of p.matchAll(/TEST\s+(\d+)\b/g)) if (!(m[1] in starts)) starts[m[1]] = i;
});
function testWords(id) {
  const a = starts[id];
  const b = starts[id + 1] ?? 128;
  return words(pages.slice(a, Math.max(a + 1, b)).join(' \n '));
}

/** fragment words appear in order, each within `gap` words of the previous;
 *  returns the matched positions (all occurrences' first match) or null */
function locate(frag, hay, gap = 14, taken = null) {
  if (!frag.length) return [];
  return (taken && locateFrom(frag, hay, gap, taken)) || locateFrom(frag, hay, gap, null);
}
function locateFrom(frag, hay, gap, avoid) {
  outer: for (let s = 0; s < hay.length; s++) {
    if (avoid && avoid.has(s)) continue;
    if (hay[s] !== frag[0]) continue;
    const hits = [s];
    for (let k = 1; k < frag.length; k++) {
      let hit = -1;
      for (let j = hits[k - 1] + 1; j <= Math.min(hay.length - 1, hits[k - 1] + gap); j++) if (hay[j] === frag[k]) { hit = j; break; }
      if (hit < 0) continue outer;
      hits.push(hit);
    }
    return hits;
  }
  return null;
}
const found = (frag, hay, gap) => locate(frag, hay, gap) !== null;

function fragments(g) {
  const out = [];
  const push = (s) => { if (s != null && String(s).trim()) out.push(String(s)); };
  push(g.title); push(g.subtitle); push(g.bankTitle); push(g.legendTitle); push(g.itemsTitle);
  for (const r of g.rows || []) {
    if (!Array.isArray(r) && r.h) { push(r.h); continue; }
    const cells = Array.isArray(r) ? r : r.cells;
    for (const c of cells) {
      if (c && typeof c === 'object' && 'ex' in c) push(c.ex);
      else push(typeof c === 'object' && c ? c.html : c);
    }
  }
  for (const h of g.head || []) push(typeof h === 'object' ? h.html : h);
  for (const sec of g.sections || []) {
    push(sec.h);
    for (const it of sec.items) {
      if (typeof it === 'string') push(it);
      else { push(it.html); push(it.ex); push(it.exHtml); }
    }
  }
  for (const it of g.items || []) {
    if (typeof it === 'string') push(it);
    else { push(it.q); push(it.html); (it.o || []).forEach(push); }
  }
  if (g.example) { push(g.example.q); g.example.o.forEach(push); }
  (g.o || []).forEach(push); push(g.q);
  (g.bank || []).forEach(push); (g.legend || []).forEach(push);
  (g.boxes || []).forEach(push); (g.paras || []).forEach(push);
  return out;
}

// Instructions: the word-limit phrase must match the PDF (standardised
// spellings of the same instruction are declared as edits).
const LIMIT = /(NO MORE THAN [A-Z ]+?(?: AND\/OR (?:A |TWO )?NUMBERS?)?|ONE WORD(?: ONLY| AND\/OR (?:A |TWO )?NUMBERS?)?)(?= for|<\/strong>)/;

const tests = await loadTests();
let problems = 0;
for (const t of tests) {
  if (only.length && !only.includes(String(t.id))) continue;
  const hay = testWords(t.id);
  const edits = t.edits || [];
  const allowed = (frag) => edits.some((e) => words(frag).join(' ').includes(words(e.to).join(' ')));
  const misses = [];
  const covered = new Set();
  for (const g of t.groups) {
    for (const f of fragments(g)) {
      const w = words(f);
      const at = locate(w, hay, 14, covered);
      if (at) at.forEach((i) => covered.add(i));
      else if (!allowed(f)) misses.push(f.replace(/<[^>]+>/g, '').slice(0, 110));
    }
    for (const x of [g.instr, g.q]) { const at = x && locate(words(x), hay, 14, covered); if (at) at.forEach((i) => covered.add(i)); }
    const lim = (g.instr || '').replace(/<[^>]+>/g, '').match(/Write (.+?) for each answer/);
    if (lim && !found(words(lim[1]), hay) && !allowed(lim[1])) misses.push(`[instruction] ${lim[1]}`);
  }
  // Gap position: the PDF prints each question number at its blank, so the
  // word just before (or after) {{n}} must sit within a few words of "n".
  for (const g of t.groups) for (const f of fragments(g)) {
    if (allowed(f)) continue;
    const seen = new Set();
    for (const m of f.matchAll(/\{\{d?(\d+)\}\}/g)) {
      if (seen.has(m[1])) continue; // second box of a two-box question: number printed once
      seen.add(m[1]);
      const before = words(f.slice(0, m.index)).slice(-1)[0];
      const after = words(f.slice(m.index + m[0].length))[0];
      if (!before && !after) continue;
      const lead = f.match(/\{\{d?\d+\}\}/g).length === 1 ? words(f).slice(0, 3) : null;
      const ok = hay.some((w, i) => w === m[1] && (
        (lead && lead.length && hay.slice(i + 1, i + 1 + lead.length).join(' ') === lead.join(' ')) ||
        (before && hay.slice(Math.max(0, i - 4), i).includes(before)) ||
        (after && hay.slice(i + 1, i + 5).includes(after))));
      if (!ok) { problems++; console.log(`Test ${t.id}: gap ${m[1]} not next to "${before || ''} … ${after || ''}" in PDF`); }
    }
  }
  if (COVERAGE) {
    // runs of ≥4 PDF words that no fragment accounts for — possible omissions
    let run = [];
    const flush = () => { if (run.length >= 4) console.log(`  Test ${t.id} uncovered: ${run.join(' ')}`); run = []; };
    hay.forEach((w, i) => { if (covered.has(i) || /^\d+$/.test(w)) flush(); else run.push(w); });
    flush();
  }
  for (const e of edits) console.log(`  Test ${t.id} edit: "${e.from}" -> "${e.to}"${e.why ? ` (${e.why})` : ''}`);
  if (misses.length) {
    problems += misses.length;
    console.log(`Test ${t.id}: ${misses.length} fragment(s) not found in PDF`);
    misses.forEach((m) => console.log(`    · ${m}`));
  }
}
console.log(problems ? `\n${problems} unverified fragment(s)` : '\nall fragments verified against the PDF');
process.exit(problems ? 1 : 0);
