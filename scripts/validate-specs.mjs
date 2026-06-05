#!/usr/bin/env node
/**
 * Validate IELTS reading test specs against the schema + the content-integrity
 * rules that the old HTML pipeline silently violated.
 *
 * Catches, at author time, the exact bugs we hit in production:
 *   - answer keyed to a letter that isn't in the options (passage2_1 Q21: key "D", options A–C)
 *   - non-contiguous / duplicated global question numbering
 *   - answer-key gaps when status is "complete"
 *   - bare "___" note/summary gaps with no surrounding source text
 *   - dropdown matching (house style is table/drag)
 *
 * Usage:  node scripts/validate-specs.mjs [dir]   (default: src/data/tests/reading)
 * Exit non-zero if any ERROR is found (warnings don't fail the build).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || 'src/data/tests/reading';

const TFNG = new Set(['TRUE', 'FALSE', 'NOT GIVEN']);
const YNG = new Set(['YES', 'NO', 'NOT GIVEN']);
const FREE_TEXT = new Set([
  'sentence_completion', 'summary_completion', 'note_completion',
  'table_completion', 'flowchart_completion', 'diagram_completion', 'short_answer',
]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

const norm = (s) => String(s).trim().toUpperCase();
const gapCount = (html) => (String(html).match(/___/g) || []).length;

function validateSpec(path) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(m);
  const W = (m) => warnings.push(m);

  let spec;
  try { spec = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { return { path, errors: [`invalid JSON: ${e.message}`], warnings: [] }; }

  if (!spec.title) E('missing title');
  if (!Array.isArray(spec.parts) || spec.parts.length < 1 || spec.parts.length > 3)
    E('parts must be an array of 1–3 parts');

  const key = spec.answer_key || {};
  const status = spec.answer_key_status || (Object.keys(key).length ? 'complete' : 'missing');

  // qnum -> { type, options:Set<letter>, group } for answer-key cross-checks
  const qIndex = new Map();
  const allNums = [];

  for (const [pi, part] of (spec.parts || []).entries()) {
    const letters = new Set(
      (part.passage_paragraphs || [])
        .map((p) => (typeof p === 'object' ? p.letter : null))
        .filter(Boolean)
    );

    for (const g of part.question_groups || []) {
      const t = g.type;
      const qs = g.questions || [];
      const sharedOpts = (qs.find((q) => Array.isArray(q.options))?.options || g.options || [])
        .map((o) => norm(o.letter));
      const headIds = new Set((g.heading_bank || []).map((h) => String(h.id)));
      const bankLetters = new Set((g.feature_bank || []).map((b) => norm(b.letter)));
      const endLetters = new Set((g.ending_bank || []).map((b) => norm(b.letter)));

      if ((t === 'matching_info' || t === 'matching_features') && g.display_mode === 'dropdown')
        W(`P${pi + 1} ${t}: display_mode "dropdown" — house style is table`);

      // gap-integrity for completion types
      if (t === 'note_completion') {
        for (const sec of g.layout?.sections || []) {
          for (const it of sec.items || []) {
            if (it.qnum != null && String(it.html).replace(/___/g, '').trim() === '')
              E(`P${pi + 1} note_completion Q${it.qnum}: bare "___" gap with no source text`);
          }
        }
      }
      if (['summary_completion', 'table_completion', 'flowchart_completion', 'diagram_completion'].includes(t)) {
        const gaps = gapCount(g.layout?.body_html || '');
        const nq = qs.length;
        if (gaps !== nq) E(`P${pi + 1} ${t}: ${gaps} "___" markers but ${nq} questions`);
      }
      if (t === 'sentence_completion') {
        for (const q of qs)
          if (gapCount(q.prompt_html || q.prompt || '') === 0)
            W(`P${pi + 1} sentence_completion Q${q.number}: no "___" marker in prompt`);
      }
      if (t === 'sentence_endings' && endLetters.size < qs.length)
        E(`P${pi + 1} sentence_endings: ${endLetters.size} endings for ${qs.length} questions (need ≥)`);
      if (t === 'matching_headings') {
        for (const q of qs) {
          if (q.paragraph == null) E(`P${pi + 1} matching_headings Q${q.number}: missing "paragraph"`);
          else if (letters.size && !letters.has(q.paragraph))
            E(`P${pi + 1} matching_headings Q${q.number}: paragraph "${q.paragraph}" not in passage letters`);
        }
      }

      for (const q of qs) {
        if (q.number == null) { E(`P${pi + 1} ${t}: a question is missing "number"`); continue; }
        allNums.push(q.number);
        qIndex.set(q.number, { type: t, sharedOpts, headIds, bankLetters, endLetters });
      }
    }
  }

  // global numbering: contiguous 1..N, no dupes
  const seen = new Set();
  for (const n of allNums) {
    if (seen.has(n)) E(`duplicate question number ${n}`);
    seen.add(n);
  }
  const max = allNums.length ? Math.max(...allNums) : 0;
  for (let i = 1; i <= max; i++) if (!seen.has(i)) E(`question numbering gap: missing ${i}`);

  // answer-key cross-checks
  for (const [k, v] of Object.entries(key)) {
    const n = parseInt(k, 10);
    const q = qIndex.get(n);
    if (!q) { E(`answer_key has Q${k} but no such question`); continue; }
    // letters may be comma/slash/pipe/space separated (mcq_multi) or an array
    const vals = (Array.isArray(v) ? v : String(v).split(/[,/|]/))
      .map(norm).filter(Boolean);
    switch (q.type) {
      case 'tfng': vals.forEach((x) => !TFNG.has(x) && E(`Q${k}: "${x}" not a TFNG value`)); break;
      case 'yng': vals.forEach((x) => !YNG.has(x) && E(`Q${k}: "${x}" not a YNG value`)); break;
      case 'mcq': case 'mcq_multi':
        vals.forEach((x) => !q.sharedOpts.includes(x) &&
          E(`Q${k}: answer "${x}" not among options [${q.sharedOpts.join(',')}]`));
        break;
      case 'matching_headings':
        vals.forEach((x) => q.headIds.size && !q.headIds.has(String(v)) &&
          E(`Q${k}: heading id "${v}" not in heading_bank`));
        break;
      case 'matching_info': case 'matching_features':
        vals.forEach((x) => q.bankLetters.size && !q.bankLetters.has(x) &&
          E(`Q${k}: letter "${x}" not in feature_bank [${[...q.bankLetters].join(',')}]`));
        break;
      case 'sentence_endings':
        vals.forEach((x) => q.endLetters.size && !q.endLetters.has(x) &&
          E(`Q${k}: ending "${x}" not in ending_bank`));
        break;
      default: break; // free-text completion — value can't be set-validated
    }
  }

  // coverage when complete
  if (status === 'complete') {
    for (const n of allNums)
      if (!(String(n) in key)) E(`answer_key missing Q${n} (status=complete)`);
  } else {
    W(`answer_key_status="${status}" — not fully graded`);
  }

  return { path, errors, warnings };
}

const files = walk(ROOT).sort();
let totalErr = 0, totalWarn = 0;
for (const f of files) {
  const { errors, warnings } = validateSpec(f);
  totalErr += errors.length; totalWarn += warnings.length;
  const rel = f.replace(ROOT + '/', '');
  if (errors.length || warnings.length) {
    console.log(`\n${rel}`);
    errors.forEach((m) => console.log(`  ✗ ERROR  ${m}`));
    warnings.forEach((m) => console.log(`  ⚠ warn   ${m}`));
  } else {
    console.log(`  ✓ ${rel}`);
  }
}
console.log(`\n${files.length} specs — ${totalErr} errors, ${totalWarn} warnings`);
process.exit(totalErr > 0 ? 1 : 0);
