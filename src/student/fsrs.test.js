import { preview, intervalFor, retrievability, buildQueue, nextCard, endOfStudyDay, formatInterval, STATE } from './fsrs';

const NOW = new Date('2026-10-21T10:00:00Z');
const MIN = 60000;
const DAY = 86400000;

test('stability S means 90% recall after S days, so interval == S at 90% retention', () => {
  expect(retrievability(10, 10)).toBeCloseTo(0.9, 5);
  expect(intervalFor(10)).toBe(10);
  expect(retrievability(0, 5)).toBe(1);
});

test('new card: Again/Hard/Good stay in learning steps, Easy graduates', () => {
  const p = preview({ id: 'a', state: STATE.NEW, reps: 0 }, NOW);
  expect(p[1]).toMatchObject({ state: STATE.LEARNING, step: 0, scheduled_ms: 1 * MIN });
  expect(p[2]).toMatchObject({ state: STATE.LEARNING, scheduled_ms: 5.5 * MIN });
  expect(p[3]).toMatchObject({ state: STATE.LEARNING, step: 1, scheduled_ms: 10 * MIN });
  expect(p[4].state).toBe(STATE.REVIEW);
  expect(p[4].interval_days).toBeGreaterThanOrEqual(8);
  expect(p[1].difficulty).toBeGreaterThan(p[4].difficulty);
});

test('learning card graduates on Good at the last step', () => {
  const learning = { ...preview({ id: 'b', state: STATE.NEW }, NOW)[3] };
  const p = preview(learning, new Date(NOW.getTime() + 10 * MIN));
  expect(p[3].state).toBe(STATE.REVIEW);
  expect(p[3].interval_days).toBeGreaterThanOrEqual(1);
  expect(p[1]).toMatchObject({ state: STATE.LEARNING, step: 0 });
});

test('review card: intervals ordered Hard <= Good < Easy, Again lapses into relearning', () => {
  const card = { id: 'c', state: STATE.REVIEW, stability: 10, difficulty: 5, reps: 4, lapses: 0, last_review: new Date(NOW - 10 * DAY).toISOString() };
  const p = preview(card, NOW);
  expect(p[2].interval_days).toBeLessThanOrEqual(p[3].interval_days);
  expect(p[3].interval_days).toBeLessThan(p[4].interval_days);
  expect(p[3].stability).toBeGreaterThan(10);
  expect(p[1]).toMatchObject({ state: STATE.RELEARNING, lapses: 1 });
  expect(p[1].stability).toBeLessThan(10);
});

test('a forgotten card keeps cycling: relearning → review again', () => {
  const card = { id: 'd', state: STATE.RELEARNING, step: 0, stability: 2, difficulty: 7, reps: 6, lapses: 1, last_review: NOW.toISOString() };
  const p = preview(card, new Date(NOW.getTime() + 10 * MIN));
  expect(p[3].state).toBe(STATE.REVIEW);
});

test('longer gaps before a successful recall grow stability more', () => {
  const base = { id: 'e', state: STATE.REVIEW, stability: 10, difficulty: 5, reps: 4 };
  const early = preview({ ...base, last_review: new Date(NOW - 5 * DAY).toISOString() }, NOW)[3].stability;
  const late = preview({ ...base, last_review: new Date(NOW - 20 * DAY).toISOString() }, NOW)[3].stability;
  expect(late).toBeGreaterThan(early);
});

test('queue: newest assignment words first, then due reviews most-forgotten first', () => {
  const later = new Date(NOW.getTime() + 30 * DAY).toISOString();
  const cards = [
    { id: 'old-new', state: 0, position: 0, assigned_at: '2026-10-19T00:00:00Z', due: NOW.toISOString() },
    { id: 'today-1', state: 0, position: 1, assigned_at: '2026-10-21T00:00:00Z', due: NOW.toISOString() },
    { id: 'today-0', state: 0, position: 0, assigned_at: '2026-10-21T00:00:00Z', due: NOW.toISOString() },
    { id: 'rev-fresh', state: 2, stability: 30, last_review: new Date(NOW - 2 * DAY).toISOString(), due: NOW.toISOString() },
    { id: 'rev-stale', state: 2, stability: 3, last_review: new Date(NOW - 20 * DAY).toISOString(), due: NOW.toISOString() },
    { id: 'not-due', state: 2, stability: 30, last_review: NOW.toISOString(), due: later },
  ];
  const q = buildQueue(cards, NOW);
  expect(q.fresh.map((c) => c.id)).toEqual(['today-0', 'today-1', 'old-new']);
  expect(q.reviews.map((c) => c.id)).toEqual(['rev-stale', 'rev-fresh']);
  expect(nextCard(q, NOW).id).toBe('today-0');
});

test('learning cards due now jump the queue', () => {
  const q = {
    fresh: [{ id: 'n' }],
    reviews: [],
    learning: [{ id: 'l', due: new Date(NOW - MIN).toISOString() }],
  };
  expect(nextCard(q, NOW).id).toBe('l');
});

test('study day rolls over at 4am', () => {
  const end = endOfStudyDay(new Date(2026, 9, 21, 2, 0));
  expect(end.getDate()).toBe(21);
  expect(end.getHours()).toBe(4);
  expect(endOfStudyDay(new Date(2026, 9, 21, 9, 0)).getDate()).toBe(22);
});

test('formatInterval', () => {
  expect(formatInterval(MIN)).toBe('1m');
  expect(formatInterval(10 * MIN)).toBe('10m');
  expect(formatInterval(3 * DAY)).toBe('3d');
  expect(formatInterval(60 * DAY)).toBe('2mo');
});
