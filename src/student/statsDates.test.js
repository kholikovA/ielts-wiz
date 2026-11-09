import { presetRange, formatDuration, monthGrid, addDays, studyToday } from './statsDates';
import { isCounting } from './hubTime';

test('study day rolls over at 4am', () => {
  expect(studyToday(new Date(2026, 10, 10, 3, 59))).toBe('2026-11-09');
  expect(studyToday(new Date(2026, 10, 10, 4, 0))).toBe('2026-11-10');
});

test('preset ranges', () => {
  const now = new Date(2026, 10, 10, 12);
  expect(presetRange('today', now)).toEqual({ from: '2026-11-10', to: '2026-11-10' });
  expect(presetRange('yesterday', now)).toEqual({ from: '2026-11-09', to: '2026-11-09' });
  expect(presetRange('7d', now)).toEqual({ from: '2026-11-04', to: '2026-11-10' });
  expect(presetRange('30d', now).from).toBe('2026-10-12');
  expect(presetRange('month', now).from).toBe('2026-11-01');
});

test('addDays crosses months', () => {
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});

test('formatDuration', () => {
  expect(formatDuration(0)).toBe('0m');
  expect(formatDuration(30)).toBe('<1m');
  expect(formatDuration(125)).toBe('2m');
  expect(formatDuration(3 * 3600 + 5 * 60)).toBe('3h 05m');
});

test('monthGrid starts on Monday', () => {
  const g = monthGrid(2026, 11); // 1 Nov 2026 is a Sunday
  expect(g.slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-11-01']);
  expect(g.filter(Boolean)).toHaveLength(30);
});

test('time counts only when on screen and active', () => {
  const on = { visible: true, focused: true, playing: false };
  expect(isCounting(1000, 0, on)).toBe(true);
  expect(isCounting(4 * 60 * 1000, 0, on)).toBe(false);
  expect(isCounting(4 * 60 * 1000, 0, { ...on, playing: true })).toBe(true);
  expect(isCounting(1000, 0, { ...on, visible: false })).toBe(false);
  expect(isCounting(1000, 0, { ...on, focused: false })).toBe(false);
});
