// Productive review: which task a card gets, and how a typed answer is marked.
// Cards: { front, back, state, reps, extra?: { ex, gap, ans, forms, coll } }.
import { tokenize, editDistance } from './dictation/diff';
import { STATE } from './fsrs';

export const BLANK = '____';
const MAX_TYPED_WORDS = 6; // longer fronts stay as flip cards

const list = (x) => (Array.isArray(x) ? x : x ? [x] : []).map(String).filter(Boolean);
const hasGap = (s) => typeof s === 'string' && s.includes(BLANK);

/**
 * The task for one review:
 *   meet   – new card: see word, meaning and example, then "Got it"
 *   flip   – classic flip-and-rate (long fronts)
 *   recall – type the word from its meaning (and gapped example)
 *   gap    – complete the example sentence
 *   form   – type the right word-family form for a sentence
 *   coll   – complete a collocation
 * Returns { mode, label, prompt, sentence, answers, reveal }.
 */
export function taskFor(card) {
  const x = card.extra || {};
  const word = card.front;
  const reveal = { word, meaning: card.back, sentence: x.ex || null };
  if (card.state === STATE.NEW) return { mode: 'meet', label: 'New word', reveal };
  if (tokenize(word).length > MAX_TYPED_WORDS) return { mode: 'flip', label: 'Review', reveal };

  const recall = {
    mode: 'recall', label: 'Type the word', prompt: card.back,
    sentence: hasGap(x.gap) ? x.gap : null, answers: [...list(x.ans), word], reveal,
  };
  if (card.state !== STATE.REVIEW) return recall;

  const options = [recall];
  if (hasGap(x.gap)) options.push({ mode: 'gap', label: 'Complete the sentence', prompt: null, sentence: x.gap, answers: [...list(x.ans), word], reveal });
  (x.forms || []).filter((f) => f && hasGap(f.gap) && f.w).forEach((f) => options.push({
    mode: 'form', label: 'Right form', prompt: `Use a form of “${word}”${f.pos ? ` (${f.pos})` : ''}`,
    sentence: f.gap, answers: [...list(f.ans), f.w], reveal: { ...reveal, word: f.w, sentence: f.gap.replace(BLANK, f.w) },
  }));
  (x.coll || []).filter((c) => c && hasGap(c.gap) && list(c.ans).length).forEach((c) => options.push({
    mode: 'coll', label: 'Collocation', prompt: `Complete the collocation with “${word}”`,
    sentence: c.gap, answers: list(c.ans), reveal: { ...reveal, word: c.p || word, sentence: c.gap.replace(BLANK, list(c.ans)[0]) },
  }));
  // Rotate through what the card offers, starting with the more demanding tasks.
  const order = [...options.slice(1), options[0]];
  return order[(card.reps || 0) % order.length];
}

const norm = (s) => tokenize(s || '').map((t) => t.n).join(' ');

/** 'correct' | 'almost' (typo / near form) | 'wrong' */
export function markAnswer(input, answers) {
  const got = norm(input);
  if (!got) return 'wrong';
  const want = answers.map(norm).filter(Boolean);
  if (want.includes(got)) return 'correct';
  const close = want.some((w) => {
    const d = editDistance(got, w);
    return d <= (w.length <= 4 ? 1 : w.length <= 8 ? 2 : 3);
  });
  return close ? 'almost' : 'wrong';
}

/** FSRS rating from the result (1 Again · 2 Hard · 3 Good · 4 Easy). */
export function ratingFor(result, ms, card) {
  if (result === 'wrong') return 1;
  if (result === 'almost') return 2;
  return card.state === STATE.REVIEW && ms < 6000 ? 4 : 3;
}
