// IELTS question bank: tests stored in ielts_tests in the main site's player spec
// format (the same JSON as src/data/tests/*). Pure helpers, no React.
//
// A bank test plays at /reading-test/bank-<uuid> or /listening-test/bank-<uuid> and
// records as kind reading_full / listening_full with test_id bank_<uuid>, so homework
// completion and progress work exactly like the built-in tests.

export const SKILLS = [
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
];

export const bankKind = (skill) => (skill === 'listening' ? 'listening_full' : 'reading_full');
export const bankTestId = (id) => `bank_${id}`;
export const bankHref = (skill, id) => `/${skill === 'listening' ? 'listening' : 'reading'}-test/bank-${id}`;
export const bankSlugId = (slug) => (typeof slug === 'string' && slug.startsWith('bank-') ? slug.slice(5) : null);

// The catalog entry the assignment form uses (same shape as catalog.js entries).
export const bankCatalogEntry = (t) => ({
  kind: bankKind(t.skill),
  test_id: bankTestId(t.id),
  href: bankHref(t.skill, t.id),
  label: `${t.skill === 'listening' ? 'Listening' : 'Reading'}: ${t.title}`,
});

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
const LABELLING = new Set(['map_labelling', 'plan_labelling', 'diagram_labelling']);

export const groupNeedsImage = (skill, g) => (skill === 'listening'
  ? LABELLING.has(g.type) && !g.image_url
  : g.type === 'diagram_completion' && Boolean(g.needs_image) && !/<img\b/i.test(g.layout?.body_html || ''));

export const allQuestionNumbers = (spec) => [...new Set((spec?.parts || [])
  .flatMap((p) => (p.question_groups || []).flatMap((g) => (g.questions || []).map((q) => Number(q.number)))))]
  .filter((n) => Number.isFinite(n))
  .sort((a, b) => a - b);

function gapsInGroup(g) {
  let n = 0;
  const count = (s) => { if (typeof s === 'string') n += (s.match(/___/g) || []).length; };
  if (g.layout) {
    count(g.layout.body_html);
    (g.layout.sections || []).forEach((sec) => (sec.items || []).forEach((it) => count(it.html)));
  }
  if (g.flowchart) (g.flowchart.steps || []).forEach((s) => count(s.html));
  (g.questions || []).forEach((q) => count(q.prompt_html));
  return n;
}

// Will this spec render and grade? Mirrors tools/content-pipeline/schema.mjs.
// errors block saving; warnings are shown to the admin.
export function validateSpec(spec, skill) {
  const errors = [];
  const warnings = [];
  const types = skill === 'listening' ? LISTENING_TYPES : READING_TYPES;
  if (!spec || typeof spec !== 'object') return { errors: ['The test is empty.'], warnings, questions: 0 };
  if (!String(spec.title || '').trim()) errors.push('Give the test a title.');
  if (!Array.isArray(spec.parts) || !spec.parts.length) errors.push('No parts were found.');

  const key = spec.answer_key || {};
  (spec.parts || []).forEach((part, pi) => {
    const where0 = skill === 'listening' ? `Part ${part.part_number ?? pi + 1}` : `Passage ${part.part_number ?? pi + 1}`;
    if (skill === 'reading' && !(part.passage_paragraphs || []).length) errors.push(`${where0}: the passage text is missing.`);
    (part.question_groups || []).forEach((g) => {
      const nums = (g.questions || []).map((q) => q.number);
      const where = `${where0}, questions ${nums.length ? `${Math.min(...nums)}–${Math.max(...nums)}` : '?'}`;
      if (!types.has(g.type)) errors.push(`${where}: "${g.type}" isn't a ${skill} question type the player supports.`);
      if (!nums.length) errors.push(`${where}: no questions.`);
      if (g.type === 'mcq' && (g.questions || []).some((q) => !(q.options || []).length)) errors.push(`${where}: a multiple-choice question has no options.`);
      if (g.type === 'mcq_multi' && !(g.questions || []).some((q) => (q.options || []).length)) errors.push(`${where}: the options are missing.`);
      if (g.type === 'matching_headings') {
        const letters = new Set((part.passage_paragraphs || []).map((p) => (typeof p === 'object' ? p.letter : null)).filter(Boolean));
        if ((g.questions || []).some((q) => !letters.has(q.paragraph))) errors.push(`${where}: the passage paragraphs need letters that match the headings questions.`);
      }
      if (groupNeedsImage(skill, g)) warnings.push(`${where}: add the picture for this ${g.type.replace(/_/g, ' ')}.`);
      if (/completion|short_answer/.test(g.type)) {
        const gaps = gapsInGroup(g);
        if (gaps && gaps !== nums.length) warnings.push(`${where}: ${gaps} gaps for ${nums.length} questions.`);
      }
    });
  });

  const nums = allQuestionNumbers(spec);
  const missing = nums.filter((n) => {
    const v = key[String(n)];
    return v == null || (Array.isArray(v) ? !v.length : !String(v).trim());
  });
  if (missing.length) warnings.push(`No answer for question${missing.length > 1 ? 's' : ''} ${compactRanges(missing)}. Students can take it, but those questions can't be marked.`);
  if (skill === 'listening' && !spec.audio_url) warnings.push('Add the audio.');
  return { errors, warnings, questions: nums.length };
}

