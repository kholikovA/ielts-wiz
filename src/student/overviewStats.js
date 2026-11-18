// Viewer Overview: pure stats from viewer_overview() (20261118150000_class_viewers.sql).
//
// Homework counts once its due date has passed (or it has no due date, or it's
// already done); homework still open isn't held against anyone. Attendance is
// present/late out of marked classes, excused not counted (same as Teaching → Stats).

export const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);
const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const avgBand = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 2) / 2 : null);

// One homework result's state: on_time · late · missing · open.
export function resultState(result, assignment, now = new Date()) {
  const due = assignment.due_at ? new Date(assignment.due_at) : null;
  if (result.done_at) return due && new Date(result.done_at) > due ? 'late' : 'on_time';
  return due && due < now ? 'missing' : 'open';
}

export const STATE_LABEL = { on_time: 'On time', late: 'Late', missing: 'Missing', open: 'Not due yet' };

// Totals for a set of results (each already carrying its `state`) and attendance marks.
export function tally(results, marks) {
  const counted = results.filter((r) => r.state !== 'open');
  const done = counted.filter((r) => r.state === 'on_time' || r.state === 'late');
  const scores = results.map((r) => r.score).filter((x) => x !== null && x !== undefined).map(Number);
  const bands = results.map((r) => r.band).filter((x) => x !== null && x !== undefined).map(Number);
  const marked = marks.filter((m) => m.status !== 'excused');
  const attended = marked.filter((m) => m.status === 'present' || m.status === 'late').length;
  return {
    due: counted.length,
    done: done.length,
    onTime: counted.filter((r) => r.state === 'on_time').length,
    missing: counted.filter((r) => r.state === 'missing').length,
    open: results.length - counted.length,
    donePct: pct(done.length, counted.length),
    onTimePct: pct(counted.filter((r) => r.state === 'on_time').length, counted.length),
    avgScore: avg(scores),
    avgBand: avgBand(bands),
    attended,
    sessions: marked.length,
    attendancePct: pct(attended, marked.length),
  };
}

// Everything the Overview shows, limited to one class (classId) or all of them (null).
export function buildOverview(data, classId = null, now = new Date()) {
  const inScope = (cid) => !classId || cid === classId;
  const classes = data.classes.filter((c) => inScope(c.id));
  const className = new Map(data.classes.map((c) => [c.id, c.name]));
  const assignments = data.assignments.filter((a) => inScope(a.class_id));
  const byAssignment = new Map(assignments.map((a) => [a.id, a]));
  const results = data.results
    .filter((r) => byAssignment.has(r.assignment_id))
    .map((r) => ({ ...r, state: resultState(r, byAssignment.get(r.assignment_id), now) }));
  const sessions = data.sessions.filter((s) => inScope(s.class_id));
  const sessionClass = new Map(sessions.map((s) => [s.id, s.class_id]));
  const marks = data.attendance.filter((m) => sessionClass.has(m.session_id));
  const members = data.members.filter((m) => inScope(m.class_id));
  const people = new Map(data.students.map((s) => [s.id, s]));

  const studentIds = [...new Set(members.map((m) => m.student_id))];
  const students = studentIds.map((id) => {
    const p = people.get(id) || { id };
    const mine = results.filter((r) => r.student_id === id);
    return {
      ...p,
      classNames: members.filter((m) => m.student_id === id).map((m) => className.get(m.class_id)),
      ...tally(mine, marks.filter((m) => m.student_id === id)),
      results: mine,
    };
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const coinsOf = (ids) => ids.reduce((t, id) => t + Number(people.get(id)?.earned || 0), 0);

  const groups = classes.map((c) => {
    const ids = members.filter((m) => m.class_id === c.id).map((m) => m.student_id);
    const aIds = new Set(assignments.filter((a) => a.class_id === c.id).map((a) => a.id));
    const sIds = new Set(sessions.filter((s) => s.class_id === c.id).map((s) => s.id));
    return {
      ...c,
      students: ids.length,
      coins: coinsOf(ids),
      ...tally(results.filter((r) => aIds.has(r.assignment_id)), marks.filter((m) => sIds.has(m.session_id))),
    };
  });

  const homework = assignments.map((a) => {
    const rs = results.filter((r) => r.assignment_id === a.id);
    return { ...a, className: className.get(a.class_id), recipients: rs.length, ...tally(rs, []), results: rs };
  });

  return {
    classes,
    groups,
    homework,
    students,
    sessions,
    marks,
    totals: { ...tally(results, marks), students: studentIds.length, coins: coinsOf(studentIds) },
  };
}
