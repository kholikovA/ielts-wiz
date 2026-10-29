// SAT question bank (College Board question bank exports) -> quiz questions.
// A bank row: { id, test: 'math'|'rw', domain, skill, difficulty, type: 'mcq'|'spr', content, key }
//   content.prompt     [paragraph | { img: [...] }] (text, with tables/graphs as images)
//                      or content.prompt_img [{ src, w, h }] (the whole prompt cut from the PDF)
//   content.options    [{ text } | { img: [...] }] (mcq)
//   key.answer         0-3 (mcq) | key.accepted [strings] (spr); key.rationale [paragraphs] | key.rationale_img [...]; key.note

export const SAT_TESTS = { math: 'Math', rw: 'Reading and Writing' };
export const SAT_DOMAINS = {
  math: {
    Algebra: ['Linear equations in one variable', 'Linear functions', 'Linear equations in two variables', 'Systems of two linear equations in two variables', 'Linear inequalities in one or two variables'],
    'Advanced Math': ['Equivalent expressions', 'Nonlinear equations in one variable and systems of equations in two variables', 'Nonlinear functions'],
    'Problem-Solving and Data Analysis': ['Ratios, rates, proportional relationships, and units', 'Percentages', 'One-variable data: Distributions and measures of center and spread', 'Two-variable data: Models and scatterplots', 'Probability and conditional probability', 'Inference from sample statistics and margin of error', 'Evaluating statistical claims: Observational studies and experiments'],
    'Geometry and Trigonometry': ['Area and volume', 'Lines, angles, and triangles', 'Right triangles and trigonometry', 'Circles'],
  },
  rw: {
    'Information and Ideas': ['Central Ideas and Details', 'Inferences', 'Command of Evidence'],
    'Craft and Structure': ['Words in Context', 'Text Structure and Purpose', 'Cross-Text Connections'],
    'Expression of Ideas': ['Rhetorical Synthesis', 'Transitions'],
    'Standard English Conventions': ['Boundaries', 'Form, Structure, and Sense'],
  },
};
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const imgs = (list, url) => (list || []).map((i) => `![](${url(i.src)}#w=${i.w})`).join('\n\n');

/** Bank row -> quiz question (for splitTest). url(src) gives an image's public URL. */
export function bankToQuiz(row, url) {
  const c = row.content || {};
  const k = row.key || {};
  let prompt = '';
  let passage = '';
  if (c.prompt?.length) {
    const part = (p) => (typeof p === 'string' ? p : imgs(p.img, url));
    const last = c.prompt[c.prompt.length - 1];
    // Reading and Writing: passage on the left, the question itself on the right (as in Bluebook).
    if (row.test === 'rw' && c.prompt.length > 1 && typeof last === 'string') {
      passage = c.prompt.slice(0, -1).map(part).join('\n\n');
      prompt = last;
    } else prompt = c.prompt.map(part).join('\n\n');
  } else if (row.test === 'rw') passage = imgs(c.prompt_img, url);
  else prompt = imgs(c.prompt_img, url);
  let explanation = k.rationale?.length ? k.rationale.join('\n\n') : imgs(k.rationale_img, url);
  if (k.note) explanation = `${k.note}\n\n${explanation}`;
  const bank = { id: row.id, test: row.test, domain: row.domain, skill: row.skill, difficulty: row.difficulty };
  const base = { id: `q${row.id}`, prompt, explanation, bank, ...(passage ? { passage } : {}) };
  if (row.type === 'mcq') {
    return { ...base, type: 'mcq', options: (c.options || []).map((o) => (o.text != null ? o.text : imgs(o.img, url))), answer: [k.answer] };
  }
  return { ...base, type: 'short', numeric: true, accepted: (k.accepted || []).join('\n'), lead: '', keyword: '', limit: '' };
}

/** Bank question ids already in assignments for these students (assigned, or only submitted). */
export function usedBankIds(assignments, studentIds, mode = 'assigned') {
  const who = new Set(studentIds);
  const used = new Set();
  (assignments || []).forEach((a) => {
    if (a.kind !== 'quiz') return;
    const hit = mode === 'submitted'
      ? (a.submissions || []).some((s) => who.has(s.student_id) && s.status === 'submitted')
      : (a.assignment_recipients || []).some((r) => who.has(r.student_id));
    if (!hit) return;
    (a.payload?.sections || []).forEach((s) => s.questions.forEach((q) => {
      const id = q.bank?.id || (/^q[0-9a-f]{8}$/.test(q.id) ? q.id.slice(1) : null);
      if (id) used.add(id);
    }));
  });
  return used;
}

// SAT pace: Math 35 min per 22 questions, Reading and Writing 32 min per 27.
export const satPaceMinutes = (n, test) => Math.max(1, Math.round(test === 'rw' ? (n * 32) / 27 : (n * 35) / 22));
