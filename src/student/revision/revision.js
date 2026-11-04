// Revision quizzes: data types, answer checking, run building and scoring.
// Pure functions only (no React), so they can be unit-tested. The question
// banks live in src/data/revision/*.json; add questions there, not here.

/**
 * @typedef {'junior' | 'senior'} Group
 * @typedef {'mc' | 'gap' | 'fix' | 'tf' | 'tfng'} QType
 *
 * @typedef {Object} Question
 * @property {string} id                  "J01", "S12"
 * @property {Group} group
 * @property {string} topic               key into Bank.topics
 * @property {QType} type
 * @property {string} [passage]           key into Bank.passages (tf / tfng)
 * @property {string} prompt              "___" marks the gap
 * @property {string[]} [options]         mc, fix, tf, tfng
 * @property {string | string[]} answer   mc/fix/tf/tfng: the exact option text; gap: accepted answers
 * @property {string} explain             shown after answering
 *
 * @typedef {Object} Topic
 * @property {Group} group
 * @property {string} name
 * @property {string} tip
 * @property {string} [uz]                Uzbek line (junior)
 *
 * @typedef {Object} Passage
 * @property {string} title
 * @property {string} text
 *
 * @typedef {Object} Bank
 * @property {string} title
 * @property {Object<string, Topic>} topics
 * @property {Object<string, Passage>} passages
 * @property {Question[]} questions
 */

export const GROUPS = [
  { value: 'junior', label: 'Junior', level: 'Pre-Intermediate' },
  { value: 'senior', label: 'Senior', level: 'Pre-IELTS' },
];

export const CHOICE_TYPES = ['mc', 'fix', 'tf', 'tfng'];
const SHUFFLE_OPTIONS = ['mc', 'fix'];
export const TIP_THRESHOLD = 0.7;

// Gap answers: trim, lowercase, collapse spaces, straighten curly apostrophes,
// drop one final full stop.
export const normaliseGap = (s) => String(s ?? '')
  .replace(/[‘’]/g, "'")
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\.$/, '')
  .trim();

/** @param {Question} q @param {string | undefined} given */
export function isCorrect(q, given) {
  if (given == null || given === '') return false;
  if (q.type === 'gap') {
    const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
    const v = normaliseGap(given);
    return accepted.some((a) => normaliseGap(a) === v);
  }
  return given === q.answer;
}

// The answer as shown to students ("will rain / 'll rain" for gaps).
export const answerText = (q) => (Array.isArray(q.answer) ? q.answer.join(' / ') : q.answer);

export function shuffle(list, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build one run of the quiz: filter, shuffle the question order (questions on
 * the same passage stay together, in their given order), and shuffle the
 * options of mc / fix questions. tf / tfng options never move.
 * Returns [{ q, options }].
 * @param {Bank} bank
 * @param {{ group: Group, topics?: string[], ids?: string[], rand?: () => number }} opts
 */
export function buildRun(bank, { group, topics, ids, rand = Math.random }) {
  const pool = bank.questions.filter((q) => q.group === group
    && (!topics || topics.includes(q.topic))
    && (!ids || ids.includes(q.id)));
  const units = [];
  const byPassage = new Map();
  pool.forEach((q) => {
    if (!q.passage) { units.push([q]); return; }
    if (!byPassage.has(q.passage)) { byPassage.set(q.passage, []); units.push(byPassage.get(q.passage)); }
    byPassage.get(q.passage).push(q);
  });
  return shuffle(units, rand).flat().map((q) => ({
    q,
    options: q.options ? (SHUFFLE_OPTIONS.includes(q.type) ? shuffle(q.options, rand) : [...q.options]) : null,
  }));
}

/**
 * Score a finished run. answers: { [questionId]: string }.
 * byTopic keeps the bank's topic order.
 */
export function score(bank, run, answers) {
  const rows = run.map(({ q }) => ({ q, given: answers[q.id] ?? '', ok: isCorrect(q, answers[q.id]) }));
  const correct = rows.filter((r) => r.ok).length;
  const counts = new Map();
  rows.forEach((r) => {
    const t = counts.get(r.q.topic) || { correct: 0, total: 0 };
    t.total += 1;
    if (r.ok) t.correct += 1;
    counts.set(r.q.topic, t);
  });
  const byTopic = Object.keys(bank.topics)
    .filter((key) => counts.has(key))
    .map((key) => {
      const t = counts.get(key);
      return { key, ...bank.topics[key], correct: t.correct, total: t.total, pct: t.correct / t.total };
    });
  return {
    rows,
    correct,
    total: rows.length,
    pct: rows.length ? Math.round((correct / rows.length) * 100) : 0,
    byTopic,
    weak: byTopic.filter((t) => t.pct < TIP_THRESHOLD),
    wrongIds: rows.filter((r) => !r.ok).map((r) => r.q.id),
  };
}

// ── Best score, per account and group, on this device ──────────────────────
// localStorage can be blocked (private windows, strict settings): every access
// is wrapped so the quiz still works without it.
const bestKey = (quizId, uid) => `iw.v1.revision.${quizId}.best.${uid || 'anon'}`;

export function readBest(quizId, uid) {
  try { return JSON.parse(localStorage.getItem(bestKey(quizId, uid))) || {}; } catch { return {}; }
}

/** Saves when it beats the stored best. Returns true when it's a new best. */
export function saveBest(quizId, uid, group, result) {
  const all = readBest(quizId, uid);
  const prev = all[group];
  if (prev && (prev.pct > result.pct || (prev.pct === result.pct && prev.correct >= result.correct))) return false;
  all[group] = { correct: result.correct, total: result.total, pct: result.pct, at: new Date().toISOString() };
  try { localStorage.setItem(bestKey(quizId, uid), JSON.stringify(all)); } catch { return false; }
  return true;
}

// ── Bank checks (used by the test) ─────────────────────────────────────────
/** @param {Bank} bank @returns {string[]} problems, empty when the bank is valid */
export function validateBank(bank) {
  const problems = [];
  const seen = new Set();
  bank.questions.forEach((q) => {
    if (seen.has(q.id)) problems.push(`${q.id}: duplicate id`);
    seen.add(q.id);
    if (!bank.topics[q.topic]) problems.push(`${q.id}: unknown topic "${q.topic}"`);
    else if (bank.topics[q.topic].group !== q.group) problems.push(`${q.id}: topic "${q.topic}" belongs to another group`);
    if (!['junior', 'senior'].includes(q.group)) problems.push(`${q.id}: unknown group "${q.group}"`);
    if (!q.explain) problems.push(`${q.id}: missing explanation`);
    if (CHOICE_TYPES.includes(q.type)) {
      const hits = (q.options || []).filter((o) => o === q.answer).length;
      if (typeof q.answer !== 'string') problems.push(`${q.id}: answer must be one option's text`);
      else if (hits !== 1) problems.push(`${q.id}: answer appears ${hits} times in options`);
      if (new Set(q.options || []).size !== (q.options || []).length) problems.push(`${q.id}: repeated option`);
    } else if (q.type === 'gap') {
      if (!q.prompt.includes('___')) problems.push(`${q.id}: gap prompt has no ___`);
      if (!Array.isArray(q.answer) || !q.answer.length) problems.push(`${q.id}: gap answer must be a non-empty list`);
    } else {
      problems.push(`${q.id}: unknown type "${q.type}"`);
    }
    if (q.passage && !bank.passages[q.passage]) problems.push(`${q.id}: passage "${q.passage}" does not exist`);
    if ((q.type === 'tf' || q.type === 'tfng') && !q.passage) problems.push(`${q.id}: reading question without a passage`);
  });
  return problems;
}
