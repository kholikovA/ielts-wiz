import { taskFor, markAnswer, ratingFor } from './recall';
import { STATE } from './fsrs';

const extra = {
  ex: 'Governments must act to mitigate the effects of climate change.',
  gap: 'Governments must act to ____ the effects of climate change.',
  ans: ['mitigate'],
  forms: [{ w: 'mitigation', pos: 'noun', gap: 'Flood ____ is expensive.', ans: ['mitigation'] }],
  coll: [{ p: 'mitigate the impact', gap: 'We need to mitigate the ____ of tourism.', ans: ['impact', 'effects'] }],
};
const card = (state, reps = 0, x = extra, front = 'mitigate') => ({ front, back: 'make less severe', state, reps, extra: x });

test('new cards are met in context first', () => {
  const t = taskFor(card(STATE.NEW));
  expect(t.mode).toBe('meet');
  expect(t.reveal.sentence).toBe(extra.ex);
});

test('learning cards ask for the word itself', () => {
  const t = taskFor(card(STATE.LEARNING));
  expect(t.mode).toBe('recall');
  expect(t.sentence).toBe(extra.gap);
  expect(t.answers).toContain('mitigate');
});

test('review cards rotate through gap, form, collocation and recall', () => {
  const modes = [0, 1, 2, 3, 4].map((r) => taskFor(card(STATE.REVIEW, r)).mode);
  expect(modes).toEqual(['gap', 'form', 'coll', 'recall', 'gap']);
  expect(taskFor(card(STATE.REVIEW, 1)).answers).toContain('mitigation');
});

test('plain cards (no extra) still get typed recall; long fronts stay flip cards', () => {
  expect(taskFor(card(STATE.REVIEW, 3, undefined)).mode).toBe('recall');
  expect(taskFor(card(STATE.LEARNING, 0, undefined, 'a very long phrase that is not a word at all')).mode).toBe('flip');
});

test('markAnswer forgives case and punctuation, flags typos as almost', () => {
  expect(markAnswer('Mitigate.', ['mitigate'])).toBe('correct');
  expect(markAnswer('mitigat', ['mitigate'])).toBe('almost');
  expect(markAnswer('reduce', ['mitigate'])).toBe('wrong');
  expect(markAnswer('', ['mitigate'])).toBe('wrong');
  expect(markAnswer('pose a threat', ['pose a threat'])).toBe('correct');
  expect(markAnswer('steady', ['sharp', 'steady'])).toBe('correct');
});

test('ratingFor maps results to FSRS ratings', () => {
  expect(ratingFor('wrong', 3000, card(STATE.REVIEW))).toBe(1);
  expect(ratingFor('almost', 3000, card(STATE.REVIEW))).toBe(2);
  expect(ratingFor('correct', 9000, card(STATE.REVIEW))).toBe(3);
  expect(ratingFor('correct', 3000, card(STATE.REVIEW))).toBe(4);
  expect(ratingFor('correct', 3000, card(STATE.LEARNING))).toBe(3);
});
