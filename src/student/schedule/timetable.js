// Weekly timetable logic for Student Hub → Schedule. Pure functions only (the
// page is Schedule.js — not schedule.js: macOS file names ignore case); rows
// come from the schedule_slots table / class_schedule().

export const DAYS = [
  { day: 1, short: 'Mon', long: 'Monday' },
  { day: 2, short: 'Tue', long: 'Tuesday' },
  { day: 3, short: 'Wed', long: 'Wednesday' },
  { day: 4, short: 'Thu', long: 'Thursday' },
  { day: 5, short: 'Fri', long: 'Friday' },
];

// 45-minute periods; lunch falls between periods 3 and 4.
export const PERIOD_MINUTES = 45;
export const PERIODS = [
  { period: 1, start: '8:30' },
  { period: 2, start: '9:25' },
  { period: 3, start: '10:20' },
  { period: 4, start: '12:05' },
  { period: 5, start: '12:55' },
  { period: 6, start: '13:50' },
  { period: 7, start: '14:45' },
];
export const LUNCH_AFTER = 3;
export const MAX_SPAN = 3;

export const KINDS = {
  sat: { label: 'SAT' },
  ielts: { label: 'IELTS' },
  office: { label: 'Office hours', short: 'Office' },
  other: { label: 'Other' },
  blocked: { label: 'Blocked time' },
};
export const SPAN_LABEL = { 1: 'single', 2: 'double', 3: 'triple' };

export const slotTitle = (s) => s.title || KINDS[s.kind]?.short || KINDS[s.kind]?.label || 'Lesson';

const toMin = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const fmt = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
export const periodStart = (p) => PERIODS[p - 1].start;
export const periodEnd = (p) => fmt(toMin(PERIODS[p - 1].start) + PERIOD_MINUTES);
export const slotTime = (s) => `${periodStart(s.period)}–${periodEnd(s.period + s.span - 1)}`;

// Grid column for a period: column 1 is the day label, lunch takes one column after LUNCH_AFTER.
export const periodColumn = (p) => (p <= LUNCH_AFTER ? p + 1 : p + 2);
export const LUNCH_COLUMN = LUNCH_AFTER + 2;

export const overlaps = (a, b) => a.day === b.day && a.period < b.period + b.span && b.period < a.period + a.span;
export const fits = (s) => s.day >= 1 && s.day <= 5 && s.period >= 1 && s.span >= 1 && s.span <= MAX_SPAN && s.period + s.span - 1 <= PERIODS.length;

// First block (other than those in `ignore`) that `slot` would collide with.
export function clash(slots, slot, ignore = []) {
  return slots.find((s) => !ignore.includes(s.id) && overlaps(s, slot)) || null;
}

// Dropping `slot` so it starts at (day, period). Returns the moves to save, or
// { error } when it can't go there. Landing on exactly one other block swaps
// them when that block fits where `slot` was.
export function planMove(slots, slot, day, period, { copy = false } = {}) {
  const moved = { ...slot, day, period };
  if (!fits(moved)) return { error: 'It doesn’t fit there.' };
  if (!copy && day === slot.day && period === slot.period) return { moves: [] };
  const hits = slots.filter((s) => s.id !== slot.id && overlaps(s, moved));
  if (copy) {
    // A copy also may not land on the original.
    return hits.length || overlaps(slot, moved) ? { error: 'That time is already taken.' } : { copy: moved };
  }
  if (!hits.length) return { moves: [{ id: slot.id, day, period }] };
  if (hits.length > 1) return { error: 'That time is already taken.' };
  const other = hits[0];
  // The other block takes the start of the dragged block's old place.
  const back = { ...other, day: slot.day, period: slot.period };
  const rest = slots.filter((s) => s.id !== slot.id && s.id !== other.id);
  if (!fits(back) || overlaps(back, moved) || clash(rest, back)) {
    return { error: `Can’t swap with ${slotTitle(other)} here.` };
  }
  return { moves: [{ id: slot.id, day, period }, { id: other.id, day: back.day, period: back.period }], swapped: other };
}

