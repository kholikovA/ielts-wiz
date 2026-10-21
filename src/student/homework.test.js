import { parseCards, statusOf, attemptsFor, isOverdue, summarise } from './homework';

test('parseCards accepts dash, equals, colon and tab separators', () => {
  expect(parseCards('mitigate - lessen\nubiquitous = everywhere\nfoo: bar\nx\ty\nno separator\n\n')).toEqual([
    { f: 'mitigate', b: 'lessen' },
    { f: 'ubiquitous', b: 'everywhere' },
    { f: 'foo', b: 'bar' },
    { f: 'x', b: 'y' },
  ]);
});

test('parseCards keeps hyphenated words intact', () => {
  expect(parseCards('well-being - health and happiness')).toEqual([{ f: 'well-being', b: 'health and happiness' }]);
});

const testA = { kind: 'test', created_at: '2026-10-20T00:00:00Z', payload: { kind: 'listening', test_id: '4' } };

test('test assignments complete only from attempts made after assigning', () => {
  const results = [
    { kind: 'listening', test_id: '4', completed_at: '2026-10-19T00:00:00Z', correct: 5, total: 10 },
    { kind: 'listening', test_id: '5', completed_at: '2026-10-21T00:00:00Z', correct: 5, total: 10 },
  ];
  expect(statusOf(testA, null, attemptsFor(testA, results))).toBe('todo');
  const later = [...results, { kind: 'listening', test_id: '4', completed_at: '2026-10-21T00:00:00Z', correct: 8, total: 10 }];
  expect(statusOf(testA, null, attemptsFor(testA, later))).toBe('done');
});

test('submission statuses', () => {
  const w = { kind: 'writing' };
  expect(statusOf(w, null)).toBe('todo');
  expect(statusOf(w, { status: 'in_progress' })).toBe('started');
  expect(statusOf(w, { status: 'submitted' })).toBe('submitted');
  expect(statusOf(w, { status: 'submitted', reviewed_at: 'x' })).toBe('reviewed');
});

test('overdue only when incomplete and past due', () => {
  const past = { due_at: '2000-01-01T00:00:00Z' };
  expect(isOverdue(past, 'todo')).toBe(true);
  expect(isOverdue(past, 'submitted')).toBe(false);
  expect(isOverdue({ due_at: null }, 'todo')).toBeFalsy();
});

test('summarise groups by kind', () => {
  const s = summarise([
    { kind: 'listening', correct: 5, total: 10, completed_at: 'a' },
    { kind: 'listening', correct: 10, total: 10, completed_at: 'b' },
  ]);
  expect(s[0]).toMatchObject({ kind: 'listening', attempts: 2, avg: 75, best: 100, last: 'b' });
});
