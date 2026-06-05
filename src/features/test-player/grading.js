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

// Friendly labels per question type. mcq + mcq_multi share one bucket so the
// per-type breakdown stays readable.
const TYPE_LABELS = {
  tfng: 'True / False / Not Given', yng: 'Yes / No / Not Given',
  mcq: 'Multiple choice', mcq_multi: 'Multiple choice',
  matching_headings: 'Matching headings', matching_info: 'Matching information',
  matching_features: 'Matching features', sentence_endings: 'Sentence endings',
  sentence_completion: 'Sentence completion', summary_completion: 'Summary completion',
  note_completion: 'Note completion', table_completion: 'Table completion',
  flowchart_completion: 'Flowchart completion', diagram_completion: 'Diagram completion',
  short_answer: 'Short answer',
};

// Aggregate correct/total per question type, in first-appearance order.
export function perTypeStats(spec, grade) {
  const typeOf = {};
  spec.parts.forEach((p) => p.question_groups.forEach((g) => g.questions.forEach((q) => { typeOf[q.number] = g.type; })));
  const agg = {}; const order = [];
  (grade.results || []).forEach((r) => {
    const label = TYPE_LABELS[typeOf[r.q]] || typeOf[r.q];
    if (!label) return;
    if (!agg[label]) { agg[label] = { correct: 0, total: 0 }; order.push(label); }
    agg[label].total += 1;
    if (r.correct) agg[label].correct += 1;
  });
  return order.map((label) => ({ label, correct: agg[label].correct, total: agg[label].total, pct: agg[label].total ? Math.round((100 * agg[label].correct) / agg[label].total) : 0 }));
}

// Build a short, tailored coaching note for the results page from the score, the
// per-type breakdown, and how long the test took. Returns up to 4 {tone, text}
// items (tone drives the dot colour: good | warn | tip).
export function generateFeedback({ grade, types, elapsedSec, durationSec }) {
  const { correct, total, band, results } = grade;
  const unanswered = results.filter((r) => r.unanswered).length;
  const out = [];

  if (band != null) {
    if (band >= 8) out.push({ tone: 'good', text: `Band ${band.toFixed(1)} — expert level. You're exam-ready.` });
    else if (band >= 7) out.push({ tone: 'good', text: `Band ${band.toFixed(1)} — a 7 clears most university requirements; tighten a couple of types to push higher.` });
    else if (band >= 6) out.push({ tone: 'tip', text: `Band ${band.toFixed(1)} — you're one band off a 7, and the gaps below are where it's hiding.` });
    else if (band >= 5) out.push({ tone: 'tip', text: `Band ${band.toFixed(1)} — a solid base; targeted practice on your weak types moves this quickly.` });
    else out.push({ tone: 'warn', text: `Band ${band.toFixed(1)} — early days. Work the misses below and the score climbs fast.` });
  } else {
    const pct = total ? Math.round((100 * correct) / total) : 0;
    out.push({ tone: pct >= 70 ? 'good' : 'tip', text: `${correct} of ${total} correct (${pct}%).` });
  }

  const ranked = types.filter((t) => t.total >= 2).slice().sort((a, b) => a.pct - b.pct);
  const weakest = ranked[0];
  if (weakest && weakest.pct < 70) out.push({ tone: 'warn', text: `Weakest type: ${weakest.label} (${weakest.correct}/${weakest.total}) — make this your next focus.` });

  const strong = types.find((t) => t.total >= 3 && t.pct === 100);
  if (strong) out.push({ tone: 'good', text: `Full marks on ${strong.label} — a reliable strength to lean on.` });

  if (unanswered >= 3) out.push({ tone: 'tip', text: `${unanswered} questions left blank — there's no penalty for a wrong answer in IELTS, so always put something.` });

  if (elapsedSec != null && durationSec) {
    const spare = durationSec - elapsedSec;
    if (spare > durationSec * 0.4 && total - correct > 0) {
      out.push({ tone: 'tip', text: `You finished with about ${Math.max(1, Math.round(spare / 60))} minutes to spare — spend it re-reading the questions you weren't sure about.` });
    } else if (elapsedSec >= durationSec * 0.95) {
      out.push({ tone: 'good', text: 'You used nearly the full time — good exam-day pacing.' });
    }
  }

  return out.slice(0, 4);
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
