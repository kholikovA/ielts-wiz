// Shared homework logic: kinds, status derivation, formatting, flashcard parsing.

export const KINDS = {
  test:       { label: 'Practice test', icon: 'target' },
  writing:    { label: 'Writing',       icon: 'pen' },
  custom:     { label: 'Task',          icon: 'checkCircle' },
  flashcards: { label: 'Flashcards',    icon: 'layers' },
  dictation:  { label: 'Dictation',     icon: 'headphones' },
  sentences:  { label: 'Use it',        icon: 'type' },
  quiz:       { label: 'Quiz',          icon: 'clipboard' },
};

export const RESULT_KIND_LABELS = {
  listening: 'Listening · Part practice',
  listening_full: 'Listening · Full test',
  reading_full: 'Reading · Full test',
  reading_p1: 'Reading · Passage 1',
  reading_p2: 'Reading · Passage 2',
  reading_p3: 'Reading · Passage 3',
  writing: 'Writing',
  grammar: 'Grammar',
};

// Attempts that count toward a test assignment: same kind + test, made after it was set.
export const attemptsFor = (assignment, results) => {
  if (assignment.kind !== 'test') return [];
  const { kind, test_id } = assignment.payload || {};
  return results.filter((r) =>
    r.kind === kind && String(r.test_id) === String(test_id) && r.completed_at >= assignment.created_at);
};

// One status per (assignment, student):
//   todo · started · submitted · reviewed · passed · redo · done (test attempted)
export function statusOf(assignment, submission, attempts = []) {
  if (assignment.kind === 'test') return attempts.length ? 'done' : 'todo';
  if (!submission) return 'todo';
  const verdict = submission.marking?.verdict;
  if (submission.reviewed_at) return verdict === 'passed' ? 'passed' : 'reviewed';
  if (submission.status === 'submitted') return 'submitted';
  return verdict === 'redo' ? 'redo' : 'started';
}

export const isComplete = (status) => ['done', 'submitted', 'reviewed', 'passed'].includes(status);

export const isOverdue = (assignment, status) =>
  !isComplete(status) && assignment.due_at && new Date(assignment.due_at) < new Date();

export const STATUS_LABEL = {
  todo: 'To do',
  started: 'In progress',
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  done: 'Done',
  passed: 'Passed',
  redo: 'Needs redo',
  overdue: 'Overdue',
};

export const statusPillClass = (s) =>
  s === 'overdue' ? 'pill hub-pill-danger'
    : isComplete(s) ? 'pill pill-success'
      : s === 'started' || s === 'redo' ? 'pill pill-amber'
        : 'pill';

export const pct = (correct, total) => (total ? Math.round((correct / total) * 100) : 0);

export function formatDate(iso, withTime = false) {
  if (!iso) return '';
  const d = new Date(iso);
  const opts = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString(undefined, opts);
}

export function dueLabel(iso) {
  if (!iso) return 'No due date';
  const days = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (days < 0) return `Was due ${formatDate(iso)}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due ${formatDate(iso)}`;
}

// One card per line: "front - back", "front = back", "front: back" or tab-separated
// (pasting two spreadsheet columns works).
export function parseCards(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?)\s*(?:\t|\s[-–—=]\s|:\s)\s*(.+)$/);
      return m ? { f: m[1].trim(), b: m[2].trim() } : null;
    })
    .filter(Boolean);
}

export const wordCount = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;

// Summary per result kind for progress views.
export function summarise(results) {
  const by = new Map();
  results.forEach((r) => {
    const s = by.get(r.kind) || { kind: r.kind, attempts: 0, correct: 0, total: 0, best: 0, last: null };
    s.attempts += 1;
    s.correct += r.correct || 0;
    s.total += r.total || 0;
    s.best = Math.max(s.best, pct(r.correct, r.total));
    if (!s.last || r.completed_at > s.last) s.last = r.completed_at;
    by.set(r.kind, s);
  });
  return [...by.values()]
    .map((s) => ({ ...s, avg: pct(s.correct, s.total), label: RESULT_KIND_LABELS[s.kind] || s.kind }))
    .sort((a, b) => b.attempts - a.attempts);
}

// Collection stats from srsSnapshot(): card counts, due today, 30-day retention, streak.
export function srsStats({ cards, reviews }, now = new Date(), dayEnd) {
  const end = (dayEnd || now).getTime();
  const due = cards.filter((c) => c.state !== 0 && new Date(c.due).getTime() <= end).length;
  const fresh = cards.filter((c) => c.state === 0).length;
  const mature = cards.filter((c) => c.state === 2 && (c.stability || 0) >= 21).length;
  const graded = reviews.filter((r) => r.state === 2);
  const retention = graded.length ? Math.round((graded.filter((r) => r.rating > 1).length / graded.length) * 100) : null;
  const dayKey = (d) => { const x = new Date(d); x.setHours(x.getHours() - 4); return x.toDateString(); };
  const days = new Set(reviews.map((r) => dayKey(r.reviewed_at)));
  let streak = 0;
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  const today = reviews.filter((r) => dayKey(r.reviewed_at) === dayKey(now)).length;
  return { total: cards.length, fresh, due, mature, learned: cards.length - fresh, retention, streak, today };
}
