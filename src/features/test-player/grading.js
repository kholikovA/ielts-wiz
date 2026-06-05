// Scoring for reading tests — a faithful port of the standalone-HTML engine's
// grader so that scores (and therefore recorded stats) are identical to what
// the old pages produced. Pure functions, no DOM — unit-testable.

// Academic Reading raw-score → band, highest threshold first (matches the HTML).
export const BAND_TABLE = [
  [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0], [27, 6.5],
  [23, 6.0], [19, 5.5], [15, 5.0], [13, 4.5], [10, 4.0], [8, 3.5],
  [6, 3.0], [4, 2.5],
];

export function rawToBand(raw) {
  for (const [threshold, band] of BAND_TABLE) if (raw >= threshold) return band;
  return null;
}

export const normalizeAnswer = (a) =>
  a == null ? '' : String(a).trim().toLowerCase().replace(/\s+/g, ' ');

const lettersOf = (v) =>
  (Array.isArray(v) ? v : String(v).split(/[,/|]/)).map(normalizeAnswer).filter(Boolean);

// Per-question grading metadata derived from the spec. For mcq_multi we mirror
// the HTML's "slot" approach: each shared question number is assigned one of the
// group's correct letters, so the group scores 1 mark per correct letter chosen.
export function buildGradeIndex(spec) {
  const index = new Map();
  const key = spec.answer_key || {};
  for (const part of spec.parts || []) {
    for (const g of part.question_groups || []) {
      if (g.type === 'mcq_multi') {
        const qnums = (g.questions || []).map((q) => q.number).sort((a, b) => a - b);
        const correctLetters = [...new Set(lettersOf(key[qnums[0]]))].sort();
        qnums.forEach((qn, i) =>
          index.set(qn, { type: 'mcq_multi', slotLetter: correctLetters[i] || null }));
      } else {
        for (const q of g.questions || []) index.set(q.number, { type: g.type });
      }
    }
  }
  return index;
}

// Is a single question's user answer correct? Mirrors the HTML's isCorrect().
export function isCorrect(qnum, userAns, answerKey, index) {
  const correct = answerKey[qnum];
  if (correct == null || userAns == null || userAns === '') return false;

  const info = index.get(qnum) || {};
  if (info.type === 'mcq_multi') {
    if (!info.slotLetter) return false;
    const userSet = String(userAns).split(',').map(normalizeAnswer).filter(Boolean);
    return userSet.includes(normalizeAnswer(info.slotLetter));
  }
  if (Array.isArray(correct)) {
    const u = String(userAns).split(',').map(normalizeAnswer).filter(Boolean).sort();
    const c = correct.map(normalizeAnswer).sort();
    return u.length === c.length && u.every((v, i) => v === c[i]);
  }
  const acceptable = String(correct).split(/\s*[/|]\s*/).map(normalizeAnswer);
  return acceptable.includes(normalizeAnswer(userAns));
}

// Grade an entire test. `userAnswers` is a map qnum -> value (mcq_multi stores
// the comma-joined selection on every shared qnum). Returns per-question results
// plus the raw score and band (band only on full 40-question tests).
export function gradeTest(spec, userAnswers = {}) {
  const index = buildGradeIndex(spec);
  const key = spec.answer_key || {};
  const qnums = [...index.keys()].sort((a, b) => a - b);

  let correct = 0;
  const results = qnums.map((q) => {
    const ua = userAnswers[q];
    const answered = ua != null && ua !== '';
    const ok = isCorrect(q, ua, key, index);
    if (ok) correct += 1;
    return {
      q,
      userAns: answered ? ua : null,
      correctAns: key[q] ?? null,
      correct: ok,
      unanswered: !answered,
    };
  });

  const total = qnums.length;
  return { results, correct, total, band: total >= 40 ? rawToBand(correct) : null };
}
