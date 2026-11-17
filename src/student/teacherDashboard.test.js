import { teacherOverview } from './TeacherDashboard';

jest.mock('./api', () => ({}));

const now = new Date(2026, 10, 17, 10, 0);
const at = (day, h = 23) => new Date(2026, 10, day, h, 0).toISOString();
const a = (id, due, total, submitted, reviewed, extra = {}) => ({
  id, kind: 'writing', title: id, due_at: at(due), publish_at: at(10),
  assignment_recipients: Array.from({ length: total }, (_, i) => ({ student_id: `s${i}` })),
  submissions: Array.from({ length: submitted }, (_, i) => ({ student_id: `s${i}`, status: 'submitted', reviewed_at: i < reviewed ? at(16) : null })),
  ...extra,
});

test('teacherOverview sorts marking and open homework by deadline and counts the day', () => {
  const assignments = [
    a('later', 20, 4, 2, 0),
    a('today', 17, 4, 3, 3),
    a('past', 15, 4, 4, 1),
    a('scheduled', 25, 4, 0, 0, { publish_at: at(19) }),
    a('cards', 18, 4, 2, 0, { kind: 'flashcards' }),
  ];
  const students = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
  const sums = new Map([
    ['x', { homework_streak: 3, attendance_streak: 2, week: 9 }],
    ['y', { homework_streak: 0, attendance_streak: 4, week: 2 }],
    ['z', { homework_streak: 1, attendance_streak: 0, week: 0 }],
  ]);
  const o = teacherOverview({ assignments, students, sums }, now);
  expect(o.review.map((r) => r.a.id)).toEqual(['past', 'later']);
  expect(o.toReview).toBe(5); // flashcards are never marked
  expect(o.open.map((r) => r.a.id)).toEqual(['today', 'cards', 'later']);
  expect(o.dueToday).toBe(1);
  expect(o.scheduled).toBe(1);
  expect(o.watch.map((w) => w.s.id)).toEqual(['y', 'z']);
});
