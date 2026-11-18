import { buildOverview, resultState, tally } from './overviewStats';

const now = new Date('2026-11-18T12:00:00Z');

const data = {
  classes: [{ id: 'c1', name: 'IELTS', teacher: 'T' }, { id: 'c2', name: 'Junior', teacher: 'T' }],
  members: [
    { class_id: 'c1', student_id: 's1' }, { class_id: 'c1', student_id: 's2' }, { class_id: 'c2', student_id: 's3' },
  ],
  students: [
    { id: 's1', name: 'Ali', earned: 10, balance: 40 },
    { id: 's2', name: 'Bek', earned: 5, balance: 5 },
    { id: 's3', name: 'Dil', earned: 7, balance: 7 },
  ],
  assignments: [
    { id: 'a1', class_id: 'c1', kind: 'quiz', title: 'Quiz', due_at: '2026-11-10T18:59:00Z' },
    { id: 'a2', class_id: 'c1', kind: 'quiz', title: 'Next', due_at: '2026-11-20T18:59:00Z' },
    { id: 'a3', class_id: 'c2', kind: 'writing', title: 'Essay', due_at: '2026-11-12T18:59:00Z' },
  ],
  results: [
    { assignment_id: 'a1', student_id: 's1', done_at: '2026-11-09T10:00:00Z', score: 80, band: null },
    { assignment_id: 'a1', student_id: 's2', done_at: '2026-11-11T10:00:00Z', score: 60, band: null },
    { assignment_id: 'a2', student_id: 's1', done_at: null, score: null, band: null },
    { assignment_id: 'a2', student_id: 's2', done_at: null, score: null, band: null },
    { assignment_id: 'a3', student_id: 's3', done_at: null, score: null, band: null },
  ],
  sessions: [{ id: 'x1', class_id: 'c1', held_at: '2026-11-15T09:00:00Z' }, { id: 'x2', class_id: 'c2', held_at: '2026-11-15T09:00:00Z' }],
  attendance: [
    { session_id: 'x1', student_id: 's1', status: 'present' },
    { session_id: 'x1', student_id: 's2', status: 'absent' },
    { session_id: 'x2', student_id: 's3', status: 'excused' },
  ],
};

test('resultState: on time, late, missing, open', () => {
  const a = { due_at: '2026-11-10T18:59:00Z' };
  expect(resultState({ done_at: '2026-11-09T00:00:00Z' }, a, now)).toBe('on_time');
  expect(resultState({ done_at: '2026-11-11T00:00:00Z' }, a, now)).toBe('late');
  expect(resultState({ done_at: null }, a, now)).toBe('missing');
  expect(resultState({ done_at: null }, { due_at: '2026-11-20T00:00:00Z' }, now)).toBe('open');
  expect(resultState({ done_at: null }, { due_at: null }, now)).toBe('open');
});

test('tally: homework not yet due is not counted against anyone; excused not counted', () => {
  const t = tally(
    [{ state: 'on_time', score: 80 }, { state: 'late', score: 60 }, { state: 'missing' }, { state: 'open' }],
    [{ status: 'present' }, { status: 'late' }, { status: 'absent' }, { status: 'excused' }],
  );
  expect(t).toMatchObject({ due: 3, done: 2, onTime: 1, missing: 1, open: 1, donePct: 67, onTimePct: 33, avgScore: 70, attended: 2, sessions: 3, attendancePct: 67 });
});

test('buildOverview: all groups', () => {
  const o = buildOverview(data, null, now);
  expect(o.totals).toMatchObject({ students: 3, coins: 22, due: 3, done: 2, missing: 1, avgScore: 70, attendancePct: 50 });
  expect(o.groups.map((g) => [g.name, g.donePct, g.attendancePct])).toEqual([['IELTS', 100, 50], ['Junior', 0, null]]);
  const ali = o.students.find((s) => s.id === 's1');
  expect(ali).toMatchObject({ done: 1, due: 1, donePct: 100, avgScore: 80, attendancePct: 100, classNames: ['IELTS'] });
  const a1 = o.homework.find((h) => h.id === 'a1');
  expect(a1).toMatchObject({ recipients: 2, done: 2, onTime: 1, avgScore: 70, className: 'IELTS' });
});

test('buildOverview: one group', () => {
  const o = buildOverview(data, 'c2', now);
  expect(o.students.map((s) => s.id)).toEqual(['s3']);
  expect(o.homework.map((h) => h.id)).toEqual(['a3']);
  expect(o.totals).toMatchObject({ coins: 7, due: 1, missing: 1, attendancePct: null });
});
