// Custom tests ("quiz" homework): question model, answer key split, marking.
//
// The teacher edits full questions (with answers). On save they're split into
//   payload: sections + questions without answers (what students load)
//   key:     { [questionId]: answer }       (readable by a student only after submitting)
//
// Question types (all auto-marked except open):
//   mcq      prompt, options[], answer: [indices]; multi when more than one is correct
//   tfng     prompt (a statement), variant tfng | ynng | tf, answer 'T' | 'F' | 'NG'
//   gap      text with {answer|alternative} gaps; optional word bank (+ distractors) and word limit
//   match    left[] to right[], answer: [right index per left]; reuse allowed or not
//   short    prompt (+ optional lead / keyword), answer: [accepted answers]
//            (short answers, sentence transformation, error correction)
//   reorder  answer: [the correct sentence, alternatives...]; students get the words shuffled
//   open     prompt, points; marked by the teacher

export const TYPES = {
  mcq: { label: 'Multiple choice' },
  tfng: { label: 'True / False / Not Given' },
  gap: { label: 'Fill in the gaps' },
  match: { label: 'Matching' },
  short: { label: 'Short answer / rewrite' },
  reorder: { label: 'Put the words in order' },
  open: { label: 'Open answer (you mark it)' },
};

export const VARIANTS = {
  tfng: [['T', 'True'], ['F', 'False'], ['NG', 'Not Given']],
  ynng: [['T', 'Yes'], ['F', 'No'], ['NG', 'Not Given']],
  tf: [['T', 'True'], ['F', 'False']],
};

const GAP_RE = /\{([^{}]+)\}/g;

