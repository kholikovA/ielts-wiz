// Dashboard greeting, next-session countdown and the "welcome back" celebration.
// Pure functions only; the components are DashboardHero.js and WelcomeBack.js.
import { PERIODS, PERIOD_MINUTES, KINDS, slotTitle } from './schedule/timetable';
import { isComplete } from './homework';

export const firstName = (name) => (name || '').trim().split(/\s+/)[0] || '';

const partOfDay = (now) => {
  const h = now.getHours();
  if (h < 5) return 'evening';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

// Headlines the dashboard cycles through. "Welcome back" always comes first.
export function greetings(name, now = new Date()) {
  const n = firstName(name);
  const to = n ? `, ${n}` : '';
  return [
    `Welcome back${to}`,
    `Good ${partOfDay(now)}${to}`,
    `Good to see you${to}`,
    n ? `Let's get to work, ${n}` : "Let's get to work",
  ];
}

export const MOTIVATION = [
  'Small steps every day add up to a big score.',
  'Consistency beats intensity. Show up again today.',
  'One focused hour today is worth more than five next week.',
  'You do not have to be perfect, just a little better than yesterday.',
  'Every word you learn today is one less to worry about on test day.',
  'Hard work now makes the exam feel easy later.',
  'Mistakes are how you find out what to practise next.',
  'The score you want is built on days like this one.',
  'Start with the hardest task while your mind is fresh.',
  'Progress is quiet. Keep going and it will show.',
  'Discipline is choosing what you want most over what you want now.',
  'A streak is just today, repeated.',
];

// Which motivation line opens the rotation: changes daily, steady within a day.
export function dailyIndex(now = new Date(), length = MOTIVATION.length) {
  const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
  return ((day % length) + length) % length;
}

const startOn = (date, period) => {
  const [h, m] = PERIODS[period - 1].start.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

// The session happening now, or else the next one, from the weekly timetable.
// → { slot, start, end, live } or null. Blocked time isn't a session.
export function nextSlot(slots, now = new Date()) {
  // Days are visited in order, so the first day with a session still to end wins.
  for (let offset = 0; offset <= 7; offset += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const hits = slots
      .filter((slot) => slot.kind !== 'blocked' && slot.day === date.getDay() && PERIODS[slot.period - 1])
      .map((slot) => {
        const last = Math.min(PERIODS.length, slot.period + slot.span - 1);
        const start = startOn(date, slot.period);
        const end = new Date(startOn(date, last).getTime() + PERIOD_MINUTES * 60000);
        return { slot, start, end, live: start <= now };
      })
      .filter((hit) => hit.end > now)
      .sort((a, b) => a.start - b.start);
    if (hits.length) return hits[0];
  }
  return null;
}

export const isOfficeHours = (slot) => slot?.kind === 'office';

export function sessionName(slot) {
  if (!slot) return '';
  const label = slot.kind === 'other' ? slotTitle(slot) : KINDS[slot.kind]?.label || slotTitle(slot);
  return slot.title && slot.kind !== 'other' && slot.title !== label ? `${label} · ${slot.title}` : label;
}

// The reminder under the countdown. dueBefore = homework still open that is due before the session.
export function sessionTip(slot, { dueBefore = 0, live = false } = {}) {
  if (isOfficeHours(slot)) {
    return live
      ? 'Office hours are on now. Bring your questions.'
      : 'Make sure you come prepared, with your questions written down, for office hours.';
  }
  if (live) return 'Class is on now. Give it your full attention.';
  if (dueBefore > 0) {
    return `Make sure you do your homework on time: ${dueBefore} ${dueBefore === 1 ? 'piece is' : 'pieces are'} due before this lesson.`;
  }
  return 'Make sure you do your homework on time and come ready to take part.';
}

// "Today", "Tomorrow" or the weekday, for a session start.
export function dayLabel(date, now = new Date()) {
  const a = new Date(now); a.setHours(0, 0, 0, 0);
  const b = new Date(date); b.setHours(0, 0, 0, 0);
  const days = Math.round((b - a) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

// Countdown as unit cells; the largest unit shown is never zero (except seconds).
export function countdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const cells = [];
  if (d) cells.push({ value: d, unit: d === 1 ? 'day' : 'days' });
  if (d || h) cells.push({ value: h, unit: 'hrs' });
  cells.push({ value: m, unit: 'min' });
  if (!d) cells.push({ value: s, unit: 'sec' });
  return cells;
}

// ── Welcome-back celebration ────────────────────────────────────────────────

export const localDay = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export const AWAY_MS = 10 * 60 * 1000;

// What to show a returning student.
//   seen: what this device last recorded — { at (ISO), day, att, hw } or null
//   summary: hub_summary(); transactions: newest coin_transactions rows
// → null (nothing to celebrate) or { streaks: [{ kind, from, to }], coins: { total, rows } | null }
export function celebration(seen, summary, transactions, now = new Date()) {
  const today = localDay(now);
  const newDay = !seen || seen.day !== today;
  const away = !seen?.at || now.getTime() - new Date(seen.at).getTime() >= AWAY_MS;
  if (!newDay && !away) return null;

  // First time on this device: only what was paid since the day began (the midnight payout).
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const since = seen?.at ? new Date(seen.at) : startOfDay;
  const fresh = transactions.filter((t) => new Date(t.created_at) > since);
  const total = fresh.reduce((sum, t) => sum + t.amount, 0);
  const coins = total > 0 ? { total, rows: fresh.filter((t) => t.amount > 0) } : null;

  const streaks = [
    { kind: 'attendance', to: summary.attendance_streak || 0, from: seen?.att ?? 0 },
    { kind: 'homework', to: summary.homework_streak || 0, from: seen?.hw ?? 0 },
  ]
    // Once a day while it's alive, and again whenever it grows.
    .filter((s) => s.to > 0 && (newDay || s.to > s.from))
    .map((s) => ({ ...s, from: Math.min(s.from, s.to) }));

  if (!coins && !streaks.length) return null;
  return { streaks, coins };
}

// ── Streak marks: the recent run shown as a row of flames ───────────────────
// Each mark is { at: Date, status: 'present' | 'late' | 'absent', lit }.

export const MARKS = 5;

// The last few classes. Late still counts as coming; excused classes are left out.
export function attendanceMarks(attendance, count = MARKS) {
  return attendance
    .filter((r) => r.class_sessions && ['present', 'late', 'absent'].includes(r.status))
    .map((r) => ({ at: new Date(r.class_sessions.held_at), status: r.status, lit: r.status !== 'absent' }))
    .sort((a, b) => a.at - b.at)
    .slice(-count);
}

// The last few days that had homework due. A day is lit only when everything
// due on it was handed in on time. rows: homework with status and attempts.
export function homeworkMarks(rows, now = new Date(), count = MARKS) {
  const rank = { present: 0, late: 1, absent: 2 };
  const days = new Map();
  rows.forEach((a) => {
    if (!a.due_at) return;
    const due = new Date(a.due_at);
    const done = isComplete(a.status);
    if (due > now && !done) return; // still open: not decided yet
    const at = a.submission?.submitted_at || a.attempts?.[0]?.completed_at;
    const status = !done ? 'absent' : at && new Date(at) > due ? 'late' : 'present';
    const key = localDay(due);
    const day = days.get(key);
    if (!day) days.set(key, { at: due, status });
    else if (rank[status] > rank[day.status]) day.status = status;
  });
  return [...days.values()]
    .sort((a, b) => a.at - b.at)
    .slice(-count)
    .map((d) => ({ ...d, lit: d.status === 'present' }));
}

// When the real history can't be read: one lit flame per step of the streak.
export const plainMarks = (streak, count = MARKS) =>
  Array.from({ length: Math.max(1, Math.min(count, streak)) }, () => ({ at: null, status: 'present', lit: true }));

// The flame that catches fire in the celebration: the newest lit one.
export const igniteIndex = (marks) => marks.map((m) => m.lit).lastIndexOf(true);

// "Mon" for the last week, "9 Nov" before that.
export function markLabel(at, now = new Date()) {
  if (!at) return '';
  const recent = now - at < 6.5 * 86400000 && at - now < 86400000;
  return at.toLocaleDateString(undefined, recent ? { weekday: 'short' } : { day: 'numeric', month: 'short' });
}

// How many coins to draw in the stack for an amount.
export const stackSize = (total) => Math.max(1, Math.min(12, total));
