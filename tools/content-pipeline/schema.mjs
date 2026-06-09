// Spec validators for reading and listening tests. Pure, dependency-free, used by
// ingest.mjs (and runnable directly). Validates the same shapes the React players
// consume, so a spec that passes here will play and grade.

const READING_TYPES = new Set([
  'tfng', 'yng', 'mcq', 'mcq_multi', 'matching_headings', 'matching_info',
  'matching_features', 'sentence_endings', 'sentence_completion', 'summary_completion',
  'note_completion', 'table_completion', 'flowchart_completion', 'diagram_completion',
  'short_answer',
]);

const LISTENING_TYPES = new Set([
  'note_completion', 'form_completion', 'table_completion', 'summary_completion',
  'sentence_completion', 'short_answer', 'flowchart_completion', 'mcq', 'mcq_multi',
  'matching', 'map_labelling', 'plan_labelling', 'diagram_labelling',
]);

// Count `___` gap markers in any of the places a group puts authored text.
function gapsInGroup(g) {
  let n = 0;
  const count = (s) => { if (typeof s === 'string') n += (s.match(/___/g) || []).length; };
  if (g.layout) {
    count(g.layout.body_html);
    (g.layout.sections || []).forEach((sec) => (sec.items || []).forEach((it) => count(it.html)));
  }
  if (g.flowchart) (g.flowchart.steps || []).forEach((s) => count(s.html));
  (g.questions || []).forEach((q) => { count(q.prompt_html); });
  return n;
}

export function validateSpec(spec, skill) {
  const errors = [];
  const warnings = [];
  const types = skill === 'listening' ? LISTENING_TYPES : READING_TYPES;

  if (!spec || typeof spec !== 'object') return { errors: ['Spec is not an object'], warnings, stats: {} };
  if (!spec.title) errors.push('Missing title');
  if (!spec.duration_minutes) warnings.push('Missing duration_minutes (player will default)');
  if (!Array.isArray(spec.parts) || spec.parts.length === 0) errors.push('Missing parts[]');
  if (!spec.answer_key || typeof spec.answer_key !== 'object') errors.push('Missing answer_key');

  const qnums = [];
  (spec.parts || []).forEach((part, pi) => {
    if (part.part_number == null) errors.push(`parts[${pi}] missing part_number`);
    if (skill !== 'listening' && !part.passage_title && !part.section_title) {
      warnings.push(`parts[${pi}] has no passage_title`);
    }
    if (!Array.isArray(part.question_groups)) { errors.push(`parts[${pi}] missing question_groups[]`); return; }
    part.question_groups.forEach((g, gi) => {
      const where = `parts[${pi}].question_groups[${gi}] (${g.type})`;
      if (!g.type) errors.push(`${where}: missing type`);
      else if (!types.has(g.type)) errors.push(`${where}: unknown ${skill} type "${g.type}"`);
      if (!Array.isArray(g.questions) || g.questions.length === 0) errors.push(`${where}: no questions`);
      (g.questions || []).forEach((q) => { if (q.number != null) qnums.push(q.number); });

      // type-specific sanity
      if (g.type === 'map_labelling' || g.type === 'plan_labelling' || g.type === 'diagram_labelling') {
        if (!g.image_url) warnings.push(`${where}: no image_url (labelling image won't show)`);
        if (!g.bank) warnings.push(`${where}: no letter bank`);
      }
      if ((g.type === 'matching') && !g.bank) warnings.push(`${where}: no bank`);
      if (g.type === 'mcq' && (g.questions || []).some((q) => !q.options)) errors.push(`${where}: an mcq question has no options`);

      // completion gaps should match the number of questions in the group
      const completion = /completion|short_answer/.test(g.type);
      if (completion) {
        const gaps = gapsInGroup(g);
        const qs = (g.questions || []).length;
        if (gaps && gaps !== qs) warnings.push(`${where}: ${gaps} gaps but ${qs} questions`);
      }
    });
  });

  // answer-key coverage
  const uniqueQ = [...new Set(qnums)].sort((a, b) => a - b);
  const keyNums = Object.keys(spec.answer_key || {}).map(Number);
  const missingKeys = uniqueQ.filter((n) => !(String(n) in (spec.answer_key || {})));
  const orphanKeys = keyNums.filter((n) => !uniqueQ.includes(n));
  if (missingKeys.length) errors.push(`answer_key missing for: ${missingKeys.join(', ')}`);
  if (orphanKeys.length) warnings.push(`answer_key has extra keys with no question: ${orphanKeys.join(', ')}`);

  return {
    errors,
    warnings,
    stats: { questions: uniqueQ.length, answers: keyNums.length, parts: (spec.parts || []).length },
  };
}

// CLI: `node schema.mjs <spec.json> [reading|listening]`
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const file = process.argv[2];
  const skill = process.argv[3] || (file && file.includes('listening') ? 'listening' : 'reading');
  if (!file) { console.error('usage: node schema.mjs <spec.json> [reading|listening]'); process.exit(2); }
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { errors, warnings, stats } = validateSpec(spec, skill);
  console.log(`\n${skill} spec: ${stats.questions} questions, ${stats.answers} answers, ${stats.parts} parts`);
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  console.log(errors.length ? `\nINVALID — ${errors.length} error(s)\n` : '\nOK\n');
  process.exit(errors.length ? 1 : 0);
}
