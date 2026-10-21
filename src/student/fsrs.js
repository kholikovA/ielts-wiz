// FSRS-5 spaced-repetition scheduler (the algorithm Anki ships by default since
// 23.10), with Anki-style learning steps and interval fuzz. Pure functions only.
//
// Memory model, per card:
//   stability  S — days until recall probability falls to 90%
//   difficulty D — 1 (easy) … 10 (hard)
//   retrievability R(t) = (1 + FACTOR·t/S)^DECAY — chance of recall t days after last review
// The next review is scheduled for when R hits DESIRED_RETENTION.
//
// Ratings: 1 Again · 2 Hard · 3 Good · 4 Easy
// States:  0 New · 1 Learning · 2 Review · 3 Relearning
// Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm

export const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
  1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];
const DECAY = -0.5;
const FACTOR = 19 / 81; // 0.9^(1/DECAY) - 1, so R(S) = 0.9
export const DESIRED_RETENTION = 0.9;
const MAX_INTERVAL = 36500;
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const STATE = { NEW: 0, LEARNING: 1, REVIEW: 2, RELEARNING: 3 };
export const RATING = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 };
export const LEARNING_STEPS = [1, 10]; // minutes
export const RELEARNING_STEPS = [10];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const clampD = (d) => clamp(d, 1, 10);

export const retrievability = (elapsedDays, s) => (s > 0 ? Math.pow(1 + (FACTOR * elapsedDays) / s, DECAY) : 0);

const initStability = (g) => Math.max(W[g - 1], 0.1);
const initDifficulty = (g) => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);

// Linear damping toward 10, then mean reversion toward D0(Easy).
const nextDifficulty = (d, g) => {
  const damped = d + (-W[6] * (g - 3) * (10 - d)) / 9;
  return clampD(W[7] * initDifficulty(4) + (1 - W[7]) * damped);
};

const recallStability = (d, s, r, g) => {
  const hard = g === RATING.HARD ? W[15] : 1;
  const easy = g === RATING.EASY ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * hard * easy);
};

const forgetStability = (d, s, r) => {
  const sf = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);
  return Math.min(sf, s / Math.exp(W[17] * W[18]));
};

// Same-day (intra-learning) review.
const shortTermStability = (s, g) => s * Math.exp(W[17] * (g - 3 + W[18]));

export const intervalFor = (s) =>
  clamp(Math.round((s / FACTOR) * (Math.pow(DESIRED_RETENTION, 1 / DECAY) - 1)), 1, MAX_INTERVAL);

// Anki-style fuzz so cards learned together don't stay clumped forever.
// Deterministic per (card, rep) so the preview label matches what's scheduled.
function fuzz(ivl, seed) {
  if (ivl < 2.5) return ivl;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = ((h >>> 0) % 10000) / 10000;
  let delta = 1;
  [[2.5, 7, 0.15], [7, 20, 0.1], [20, Infinity, 0.05]].forEach(([lo, hi, f]) => {
    delta += f * Math.max(Math.min(ivl, hi) - lo, 0);
  });
  const min = Math.max(2, Math.round(ivl - delta));
  const max = Math.min(Math.round(ivl + delta), MAX_INTERVAL);
  return Math.floor(rand * (max - min + 1) + min);
}

const elapsedDays = (card, now) => (card.last_review ? Math.max(0, (now - new Date(card.last_review)) / DAY) : 0);

