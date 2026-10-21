// Writing marking helpers (pure).

export const CRITERIA_T1 = ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'];
export const CRITERIA_T2 = ['Task Response', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'];

// IELTS overall band: mean of the criteria, to the nearest half band (.25 / .75 round up).
export function overallBand(bands) {
  const list = bands.filter((b) => b != null && !Number.isNaN(Number(b))).map(Number);
  if (!list.length) return null;
  const mean = list.reduce((a, b) => a + b, 0) / list.length;
  return Math.floor(mean * 2 + 0.5) / 2;
}

/**
 * Place corrections in the essay. Each correction's `quote` is looked up in
 * order, after the previous one; if it isn't found there, anywhere unused.
 * Returns { parts: [{ text } | { text, c, n }], missing: [corrections not found] },
 * where `n` is the correction's 1-based number in the original list.
 */
export function placeCorrections(text, corrections = []) {
  const found = [];
  const missing = [];
  let cursor = 0;
  const taken = (s, e) => found.some((f) => s < f.end && e > f.start);
  corrections.forEach((c, i) => {
    const q = (c.quote || '').trim();
    if (!q) { missing.push(c); return; }
    let at = text.indexOf(q, cursor);
    while (at !== -1 && taken(at, at + q.length)) at = text.indexOf(q, at + 1);
    if (at === -1) {
      at = text.indexOf(q);
      while (at !== -1 && taken(at, at + q.length)) at = text.indexOf(q, at + 1);
    }
    if (at === -1) { missing.push(c); return; }
    found.push({ start: at, end: at + q.length, c, n: i + 1 });
    cursor = at + q.length;
  });
  found.sort((x, y) => x.start - y.start);
  const parts = [];
  let pos = 0;
  found.forEach((f) => {
    if (f.start > pos) parts.push({ text: text.slice(pos, f.start) });
    parts.push({ text: text.slice(f.start, f.end), c: f.c, n: f.n });
    pos = f.end;
  });
  if (pos < text.length) parts.push({ text: text.slice(pos) });
  return { parts, missing };
}

// Feedback text pre-filled from Claude's draft.
export function draftFeedback(result) {
  if (!result) return '';
  const steps = (result.next_steps || []).filter(Boolean);
  return [result.summary, steps.length ? `Next steps:\n${steps.map((s) => `• ${s}`).join('\n')}` : '']
    .filter(Boolean).join('\n\n');
}