export function compactRanges(nums) {
  const out = [];
  let start = null;
  let prev = null;
  [...nums].sort((a, b) => a - b).forEach((n) => {
    if (start == null) { start = n; prev = n; return; }
    if (n === prev + 1) { prev = n; return; }
    out.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n; prev = n;
  });
  if (start != null) out.push(start === prev ? `${start}` : `${start}–${prev}`);
  return out.join(', ');
}

// Tidy what the importer returns: numeric question numbers, string answer-key
// keys, mcq_multi answers mirrored onto every number of the group.
export function normalizeSpec(spec, skill) {
  const s = sanitizeSpec(JSON.parse(JSON.stringify(spec || {})));
  s.skill = skill;
  s.parts = (s.parts || []).map((p, i) => ({ ...p, part_number: Number(p.part_number) || i + 1, question_groups: p.question_groups || [] }));
  s.parts.forEach((p) => p.question_groups.forEach((g) => {
    g.questions = (g.questions || []).map((q) => ({ ...q, number: Number(q.number) }));
  }));
  const key = {};
  Object.entries(s.answer_key || {}).forEach(([k, v]) => {
    if (v == null) return;
    key[String(Number(k))] = Array.isArray(v) ? v.map((x) => String(x).trim().toUpperCase()) : String(v).trim();
  });
  s.parts.forEach((p) => p.question_groups.filter((g) => g.type === 'mcq_multi').forEach((g) => {
    const nums = g.questions.map((q) => q.number);
    const found = nums.map((n) => key[String(n)]).find((v) => v != null);
    if (found == null) return;
    const letters = Array.isArray(found) ? found : String(found).split(/[,/|\s]+/).filter(Boolean).map((x) => x.toUpperCase());
    nums.forEach((n) => { key[String(n)] = letters; });
  }));
  s.answer_key = key;
  s.answer_key_status = allQuestionNumbers(s).every((n) => key[String(n)] != null) ? 'complete' : 'partial';
  if (!s.duration_minutes) s.duration_minutes = skill === 'listening' ? 30 : 60;
  return s;
}

// Put an uploaded picture on a group: listening labelling uses image_url;
// reading diagrams get the picture above their labels.
export function withGroupImage(spec, skill, pi, gi, url) {
  const s = JSON.parse(JSON.stringify(spec));
  const g = s.parts[pi].question_groups[gi];
  if (skill === 'listening') g.image_url = url;
  else {
    g.layout = g.layout || {};
    g.layout.body_html = `<p><img src="${url}" alt="Diagram" style="max-width:100%;height:auto" /></p>${(g.layout.body_html || '').replace(/<p><img [^>]*><\/p>/i, '')}`;
  }
  delete g.needs_image;
  return s;
}

