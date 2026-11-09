// Date helpers for the teacher Stats page. Days are 'YYYY-MM-DD' strings in
// local time. "Today" rolls over at 4am, like study days on the server.

export const TRACKING_SINCE = '2026-11-10'; // time on the hub is counted from here
const HUB_START = '2026-10-01';

const pad = (n) => String(n).padStart(2, '0');
export const toDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDay = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseDay(s); d.setDate(d.getDate() + n); return toDay(d); };
export const studyToday = (now = new Date()) => toDay(new Date(now.getTime() - 4 * 3600 * 1000));

export const PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

export function presetRange(preset, now = new Date()) {
  const today = studyToday(now);
  switch (preset) {
    case 'yesterday': { const y = addDays(today, -1); return { from: y, to: y }; }
    case '7d': return { from: addDays(today, -6), to: today };
    case '30d': return { from: addDays(today, -29), to: today };
    case '90d': return { from: addDays(today, -89), to: today };
    case 'month': return { from: `${today.slice(0, 7)}-01`, to: today };
    case 'all': return { from: HUB_START < today ? HUB_START : today, to: today };
    default: return { from: today, to: today };
  }
}

export function rangeLabel({ from, to }) {
  const a = parseDay(from); const b = parseDay(to);
  const sameYear = a.getFullYear() === b.getFullYear();
  const fmt = (d, withYear) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
  if (from === to) return fmt(a, true);
  return `${fmt(a, !sameYear)} – ${fmt(b, true)}`;
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return s ? '<1m' : '0m';
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${pad(m)}m` : `${m}m`;
}

// Calendar cells for a month, Monday first: null for leading blanks, then days.
export function monthGrid(year, month) {
  const first = new Date(year, month - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(year, month, 0).getDate();
  return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`)];
}
