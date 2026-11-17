import React from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { KINDS, dueLabel, assignmentCounts } from './homework';
import { useHub, useAsync, Loaded, HubLink, Avatar, Coin } from './ui';
import DashboardHero from './DashboardHero';
import { isOfficeHours } from './welcome';
import './dashboard.css';

// Teaching → Dashboard: what needs the teacher today. Marking first, then the
// homework still open, then the students who are slipping.

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Pure: everything the page shows, from the raw lists.
export function teacherOverview({ assignments, students, sums }, now = new Date()) {
  const rows = assignments.map((a) => ({ a, c: assignmentCounts(a, now) }));
  const byDue = (x, y) => (x.a.due_at || '9999').localeCompare(y.a.due_at || '9999');
  const review = rows.filter((r) => r.c.toReview > 0).sort(byDue);
  const open = rows.filter((r) => !r.c.scheduled && !r.c.pastDue && r.c.total > 0 && r.c.submitted < r.c.total).sort(byDue);
  const dueToday = rows.filter((r) => !r.c.scheduled && r.a.due_at && sameDay(new Date(r.a.due_at), now)).length;
  const scheduled = rows.filter((r) => r.c.scheduled).length;
  // Students with no homework streak or no coins this week, weakest first.
  const watch = students
    .map((s) => ({ s, sum: sums.get(s.id) }))
    .filter((x) => x.sum && (x.sum.homework_streak === 0 || Number(x.sum.week) <= 0))
    .sort((x, y) => x.sum.homework_streak - y.sum.homework_streak || Number(x.sum.week) - Number(y.sum.week) || x.sum.attendance_streak - y.sum.attendance_streak);
  return {
    review, open, watch, dueToday, scheduled,
    toReview: review.reduce((n, r) => n + r.c.toReview, 0),
  };
}

function summaryLines(o, students) {
  const lines = [];
  if (o.toReview) lines.push(`${plural(o.toReview, 'submission')} waiting for your feedback.`);
  if (o.dueToday) lines.push(`${plural(o.dueToday, 'assignment')} due today.`);
  if (o.open.length) lines.push(`${plural(o.open.length, 'assignment')} still open across your classes.`);
  if (o.watch.length) lines.push(`${plural(o.watch.length, 'student')} could use a nudge this week.`);
  if (!lines.length) lines.push(students ? 'Everything is marked and up to date.' : 'Create a class and share its join link to get started.');
  return lines;
}

const classTip = (next) => {
  if (next.live) return 'Class is on now. Take the register so streaks and coins update.';
  return isOfficeHours(next.slot)
    ? 'Office hours next. Check Messages for questions students sent ahead.'
    : 'Take the register at the start so attendance streaks and coins update.';
};

function Stat({ icon, label, value, to, tone }) {
  return (
    <HubLink to={to} className={`card d4-card td-stat${tone ? ` td-stat--${tone}` : ''}`}>
      <span className="td-stat-icon"><Icon name={icon} size={20} /></span>
      <span className="td-stat-body"><strong>{value}</strong><small>{label}</small></span>
    </HubLink>
  );
}

function Empty({ icon, children }) {
  return <div className="dash-quiet d4-quiet"><Icon name={icon} size={18} /><span>{children}</span></div>;
}