// Answer-key editor value: arrays show as "A, C".
export const keyText = (v) => (Array.isArray(v) ? v.join(', ') : (v ?? ''));
export function setKey(spec, n, text) {
  const s = { ...spec, answer_key: { ...(spec.answer_key || {}) } };
  const g = (s.parts || []).flatMap((p) => p.question_groups || []).find((x) => (x.questions || []).some((q) => q.number === n));
  const t = String(text);
  if (!t.trim()) delete s.answer_key[String(n)];
  else if (g?.type === 'mcq_multi') {
    const letters = t.split(/[,/|\s]+/).filter(Boolean).map((x) => x.toUpperCase());
    g.questions.forEach((q) => { s.answer_key[String(q.number)] = letters; });
  } else s.answer_key[String(n)] = t;
  return s;
}

// Uploaded files are untrusted, and the player renders spec HTML directly, so
// every string in a bank spec is cut down to simple formatting markup.
const SAFE_TAGS = new Set(['STRONG', 'B', 'EM', 'I', 'U', 'BR', 'P', 'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SPAN', 'DIV', 'SUP', 'SUB', 'SMALL', 'H3', 'H4', 'IMG']);
const SAFE_URL = /^(https:\/\/|\/(?!\/))/i;
function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const walk = (node) => {
    [...node.children].forEach((el) => {
      if (!SAFE_TAGS.has(el.tagName)) {
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE|NOSCRIPT|SVG|MATH|FORM|INPUT|BUTTON|SELECT|TEXTAREA|LINK|META)$/.test(el.tagName)) el.remove();
        else { walk(el); el.replaceWith(...el.childNodes); }
        return;
      }
      [...el.attributes].forEach((a) => {
        const n = a.name.toLowerCase();
        const ok = n === 'colspan' || n === 'rowspan' || n === 'alt'
          || (n === 'style' && !/url\(|expression|@import/i.test(a.value))
          || (n === 'src' && el.tagName === 'IMG' && SAFE_URL.test(a.value.trim()));
        if (!ok) el.removeAttribute(a.name);
      });
      if (el.tagName === 'IMG' && !el.getAttribute('src')) { el.remove(); return; }
      walk(el);
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
export function sanitizeSpec(value) {
  if (typeof value === 'string') return /<[a-z!/?]/i.test(value) ? sanitizeHtml(value) : value; // plain text stays as written
  if (Array.isArray(value)) return value.map(sanitizeSpec);
  if (value && typeof value === 'object') {
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      // URLs are checked, not parsed as HTML.
      if (k === 'image_url' || k === 'audio_url') out[k] = typeof v === 'string' && (v === '' || SAFE_URL.test(v.trim())) ? v.trim() : '';
      else out[k] = sanitizeSpec(v);
    });
    return out;
  }
  return value;
}

// Shrink a saved web page to what matters for conversion: the visible test markup
// and any inline script that holds the answers. Drops styles, media, fonts, inline
// data and attributes the converter doesn't need.
export function cleanHtml(html) {
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  doc.querySelectorAll('style, link, meta, noscript, iframe, video, audio, canvas, template, object, embed').forEach((el) => el.remove());
  doc.querySelectorAll('script').forEach((el) => {
    const code = el.textContent || '';
    const useful = !el.src && /answer|correct|key/i.test(code) && code.length < 200000;
    if (!useful) el.remove();
  });
  doc.querySelectorAll('svg').forEach((el) => {
    const text = (el.textContent || '').trim();
    el.replaceWith(doc.createTextNode(text ? ` [figure: ${text.slice(0, 400)}] ` : ' [figure] '));
  });
  doc.querySelectorAll('img').forEach((el) => {
    const alt = el.getAttribute('alt');
    el.replaceWith(doc.createTextNode(alt ? ` [image: ${alt}] ` : ' [image] '));
  });
  const keep = new Set(['class', 'id', 'colspan', 'rowspan', 'type', 'value', 'name', 'data-qnum', 'data-question', 'data-answer']);
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((a) => { if (!keep.has(a.name)) el.removeAttribute(a.name); });
  });
  const body = doc.body ? doc.body.innerHTML : doc.documentElement.outerHTML;
  const scripts = [...doc.head.querySelectorAll('script')].map((s) => s.outerHTML).join('\n');
  return `${scripts}\n${body}`.replace(/<!--[\s\S]*?-->/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });
}