// Stretching / shrinking a block to end at `lastPeriod`.
export function planResize(slots, slot, lastPeriod) {
  const span = Math.max(1, Math.min(MAX_SPAN, lastPeriod - slot.period + 1));
  const next = { ...slot, span };
  if (span === slot.span) return { moves: [] };
  if (!fits(next)) return { error: 'It doesn’t fit there.' };
  if (clash(slots, next, [slot.id])) return { error: 'That time is already taken.' };
  return { moves: [{ id: slot.id, day: slot.day, period: slot.period, span }] };
}

// Blocks of one day split into lanes so overlapping ones (a student in two
// teachers' classes) sit on separate lines instead of on top of each other.
export function layoutDay(slots) {
  const lanes = [];
  const placed = [];
  [...slots].sort((a, b) => a.period - b.period || b.span - a.span).forEach((s) => {
    let lane = lanes.findIndex((list) => !list.some((o) => overlaps(o, s)));
    if (lane === -1) { lanes.push([]); lane = lanes.length - 1; }
    lanes[lane].push(s);
    placed.push({ slot: s, lane });
  });
  return { lanes: Math.max(1, lanes.length), placed };
}

// Periods of a day not covered by any block.
export const freePeriods = (slots, day) => PERIODS.map((p) => p.period)
  .filter((p) => !slots.some((s) => s.day === day && p >= s.period && p < s.period + s.span));

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// "1 double every day", "4 doubles, 2 singles", "3 singles".
export function describeBlocks(blocks) {
  const days = new Set(blocks.map((b) => b.day));
  const bySpan = {};
  blocks.forEach((b) => { bySpan[b.span] = (bySpan[b.span] || 0) + 1; });
  const spans = Object.keys(bySpan).map(Number).sort((a, b) => b - a);
  if (spans.length === 1 && days.size === DAYS.length && blocks.length === DAYS.length) {
    return spans[0] === 1 ? '1 lesson every day' : `1 ${SPAN_LABEL[spans[0]]} every day`;
  }
  return spans.map((sp) => plural(bySpan[sp], SPAN_LABEL[sp])).join(', ');
}

// Summary cards: one per (kind, class) in grid order, then the week total.
export function summarize(slots) {
  const lessons = slots.filter((s) => s.kind !== 'blocked');
  const groups = new Map();
  const order = ['sat', 'ielts', 'office', 'other'];
  lessons.forEach((s) => {
    const label = s.kind === 'other' ? slotTitle(s) : (KINDS[s.kind].short || KINDS[s.kind].label);
    const key = `${s.kind}|${label}|${s.class_id}`;
    if (!groups.has(key)) groups.set(key, { key, kind: s.kind, label, className: s.class_name || '', blocks: [] });
    groups.get(key).blocks.push(s);
  });
  const cards = [...groups.values()]
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.className.localeCompare(b.className) || a.label.localeCompare(b.label))
    .map((g) => ({
      ...g,
      periods: g.blocks.reduce((n, b) => n + b.span, 0),
      detail: describeBlocks(g.blocks),
      pending: g.blocks.filter((b) => b.pending).length,
    }));
  const lastPeriod = lessons.reduce((m, s) => Math.max(m, s.period + s.span - 1), 0);
  return {
    cards,
    total: lessons.reduce((n, s) => n + s.span, 0),
    finish: lastPeriod ? periodEnd(lastPeriod) : null,
    pending: lessons.filter((s) => s.pending).length,
  };
}

// Today's weekday (1-5) and the current period, for highlighting. null at weekends.
export function nowMarker(date = new Date()) {
  const dow = date.getDay();
  if (dow < 1 || dow > 5) return null;
  const min = date.getHours() * 60 + date.getMinutes();
  const current = PERIODS.find((p) => min >= toMin(p.start) && min < toMin(p.start) + PERIOD_MINUTES);
  return { day: dow, period: current ? current.period : null };
}