export const normalize = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/[‘’`´]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .replace(/^[\s"'.,;:!?]+|[\s"'.,;:!?]+$/g, '')
  .trim();

// "{has lived|'s lived}" gaps -> [["has lived", "'s lived"], ...]
export function parseGaps(text) {
  const gaps = [];
  String(text || '').replace(GAP_RE, (_, inner) => {
    gaps.push(inner.split('|').map((x) => x.trim()).filter(Boolean));
    return '';
  });
  return gaps;
}

// Text for students: gaps become {{1}}, {{2}}…
export const maskGaps = (text) => {
  let n = 0;
  return String(text || '').replace(GAP_RE, () => { n += 1; return `{{${n}}}`; });
};

// Small deterministic shuffle (same order every time for the same seed).
export function shuffle(list, seed = 'x') {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const splitLines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
export const reorderTiles = (sentence) => String(sentence || '').trim().split(/\s+/).filter(Boolean);

// How many marks / numbered answers a question has.
export function partsOf(q) {
  switch (q.type) {
    case 'gap': return parseGaps(q.text).length || (q.gaps || 0);
    case 'match': return (q.left || []).filter((l) => String(l).trim()).length;
    case 'mcq': return Math.max(1, (q.answer || []).length || q.pick || 1);
    case 'open': return 1;
    default: return 1;
  }
}
export const pointsOf = (q) => (q.type === 'open' ? Number(q.points) || 5 : partsOf(q));

/** Teacher's full test -> { payload, key }. */
export function splitTest(test) {
  const key = {};
  const sections = (test.sections || []).map((s) => ({
    id: s.id, title: s.title || '', instructions: s.instructions || '', passage: s.passage || '', audio_url: s.audio_url || '',
    questions: (s.questions || []).map((q) => {
      const base = { id: q.id, type: q.type, prompt: q.prompt || '', points: pointsOf(q), ...(q.image ? { image: q.image } : {}) };
      switch (q.type) {
        case 'mcq':
          key[q.id] = [...(q.answer || [])].sort((a, b) => a - b);
          return { ...base, options: q.options || [], multi: (q.answer || []).length > 1, pick: (q.answer || []).length || 1 };
        case 'tfng':
          key[q.id] = q.answer || 'T';
          return { ...base, variant: q.variant || 'tfng' };
        case 'gap': {
          const gaps = parseGaps(q.text);
          key[q.id] = gaps;
          const bank = q.bank ? shuffle([...gaps.map((g) => g[0]), ...splitLines(q.distractors)], q.id) : null;
          return { ...base, text: maskGaps(q.text), gaps: gaps.length, bank, limit: q.limit || '' };
        }
        case 'match': {
          // Drop blank lines, remapping answers to the remaining options.
          const keepL = (q.left || []).map((l, i) => [String(l).trim(), i]).filter(([l]) => l);
          const keepR = (q.right || []).map((r, i) => [String(r).trim(), i]).filter(([r]) => r);
          const newR = new Map(keepR.map(([, i], k) => [i, k]));
          key[q.id] = keepL.map(([, i]) => newR.get((q.answer || [])[i]) ?? null);
          return { ...base, points: keepL.length, left: keepL.map(([l]) => l), right: keepR.map(([r]) => r), reuse: Boolean(q.reuse) };
        }
        case 'short':
          key[q.id] = splitLines(q.accepted);
          return { ...base, lead: q.lead || '', keyword: q.keyword || '', limit: q.limit || '' };
        case 'reorder': {
          const accepted = splitLines(q.accepted);
          key[q.id] = accepted;
          return { ...base, tiles: shuffle(reorderTiles(accepted[0]), q.id) };
        }
        default:
          key[q.id] = null;
          return { ...base, min_words: Number(q.min_words) || 0 };
      }
    }),
  }));
  return { payload: { sections }, key };
}

/** Rebuild the teacher's editable test from payload + key (duplicate / edit). */
export function joinTest(payload, key) {
  return {
    sections: (payload?.sections || []).map((s) => ({
      ...s,
      questions: (s.questions || []).map((q) => {
        const k = key?.[q.id];
        switch (q.type) {
          case 'mcq': return { ...q, answer: k || [] };
          case 'tfng': return { ...q, answer: k || 'T' };
          case 'gap': {
            let i = -1;
            const text = String(q.text || '').replace(/\{\{(\d+)\}\}/g, () => { i += 1; return `{${(k?.[i] || ['']).join('|')}}`; });
            const firsts = new Set((k || []).map((g) => normalize(g[0])));
            const distractors = (q.bank || []).filter((w) => !firsts.has(normalize(w))).join('\n');
            return { ...q, text, bank: Boolean(q.bank), distractors };
          }
          case 'match': return { ...q, answer: k || [] };
          case 'short': case 'reorder': return { ...q, accepted: (k || []).join('\n') };
          default: return q;
        }
      }),
    })),
  };
}

const matches = (given, accepted) => {
  const g = normalize(given);
  return Boolean(g) && accepted.some((a) => normalize(a) === g);
};

/**
 * Mark one question. answer is the student's response:
 *   mcq [indices] · tfng 'T'|'F'|'NG' · gap [strings] · match [indices] · short string · reorder string · open string
 * Returns { earned, possible, parts: [true|false…], manual? }.
 */
export function markQuestion(q, k, answer) {
  switch (q.type) {
    case 'mcq': {
      const want = new Set(k || []);
      const got = Array.isArray(answer) ? answer : answer != null ? [answer] : [];
      if (!q.multi) {
        const ok = got.length === 1 && want.has(got[0]);
        return { earned: ok ? 1 : 0, possible: 1, parts: [ok] };
      }
      // One mark per correct option chosen (IELTS "Choose TWO"); extra picks beyond the limit are ignored.
      const hits = new Set(got.slice(0, want.size).filter((x) => want.has(x))).size;
      return { earned: hits, possible: want.size, parts: [...want].map((_, i) => i < hits) };
    }
    case 'tfng': {
      const ok = answer === k;
      return { earned: ok ? 1 : 0, possible: 1, parts: [ok] };
    }
    case 'gap': {
      const parts = (k || []).map((accepted, i) => matches(answer?.[i], accepted));
      return { earned: parts.filter(Boolean).length, possible: parts.length, parts };
    }
    case 'match': {
      const parts = (k || []).map((right, i) => answer?.[i] != null && Number(answer[i]) === Number(right));
      return { earned: parts.filter(Boolean).length, possible: parts.length, parts };
    }
    case 'short': case 'reorder': {
      // Students often retype the given start ("I have known…"); accept that too.
      const accepted = k || [];
      const withLead = q.lead ? accepted.map((x) => `${q.lead} ${x}`) : [];
      const ok = matches(answer, [...accepted, ...withLead]);
      return { earned: ok ? 1 : 0, possible: 1, parts: [ok] };
    }
    default:
      return { earned: 0, possible: Number(q.points) || 5, parts: [], manual: true };
  }
}

/** Mark the whole test. manual = { [questionId]: points } from the teacher for open answers. */
export function markTest(payload, key, answers, manual = {}) {
  const items = {};
  let earned = 0; let possible = 0; let pendingManual = 0;
  (payload?.sections || []).forEach((s) => s.questions.forEach((q) => {
    const r = markQuestion(q, key?.[q.id], answers?.[q.id]);
    if (r.manual) {
      const given = manual?.[q.id];
      if (given == null) pendingManual += r.possible;
      else r.earned = Math.max(0, Math.min(r.possible, Number(given)));
    }
    items[q.id] = r;
    earned += r.earned;
    possible += r.possible;
  }));
  return { earned, possible, pendingManual, percent: possible ? Math.round((earned / possible) * 100) : 0, items };
}

// Question numbers across the whole test (a 3-gap question takes 3 numbers).
export function numbering(payload) {
  const out = {};
  let n = 1;
  (payload?.sections || []).forEach((s) => s.questions.forEach((q) => {
    const parts = q.type === 'gap' ? q.gaps : q.type === 'match' ? q.left.length : q.type === 'mcq' && q.multi ? q.pick : 1;
    out[q.id] = { from: n, to: n + parts - 1 };
    n += parts;
  }));
  return out;
}

export const newId = () => Math.random().toString(36).slice(2, 10);

// ── Class analysis ──────────────────────────────────────────────────────────
// What one part of a question looks like as text: a student's answer or the key.
function partText(q, value, i) {
  switch (q.type) {
    case 'gap': return String(value?.[i] ?? '').trim();
    case 'match': return value?.[i] != null && q.right?.[value[i]] != null ? q.right[value[i]] : '';
    case 'mcq': {
      const list = Array.isArray(value) ? value : value != null ? [value] : [];
      return [...list].sort((a, b) => a - b).map((x) => q.options?.[x]).filter(Boolean).join(' + ');
    }
    case 'tfng': return value ? (VARIANTS[q.variant || 'tfng'].find(([k]) => k === value)?.[1] || value) : '';
    default: return String(value ?? '').trim();
  }
}

/** The correct answer for each part of a question, as text. */
export function keyParts(q, k) {
  switch (q.type) {
    case 'gap': return (k || []).map((alts) => alts.join(' / '));
    case 'match': return (k || []).map((r) => q.right?.[r] ?? '');
    case 'short': case 'reorder': return [(k || []).join(' / ')];
    case 'open': return [];
    default: return [partText(q, k, 0)];
  }
}

/**
 * Class results per question, from submitted quizzes.
 * Returns { students, average, questions: { [id]: { parts: [{ correct, wrong, blank, answers: [[text, count]] }], wrong, rate } } }
 * `wrong` counts students who missed any part (blank or wrong); `rate` is the worst part's miss rate.
 */
export function analyzeQuiz(payload, key, submissions) {
  const done = (submissions || []).filter((s) => s.status === 'submitted' && s.data?.answers);
  const out = {};
  let total = 0;
  (payload?.sections || []).forEach((s) => s.questions.forEach((q) => {
    const count = q.type === 'open' ? 0 : q.type === 'gap' ? q.gaps : q.type === 'match' ? q.left.length : 1;
    const parts = Array.from({ length: count }, () => ({ correct: 0, wrong: 0, blank: 0, tally: new Map() }));
    let missed = 0;
    done.forEach((sub) => {
      const value = sub.data.answers[q.id];
      if (q.type === 'open') return;
      const r = markQuestion(q, key?.[q.id], value);
      const oks = q.type === 'gap' || q.type === 'match' ? r.parts : [r.earned === r.possible];
      let any = false;
      parts.forEach((p, i) => {
        const given = partText(q, value, i);
        if (oks[i]) { p.correct += 1; return; }
        any = true;
        if (!given) { p.blank += 1; return; }
        p.wrong += 1;
        // Group spelling-identical answers; show them as the first student wrote them.
        const norm = normalize(given);
        const seen = p.tally.get(norm) || [given, 0];
        p.tally.set(norm, [seen[0], seen[1] + 1]);
      });
      if (any) missed += 1;
    });
    const n = done.length || 1;
    out[q.id] = {
      wrong: missed,
      rate: parts.length ? Math.max(...parts.map((p) => (p.wrong + p.blank) / n)) : 0,
      parts: parts.map(({ tally, ...p }) => ({ ...p, answers: [...tally.values()].sort((a, b) => b[1] - a[1]) })),
    };
  }));
  done.forEach((sub) => { total += markTest(payload, key, sub.data.answers, sub.marking?.manual).percent; });
  return { students: done.length, average: done.length ? Math.round(total / done.length) : 0, questions: out };
}