export default function TeacherDashboard() {
  const { user, profile } = useHub();
  const data = useAsync(async () => {
    const [assignments, roster, sums, slots] = await Promise.all([
      api.teacherAssignments(user.id),
      api.teacherStudents(user.id),
      api.teacherSummaries().catch(() => new Map()),
      api.teacherSchedule(user.id).catch(() => []),
    ]);
    return { assignments, ...roster, sums, slots };
  }, [user.id]);

  return (
    <div className="stage">
      <Loaded state={data}>
        {({ assignments, students, classes, sums, slots }) => {
          const o = teacherOverview({ assignments, students, sums });
          return (
            <div className="dash4 td">
              <DashboardHero name={profile?.name} slots={slots} lines={summaryLines(o, students.length)} tip={classTip}
                scheduleTo="/teach/schedule" emptyText="Nothing on your timetable yet. Add your lessons in Schedule.">
                <div className="td-actions">
                  <HubLink to="/teach/assignments/new" className="btn btn-primary"><Icon name="plus" size={16} /> New assignment</HubLink>
                  <HubLink to="/teach/attendance" className="btn"><Icon name="checkCircle" size={16} /> Take attendance</HubLink>
                </div>
              </DashboardHero>

              <div className="td-stats">
                <Stat icon="eye" label="to review" value={o.toReview} to="/teach/assignments" tone={o.toReview ? 'warn' : null} />
                <Stat icon="clipboard" label="open assignments" value={o.open.length} to="/teach/assignments" />
                <Stat icon="clock" label="due today" value={o.dueToday} to="/teach/assignments" />
                <Stat icon="graduation" label={`students in ${plural(classes.length, 'class', 'classes')}`} value={students.length} to="/teach/students" />
              </div>

              <div className="dash4-grid td-grid">
                <section className="card d4-card">
                  <div className="hub-section-head"><h2 className="h3">To review</h2><HubLink to="/teach/assignments">All assignments</HubLink></div>
                  {o.review.length ? (
                    <div className="d4-list">
                      {o.review.map(({ a, c }) => (
                        <HubLink key={a.id} to={`/teach/assignments/${a.id}`} className="dash-hw">
                          <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={16} /></span>
                          <div className="dash-hw-main td-row">
                            <strong>{a.title}</strong>
                            <small>{a.classes?.name || 'Individual students'} · {dueLabel(a.due_at)}</small>
                          </div>
                          <span className="pill pill-amber">{c.toReview} to review</span>
                        </HubLink>
                      ))}
                    </div>
                  ) : <Empty icon="checkCircle">Nothing waiting. Every submission has been reviewed.</Empty>}
                </section>

                <section className="card d4-card">
                  <div className="hub-section-head"><h2 className="h3">Open homework</h2>
                    {o.scheduled > 0 && <small className="hub-muted">{o.scheduled} scheduled</small>}
                  </div>
                  {o.open.length ? (
                    <div className="d4-list">
                      {o.open.map(({ a, c }) => (
                        <HubLink key={a.id} to={`/teach/assignments/${a.id}`} className="dash-hw">
                          <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={16} /></span>
                          <div className="dash-hw-main">
                            <div className="dash-hw-top"><strong>{a.title}</strong><small className="hub-num td-frac">{c.submitted}/{c.total}</small></div>
                            <div className="dash-hw-bottom">
                              <span className="hub-bar hub-bar--wide"><span style={{ width: `${(c.submitted / c.total) * 100}%` }} /></span>
                              <small>{dueLabel(a.due_at)}</small>
                            </div>
                          </div>
                        </HubLink>
                      ))}
                    </div>
                  ) : <Empty icon="clipboard">No homework is open right now.</Empty>}
                </section>

                <section className="card d4-card">
                  <div className="hub-section-head"><h2 className="h3">Students to check on</h2><HubLink to="/teach/students">All students</HubLink></div>
                  {o.watch.length ? (
                    <div className="d4-list">
                      {o.watch.map(({ s, sum }) => (
                        <HubLink key={s.id} to={`/teach/students/${s.id}`} className="dash-hw td-student">
                          <Avatar person={s} size={30} />
                          <div className="dash-hw-main td-row">
                            <strong>{s.name || s.email}</strong>
                            <small>{s.classNames.filter(Boolean).join(', ')}</small>
                          </div>
                          <span className="td-chips">
                            <span title="Homework streak" className={sum.homework_streak === 0 ? 'is-low' : ''}>HW {sum.homework_streak}</span>
                            <span title="Attendance streak">Att {sum.attendance_streak}</span>
                            <span title="Coins this week" className="hub-num"><Coin size={12} /> {sum.week}</span>
                          </span>
                        </HubLink>
                      ))}
                    </div>
                  ) : <Empty icon="sparkle">{students.length ? 'Everyone is keeping up this week.' : 'Students appear here once they join a class.'}</Empty>}
                </section>
              </div>
            </div>
          );
        }}
      </Loaded>
    </div>
  );
}