// Every possible outcome of reviewing `card` at `now`: { 1: next, 2: next, 3: next, 4: next }.
// Each `next` is the updated card plus { interval_days, scheduled_ms }.
export function preview(card, now = new Date()) {
  const t = now.getTime();
  const seed = `${card.id || ''}:${card.reps || 0}`;
  const base = { ...card, reps: (card.reps || 0) + 1, last_review: now.toISOString() };
  const out = {};

  const learn = (g, s, d, state, step, minutes) => {
    out[g] = { ...base, state, step, stability: s, difficulty: d, due: new Date(t + minutes * MINUTE).toISOString(), scheduled_ms: minutes * MINUTE, interval_days: 0 };
  };
  const review = (g, s, d, days) => {
    out[g] = { ...base, state: STATE.REVIEW, step: 0, stability: s, difficulty: d, due: new Date(t + days * DAY).toISOString(), scheduled_ms: days * DAY, interval_days: days };
  };

  if (card.state === STATE.NEW || card.state == null) {
    const [s1, s2, s3, s4] = [1, 2, 3, 4].map(initStability);
    const [d1, d2, d3, d4] = [1, 2, 3, 4].map(initDifficulty);
    const steps = LEARNING_STEPS;
    learn(1, s1, d1, STATE.LEARNING, 0, steps[0]);
    learn(2, s2, d2, STATE.LEARNING, 0, steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[0] * 1.5);
    const goodIvl = intervalFor(s3);
    if (steps.length > 1) learn(3, s3, d3, STATE.LEARNING, 1, steps[1]);
    else review(3, s3, d3, goodIvl);
    review(4, s4, d4, Math.max(fuzz(intervalFor(s4), seed), goodIvl + 1));
    return out;
  }

  const s = card.stability || initStability(3);
  const d = card.difficulty || initDifficulty(3);
  const elapsed = elapsedDays(card, now);
  const r = retrievability(elapsed, s);

  if (card.state === STATE.LEARNING || card.state === STATE.RELEARNING) {
    const steps = card.state === STATE.LEARNING ? LEARNING_STEPS : RELEARNING_STEPS;
    const step = Math.min(card.step || 0, steps.length - 1);
    const nextS = (g) => (elapsed < 1
      ? shortTermStability(s, g)
      : g === 1 ? forgetStability(d, s, r) : recallStability(d, s, r, g));
    const sg = [1, 2, 3, 4].map(nextS);
    const dg = [1, 2, 3, 4].map((g) => nextDifficulty(d, g));

    learn(1, sg[0], dg[0], card.state, 0, steps[0]);
    const hardMin = step === 0 && steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[step] * (steps.length === 1 ? 1.5 : 1);
    learn(2, sg[1], dg[1], card.state, step, hardMin);
    const goodIvl = fuzz(intervalFor(sg[2]), seed);
    if (step + 1 < steps.length) learn(3, sg[2], dg[2], card.state, step + 1, steps[step + 1]);
    else review(3, sg[2], dg[2], goodIvl);
    review(4, sg[3], dg[3], Math.max(fuzz(intervalFor(sg[3]), seed), goodIvl + 1));
    return out;
  }

  // Review card.
  const dg = [1, 2, 3, 4].map((g) => nextDifficulty(d, g));
  const sAgain = forgetStability(d, s, r);
  out[1] = {
    ...base, state: STATE.RELEARNING, step: 0, stability: sAgain, difficulty: dg[0], lapses: (card.lapses || 0) + 1,
    due: new Date(t + RELEARNING_STEPS[0] * MINUTE).toISOString(), scheduled_ms: RELEARNING_STEPS[0] * MINUTE, interval_days: 0,
  };
  const [sHard, sGood, sEasy] = [2, 3, 4].map((g) => recallStability(d, s, r, g));
  let hard = fuzz(intervalFor(sHard), seed);
  let good = fuzz(intervalFor(sGood), seed);
  let easy = fuzz(intervalFor(sEasy), seed);
  hard = Math.min(hard, good);
  good = Math.max(good, hard + 1);
  easy = Math.max(easy, good + 1);
  review(2, sHard, dg[1], hard);
  review(3, sGood, dg[2], good);
  review(4, sEasy, dg[3], easy);
  return out;
}

export function formatInterval(ms) {
  const min = ms / MINUTE;
  if (min < 60) return `${Math.max(1, Math.round(min))}m`;
  if (min < 24 * 60) return `${Math.round(min / 60)}h`;
  const days = ms / DAY;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${(days / 30).toFixed(1).replace(/\.0$/, '')}mo`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')}y`;
}

// Study day rolls over at 4am local time, like Anki.
export function endOfStudyDay(now = new Date()) {
  const end = new Date(now);
  end.setHours(4, 0, 0, 0);
  if (end <= now) end.setDate(end.getDate() + 1);
  return end;
}

export const LEARN_AHEAD_MS = 20 * MINUTE;

// Order today's queue. New words come first (newest assignment first), then due
// reviews with the most-forgotten first. Learning cards are interleaved by the
// session as they come due.
export function buildQueue(cards, now = new Date()) {
  const dayEnd = endOfStudyDay(now).getTime();
  const fresh = cards
    .filter((c) => c.state === STATE.NEW)
    .sort((a, b) => (b.assigned_at || '').localeCompare(a.assigned_at || '') || a.position - b.position);
  const learning = cards
    .filter((c) => (c.state === STATE.LEARNING || c.state === STATE.RELEARNING) && new Date(c.due).getTime() <= dayEnd)
    .sort((a, b) => a.due.localeCompare(b.due));
  const reviews = cards
    .filter((c) => c.state === STATE.REVIEW && new Date(c.due).getTime() <= dayEnd)
    .map((c) => ({ c, r: retrievability(elapsedDays(c, now), c.stability || 1) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.c);
  return { fresh, learning, reviews };
}

// Pick the next card: learning cards that are due now, then new words, then
// reviews, then learning cards within the learn-ahead window.
export function nextCard({ fresh, learning, reviews }, now = new Date()) {
  const t = now.getTime();
  const dueLearning = learning.filter((c) => new Date(c.due).getTime() <= t);
  if (dueLearning.length) return dueLearning[0];
  if (fresh.length) return fresh[0];
  if (reviews.length) return reviews[0];
  const ahead = learning.filter((c) => new Date(c.due).getTime() <= t + LEARN_AHEAD_MS);
  return ahead[0] || null;
}
