import { rankFor, nextMilestone, RANKS } from './ranks';

test('rank thresholds and progress', () => {
  expect(rankFor(0).rank.name).toBe('Novice');
  expect(rankFor(299).rank.name).toBe('Novice');
  expect(rankFor(300).rank.name).toBe('Apprentice');
  const mid = rankFor(650);
  expect(mid.next.name).toBe('Adept');
  expect(mid.progress).toBeCloseTo(0.5);
  expect(mid.toNext).toBe(350);
  const top = rankFor(50000);
  expect(top.rank.name).toBe(RANKS[RANKS.length - 1].name);
  expect(top.next).toBeNull();
  expect(top.progress).toBe(1);
});

const M = [
  { kind: 'attendance', at: 3, coins: 15 }, { kind: 'attendance', at: 7, coins: 40 },
  { kind: 'attendance', at: 14, coins: 90 }, { kind: 'attendance', at: 30, coins: 200 },
];

test('next milestone within the ladder', () => {
  expect(nextMilestone('attendance', 0, M)).toEqual({ at: 3, coins: 15, from: 0 });
  expect(nextMilestone('attendance', 3, M)).toEqual({ at: 7, coins: 40, from: 3 });
  expect(nextMilestone('attendance', 20, M)).toEqual({ at: 30, coins: 200, from: 14 });
});

test('next milestone repeats past the last rung', () => {
  expect(nextMilestone('attendance', 30, M, { attendance: 30 })).toEqual({ at: 60, coins: 200, from: 30 });
  expect(nextMilestone('attendance', 61, M, { attendance: 30 })).toEqual({ at: 90, coins: 200, from: 60 });
  expect(nextMilestone('attendance', 30, M)).toBeNull();
  expect(nextMilestone('homework', 2, M)).toBeNull();
});
