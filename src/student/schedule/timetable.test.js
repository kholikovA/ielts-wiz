import {
  planMove, planResize, layoutDay, summarize, describeBlocks, freePeriods,
  periodColumn, periodEnd, slotTime, nowMarker,
} from './timetable';

const s = (id, day, period, span = 1, extra = {}) => ({ id, day, period, span, kind: 'sat', class_id: 'c1', class_name: '11 SAT', ...extra });

describe('planMove', () => {
  const slots = [s('a', 1, 1, 2), s('b', 1, 3), s('c', 1, 4, 2), s('d', 2, 1)];

  it('moves into free time', () => {
    expect(planMove(slots, slots[3], 2, 5)).toEqual({ moves: [{ id: 'd', day: 2, period: 5 }] });
  });

  it('allows shifting a block onto its own old place', () => {
    expect(planMove(slots, slots[0], 1, 1)).toEqual({ moves: [] });
    expect(planMove([s('x', 1, 1, 2)], s('x', 1, 1, 2), 1, 2).moves).toEqual([{ id: 'x', day: 1, period: 2 }]);
  });

  it('rejects blocks that run past the last period', () => {
    expect(planMove(slots, slots[0], 3, 7).error).toBeTruthy();
  });

  it('swaps two blocks of the same length', () => {
    const r = planMove(slots, slots[3], 1, 3);
    expect(r.moves).toEqual([{ id: 'd', day: 1, period: 3 }, { id: 'b', day: 2, period: 1 }]);
  });

  it('swaps a double with a double', () => {
    const r = planMove(slots, slots[0], 1, 4);
    expect(r.moves).toEqual([{ id: 'a', day: 1, period: 4 }, { id: 'c', day: 1, period: 1 }]);
  });

  it('refuses a swap that would collide', () => {
    // d (single, Tue 1) onto a (double, Mon 1-2): a would go to Tue 1-2, which is free → ok;
    // but with something on Tue 2 it can't.
    const crowded = [...slots, s('e', 2, 2)];
    expect(planMove(crowded, crowded[3], 1, 1).error).toBeTruthy();
  });

  it('refuses when landing on two blocks', () => {
    expect(planMove(slots, slots[2], 1, 2).error).toBeTruthy();
  });

  it('copies only into free time', () => {
    expect(planMove(slots, slots[3], 2, 2, { copy: true }).copy).toMatchObject({ day: 2, period: 2, span: 1 });
    expect(planMove(slots, slots[3], 1, 1, { copy: true }).error).toBeTruthy();
  });
});

describe('planMove double swap', () => {
  it('swaps doubles on different days', () => {
    const slots = [s('a', 1, 1, 2), s('b', 2, 4, 2)];
    expect(planMove(slots, slots[0], 2, 4).moves).toEqual([{ id: 'a', day: 2, period: 4 }, { id: 'b', day: 1, period: 1 }]);
  });
});

describe('planResize', () => {
  const slots = [s('a', 1, 1), s('b', 1, 3)];
  it('stretches into free time', () => {
    expect(planResize(slots, slots[0], 2).moves).toEqual([{ id: 'a', day: 1, period: 1, span: 2 }]);
  });
  it('stops at the next block', () => {
    expect(planResize(slots, slots[0], 3).error).toBeTruthy();
  });
  it('never goes below one period', () => {
    expect(planResize([s('a', 1, 2, 2)], s('a', 1, 2, 2), 1).moves).toEqual([{ id: 'a', day: 1, period: 2, span: 1 }]);
  });
});

describe('layout', () => {
  it('puts overlapping blocks on separate lanes', () => {
    const { lanes, placed } = layoutDay([s('a', 1, 1, 2), s('b', 1, 2), s('c', 1, 4)]);
    expect(lanes).toBe(2);
    expect(placed.find((p) => p.slot.id === 'b').lane).toBe(1);
    expect(placed.find((p) => p.slot.id === 'c').lane).toBe(0);
  });
  it('lists free periods', () => {
    expect(freePeriods([s('a', 1, 1, 2), s('b', 1, 6)], 1)).toEqual([3, 4, 5, 7]);
  });
  it('leaves a column for lunch', () => {
    expect([1, 3, 4, 7].map(periodColumn)).toEqual([2, 4, 6, 9]);
  });
  it('formats times', () => {
    expect(periodEnd(7)).toBe('15:30');
    expect(slotTime(s('a', 1, 4, 2))).toBe('12:05–13:40');
  });
});

describe('summarize', () => {
  // The week from the planning sheet: SAT double daily, IELTS 4 doubles + 2 singles, 7 office hours.
  const week = [
    s('1', 1, 4, 2), s('2', 2, 1, 2), s('3', 3, 1, 2), s('4', 4, 1, 2), s('5', 5, 6, 2, { pending: true }),
    ...[[1, 1, 2], [2, 3, 1], [2, 5, 2], [3, 3, 1], [3, 4, 2], [4, 4, 2]].map(([d, p, sp], i) => s(`i${i}`, d, p, sp, { kind: 'ielts', class_id: 'c2', class_name: 'IELTS group' })),
    ...[[1, 3], [1, 7], [2, 7], [3, 6], [4, 3], [4, 7], [5, 3]].map(([d, p], i) => s(`o${i}`, d, p, 1, { kind: 'office' })),
    { id: 'pray', day: 5, period: 4, span: 2, kind: 'blocked', class_id: null, title: 'Prayer time' },
  ];
  it('matches the planning sheet', () => {
    const r = summarize(week);
    expect(r.cards.map((c) => [c.label, c.className, c.periods, c.detail])).toEqual([
      ['SAT', '11 SAT', 10, '1 double every day'],
      ['IELTS', 'IELTS group', 10, '4 doubles, 2 singles'],
      ['Office', '11 SAT', 7, '7 singles'],
    ]);
    expect(r.total).toBe(27);
    expect(r.finish).toBe('15:30');
    expect(r.pending).toBe(1);
  });
  it('describes mixed lengths', () => {
    expect(describeBlocks([s('a', 1, 1), s('b', 2, 1)])).toBe('2 singles');
  });
});

describe('nowMarker', () => {
  it('finds the current period on a weekday', () => {
    expect(nowMarker(new Date(2026, 10, 16, 12, 30))).toEqual({ day: 1, period: 4 });
    expect(nowMarker(new Date(2026, 10, 16, 11, 30))).toEqual({ day: 1, period: null });
    expect(nowMarker(new Date(2026, 10, 15, 9, 0))).toBeNull();
  });
});
