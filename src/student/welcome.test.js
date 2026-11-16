import {
  firstName, greetings, nextSlot, sessionName, sessionTip, countdown, celebration, dayLabel, stackSize,
} from './welcome';

// Mon 16 Nov 2026, local time.
const at = (day, h, m = 0) => new Date(2026, 10, day, h, m, 0, 0);
const slot = (over) => ({ id: 's', kind: 'ielts', title: '', day: 1, period: 1, span: 1, pending: false, ...over });

test('greetings lead with "Welcome back" and the first name', () => {
  expect(firstName('  Aziza Karimova ')).toBe('Aziza');
  expect(greetings('Aziza Karimova', at(16, 9))[0]).toBe('Welcome back, Aziza');
  expect(greetings('Aziza', at(16, 9))[1]).toBe('Good morning, Aziza');
  expect(greetings('', at(16, 20))).toEqual(expect.arrayContaining(['Welcome back', 'Good evening']));
});

test('nextSlot picks the soonest session and skips blocked time', () => {
  const slots = [
    slot({ id: 'a', day: 1, period: 2, kind: 'blocked' }),
    slot({ id: 'b', day: 1, period: 4, span: 2 }),
    slot({ id: 'c', day: 2, period: 1, kind: 'office' }),
  ];
  const next = nextSlot(slots, at(16, 9, 0));
  expect(next.slot.id).toBe('b');
  expect(next.live).toBe(false);
  expect(next.start).toEqual(at(16, 12, 5));
  expect(next.end).toEqual(at(16, 13, 40)); // period 5 starts 12:55, +45 min
});

test('nextSlot reports a session in progress, then moves on when it ends', () => {
  const slots = [slot({ id: 'b', day: 1, period: 1 }), slot({ id: 'c', day: 3, period: 1, kind: 'office' })];
  expect(nextSlot(slots, at(16, 8, 45))).toMatchObject({ live: true, slot: { id: 'b' } });
  const later = nextSlot(slots, at(16, 9, 15));
  expect(later.slot.id).toBe('c');
  expect(later.start).toEqual(at(18, 8, 30));
});

test('nextSlot wraps over the weekend to the same weekday next week', () => {
  const next = nextSlot([slot({ day: 1, period: 1 })], at(16, 15));
  expect(next.start).toEqual(at(23, 8, 30));
  expect(nextSlot([], at(16, 15))).toBeNull();
});

test('session name and reminder depend on the kind of session', () => {
  expect(sessionName(slot({ kind: 'office' }))).toBe('Office hours');
  expect(sessionName(slot({ kind: 'other', title: 'Mock exam' }))).toBe('Mock exam');
  expect(sessionTip(slot({ kind: 'office' }))).toMatch(/come prepared.*questions.*office hours/i);
  expect(sessionTip(slot({ kind: 'sat' }))).toMatch(/homework on time/);
  expect(sessionTip(slot({ kind: 'sat' }), { dueBefore: 2 })).toMatch(/2 pieces are due before/);
  expect(sessionTip(null, { dueBefore: 1 })).toMatch(/1 piece is due before/);
});

test('countdown drops seconds once days are showing', () => {
  expect(countdown(((26 * 60 + 5) * 60 + 9) * 1000).map((c) => `${c.value}${c.unit}`)).toEqual(['1day', '2hrs', '5min']);
  expect(countdown((3 * 60 + 7) * 1000).map((c) => `${c.value}${c.unit}`)).toEqual(['3min', '7sec']);
  expect(countdown(-5)).toEqual([{ value: 0, unit: 'min' }, { value: 0, unit: 'sec' }]);
});

test('dayLabel', () => {
  expect(dayLabel(at(16, 14), at(16, 9))).toBe('Today');
  expect(dayLabel(at(17, 8), at(16, 23))).toBe('Tomorrow');
});

const tx = (amount, when, id = String(when)) => ({ id, amount, label: 'x', created_at: when.toISOString() });
const summary = { attendance_streak: 3, homework_streak: 0 };

test('celebration: nothing while the student is still around', () => {
  const seen = { at: at(16, 9, 55).toISOString(), day: '2026-11-16', att: 3, hw: 0 };
  expect(celebration(seen, summary, [tx(5, at(16, 9, 58))], at(16, 10))).toBeNull();
});

test('celebration: coins paid while away and a live streak on a new day', () => {
  const seen = { at: at(15, 18).toISOString(), day: '2026-11-15', att: 3, hw: 0 };
  const found = celebration(seen, summary, [tx(2, at(16, 0, 5)), tx(-1, at(15, 20)), tx(4, at(15, 17))], at(16, 9));
  expect(found.coins.total).toBe(1);
  expect(found.coins.rows).toHaveLength(1);
  expect(found.streaks).toEqual([{ kind: 'attendance', from: 3, to: 3 }]);
});

test('celebration: later the same day only for new coins or a longer streak', () => {
  const seen = { at: at(16, 9).toISOString(), day: '2026-11-16', att: 3, hw: 0 };
  expect(celebration(seen, summary, [], at(16, 14))).toBeNull();
  expect(celebration(seen, { attendance_streak: 4, homework_streak: 0 }, [], at(16, 14)).streaks)
    .toEqual([{ kind: 'attendance', from: 3, to: 4 }]);
  expect(celebration(seen, summary, [tx(2, at(16, 12))], at(16, 14))).toMatchObject({ streaks: [], coins: { total: 2 } });
});

test('celebration: first visit on a device counts coins from midnight; a net loss is not celebrated', () => {
  const found = celebration(null, { attendance_streak: 0, homework_streak: 2 }, [tx(2, at(16, 0, 10)), tx(9, at(15, 22))], at(16, 8));
  expect(found.coins.total).toBe(2);
  expect(found.streaks).toEqual([{ kind: 'homework', from: 0, to: 2 }]);
  expect(celebration(null, { attendance_streak: 0, homework_streak: 0 }, [tx(-3, at(16, 1))], at(16, 8))).toBeNull();
});

test('stackSize is capped', () => {
  expect(stackSize(1)).toBe(1);
  expect(stackSize(40)).toBe(12);
});
