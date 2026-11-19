import React, { useState, useEffect } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { confirmDialog } from './dialog';
import { EduschoolSync } from './Eduschool';
import { REGISTER_KINDS, registerKindsFor, defaultRegisterKind } from './schedule/timetable';
import './teach.css';
import {
  useHub, useAsync, Loaded, BackLink, PageTitle, EmptyPanel, HubLink, PersonName, Seg, ErrorNote,
} from './ui';

const STATUSES = [
  { value: 'present', label: 'Present', className: 'att-present' },
  { value: 'late', label: 'Late', className: 'att-late' },
  { value: 'absent', label: 'Absent', className: 'att-absent' },
  { value: 'excused', label: 'Excused', className: 'att-excused' },
];

// Sessions are recorded by day only.
const when = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const pad = (n) => String(n).padStart(2, '0');
const plural = (n, one) => `${n} ${n === 1 ? one : `${one}s`}`;
const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Today's session is stamped "now" so it counts towards streaks straight away;
// another day is stamped at midday, which keeps it on that date in any time zone nearby.
function sessionTime(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (dateStr === toDateInput(new Date())) return new Date().toISOString();
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

const ATTENDED = new Set(['present', 'late']);
const MARK = { present: 'P', late: 'L', absent: 'A', excused: 'E' };
const GRID_SESSIONS = 12;
const shortDay = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const weekday = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
const sameDay = (iso, d = new Date()) => toDateInput(new Date(iso)) === toDateInput(d);
// Share of marked sessions attended; excused ones don't count against the student.
function rate(marks) {
  const counted = marks.filter((m) => m && m !== 'excused');
  return counted.length ? Math.round((counted.filter((m) => ATTENDED.has(m)).length / counted.length) * 100) : null;
}
const kindOf = (s) => s.kind || 'lesson';
const isOffice = (s) => kindOf(s) === 'office';
const rateTone = (r) => (r == null ? '' : r >= 90 ? 'tp-good' : r >= 75 ? 'tp-mid' : 'tp-low');

// /teach/attendance — pick a class, take today's register, see who comes.
export function AttendanceHome() {
  const { user, go } = useHub();
  const classes = useAsync(() => api.teacherClasses(user.id), [user.id]);
  const [classId, setClassIdState] = useState(() => new URLSearchParams(window.location.search).get('class') || '');
  const setClassId = (id) => {
    setClassIdState(id);
    try { window.history.replaceState(window.history.state, '', `/teach/attendance?class=${id}`); } catch { /* ignore */ }
  };
  useEffect(() => {
    if (classes.data?.length && !classes.data.some((c) => c.id === classId)) setClassIdState(classes.data[0].id);
  }, [classes.data, classId]);
  const slots = useAsync(() => api.teacherSchedule(user.id).catch(() => []), [user.id]);
  const data = useAsync(async () => {
    if (!classId) return null;
    const [sessions, cls] = await Promise.all([api.classSessions(classId), api.classWithMembers(classId)]);
    return { sessions, members: cls?.members || [] };
  }, [classId]);
  // Lesson or office hours: classes with office hours on the schedule take both.
  const kinds = registerKindsFor(slots.data || [], classId);
  const [kindChoice, setKind] = useState(null);
  const [heldOn, setHeldOn] = useState(() => toDateInput(new Date()));
  const [otherDay, setOtherDay] = useState(false);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const takenToday = new Set((data.data?.sessions || []).filter((s) => sameDay(s.held_at)).map(kindOf));
  const openToday = kinds.filter((k) => !takenToday.has(k));
  const offered = otherDay ? kinds : openToday;
  const formKind = offered.includes(kindChoice) ? kindChoice
    : (otherDay ? kinds[0] : defaultRegisterKind(slots.data || [], classId, openToday)) || 'lesson';

  const start = async (e) => {
    e.preventDefault();
    const day = otherDay ? heldOn : toDateInput(new Date());
    const kind = formKind;
    const existing = data.data?.sessions.find((s) => toDateInput(new Date(s.held_at)) === day && kindOf(s) === kind);
    if (existing && !await confirmDialog({
      title: `There is already ${kind === 'office' ? 'an office hours register' : 'a register'} for ${when(existing.held_at)}`,
      body: 'Open that one, or start a second session for the same day?',
      confirmLabel: 'Start another',
    })) { go(`/teach/attendance/${existing.id}`); return; }
    setBusy(true); setError(null);
    try {
      const s = await api.createSession(classId, sessionTime(day), topic.trim(), kind);
      go(`/teach/attendance/${s.id}`);
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Attendance" lead="Take the register for each lesson. Attending builds each student's streak and earns them coins." />
      <Loaded state={classes}>
        {(list) => !list.length ? (
          <EmptyPanel icon="users" title="No classes yet" lead="Create a class first.">
            <HubLink to="/teach/classes" className="btn btn-primary">Go to classes</HubLink>
          </EmptyPanel>
        ) : (
          <>
            <div className="at-classbar">
              {list.length <= 6 ? (
                <Seg label="Class" value={classId} onChange={setClassId} options={list.map((c) => ({ value: c.id, label: c.name }))} />
              ) : (
                <select className="form-select tp-select" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
                  {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            <Loaded state={data}>
              {(d) => {
                if (!d) return null;
                const { sessions, members } = d;
                const todays = sessions.filter((s) => sameDay(s.held_at)).reverse();
                const past = sessions.filter((s) => new Date(s.held_at) <= new Date());
                const marksIn = (s) => new Map((s.attendance || []).map((m) => [m.student_id, m.status]));
                const allMarks = past.flatMap((s) => (s.attendance || []).map((m) => m.status));
                const classRate = rate(allMarks);
                const grid = past.slice(0, GRID_SESSIONS).reverse().map((s) => ({ s, marks: marksIn(s) }));
                const students = members.map((m) => {
                  const mine = past.map((s) => marksIn(s).get(m.id));
                  return { m, rate: rate(mine), absences: mine.filter((x) => x === 'absent').length };
                });
                const flagged = students.filter((x) => x.rate != null && x.rate < 75).length;
                return (
                  <>
                    {todays.map((today) => (
                      <HubLink key={today.id} to={`/teach/attendance/${today.id}`} className="card card-interactive at-today is-done">
                        <span className="at-today-icon"><Icon name="checkCircle" size={20} /></span>
                        <span className="at-today-text">
                          <strong>{isOffice(today) ? "Today's office hours" : "Today's register"}</strong>
                          <small>{(today.attendance || []).length}/{members.length} marked · {(today.attendance || []).filter((m) => ATTENDED.has(m.status)).length} present{today.topic ? ` · ${today.topic}` : ''}</small>
                        </span>
                        <span className="btn btn-secondary btn-sm">Open register <Icon name="arrowRight" size={14} /></span>
                      </HubLink>
                    ))}
                    {(otherDay || openToday.length > 0) && (
                      <form className="card at-today" onSubmit={start}>
                        <span className="at-today-icon"><Icon name="clipboard" size={20} /></span>
                        <span className="at-today-text">
                          <strong>{otherDay ? 'Register for another day' : `Today · ${when(new Date().toISOString())}`}</strong>
                          <small>{plural(members.length, 'student')} in this class</small>
                        </span>
                        <div className="at-today-form">
                          {offered.length > 1 && (
                            <Seg label="Register for" value={formKind} onChange={setKind}
                              options={offered.map((k) => ({ value: k, label: REGISTER_KINDS[k] }))} />
                          )}
                          {otherDay && <input type="date" className="form-input" value={heldOn} max={toDateInput(new Date())} onChange={(e) => setHeldOn(e.target.value)} required aria-label="Date" />}
                          <input className="form-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (optional)" aria-label="Topic" maxLength={120} />
                          <button className="btn btn-primary" disabled={busy || !classId}>{busy ? 'Starting…' : formKind === 'office' && offered.length < 2 ? 'Take office hours register' : 'Take register'}</button>
                        </div>
                        <button type="button" className="at-today-alt" onClick={() => setOtherDay((v) => !v)}>
                          {otherDay ? 'Back to today' : 'Different date'}
                        </button>
                      </form>
                    )}
                    {error && <ErrorNote error={error} />}

                    {past.length > 0 && (
                      <div className="tp-kpis at-kpis">
                        <div className="card tp-kpi"><small>Lessons recorded</small><strong className="hub-num">{past.length}</strong><span>Last {shortDay(past[0].held_at)}</span></div>
                        <div className="card tp-kpi"><small>Attendance rate</small><strong className={`hub-num ${rateTone(classRate)}`}>{classRate == null ? '–' : `${classRate}%`}</strong><span>present or late</span></div>
                        <div className={`card tp-kpi${flagged ? ' is-danger' : ''}`}><small>Below 75%</small><strong className="hub-num">{flagged}</strong><span>{flagged ? plural(flagged, 'student') + ' to follow up' : 'Nobody'}</span></div>
                      </div>
                    )}

                    {past.length > 0 && members.length > 0 && (
                      <section className="hub-section">
                        <div className="tp-section-head">
                          <h2 className="h3">By student</h2>
                          <span className="at-legend">
                            {Object.entries(MARK).map(([k, v]) => <span key={k}><i className={`at-dot at-${k}`}>{v}</i>{k[0].toUpperCase() + k.slice(1)}</span>)}
                          </span>
                        </div>
                        <div className="card at-grid-wrap">
                          <table className="at-grid">
                            <thead>
                              <tr>
                                <th className="at-grid-name" scope="col">Student</th>
                                {grid.map(({ s }) => (
                                  <th key={s.id} scope="col">
                                    <HubLink to={`/teach/attendance/${s.id}`} className="hub-plain" title={`${isOffice(s) ? 'Office hours · ' : ''}${when(s.held_at)}${s.topic ? ` · ${s.topic}` : ''}`}>
                                      <small>{weekday(s.held_at)}{isOffice(s) ? ' · OH' : ''}</small>{shortDay(s.held_at)}
                                    </HubLink>
                                  </th>
                                ))}
                                <th scope="col" className="at-grid-rate">Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.map(({ m, rate: r, absences }) => (
                                <tr key={m.id}>
                                  <th scope="row" className="at-grid-name">
                                    <HubLink to={`/teach/students/${m.id}`} className="hub-plain"><PersonName person={m} /></HubLink>
                                  </th>
                                  {grid.map(({ s, marks }) => {
                                    const v = marks.get(m.id);
                                    return <td key={s.id}>{v ? <i className={`at-dot at-${v}`} title={v}>{MARK[v]}</i> : <i className="at-dot at-none" title="Not marked" />}</td>;
                                  })}
                                  <td className={`at-grid-rate hub-num ${rateTone(r)}`} title={absences ? `${absences} absent` : undefined}>{r == null ? '–' : `${r}%`}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {past.length > GRID_SESSIONS && <p className="form-help">Showing the last {GRID_SESSIONS} lessons. Rates cover all {past.length}.</p>}
                      </section>
                    )}

                    <section className="hub-section">
                      <h2 className="h3" style={{ marginBottom: 12 }}>Lessons</h2>
                      {sessions.length ? (
                        <div className="hub-list">
                          {sessions.map((s) => {
                            const marks = s.attendance || [];
                            const present = marks.filter((m) => ATTENDED.has(m.status)).length;
                            const absent = marks.filter((m) => m.status === 'absent').length;
                            return (
                              <HubLink key={s.id} to={`/teach/attendance/${s.id}`} className="card card-interactive hub-row at-session">
                                <span className="at-date"><small>{weekday(s.held_at)}</small><strong>{new Date(s.held_at).getDate()}</strong><small>{new Date(s.held_at).toLocaleDateString(undefined, { month: 'short' })}</small></span>
                                <div className="hub-row-main">
                                  <strong>{isOffice(s) && <span className="pill at-office-pill">Office hours</span>}{s.topic || (isOffice(s) ? null : <span className="hub-muted">No topic</span>)}</strong>
                                  <small>{when(s.held_at)}{marks.length < members.length ? ` · ${members.length - marks.length} not marked` : ''}</small>
                                </div>
                                <span className="at-session-count hub-num">
                                  <span className="hub-bar"><span style={{ width: `${marks.length ? (present / marks.length) * 100 : 0}%` }} /></span>
                                  <small>{present}/{marks.length} present{absent ? ` · ${absent} absent` : ''}</small>
                                </span>
                                <Icon name="chevronRight" size={16} />
                              </HubLink>
                            );
                          })}
                        </div>
                      ) : <p className="body">No lessons recorded for this class yet.</p>}
                    </section>
                  </>
                );
              }}
            </Loaded>
          </>
        )}
      </Loaded>
    </>
  );
}

// /teach/attendance/<session> — the register.
export function Register({ id }) {
  const { go } = useHub();
  const state = useAsync(() => api.sessionRegister(id), [id]);
  const [marks, setMarks] = useState(new Map());
  const [error, setError] = useState(null);
  const [changes, setChanges] = useState(0);
  useEffect(() => { if (state.data) setMarks(new Map(state.data.marks)); }, [state.data]);

  const mark = async (studentId, status) => {
    const prev = marks.get(studentId);
    setMarks((m) => new Map(m).set(studentId, status));
    setError(null);
    try { await api.markAttendance(id, studentId, status); setChanges((n) => n + 1); }
    catch (err) {
      setMarks((m) => { const n = new Map(m); if (prev) n.set(studentId, prev); else n.delete(studentId); return n; });
      setError(err);
    }
  };

  const markAll = async (members) => {
    for (const m of members) {
      if (!marks.get(m.id)) await mark(m.id, 'present'); // eslint-disable-line no-await-in-loop
    }
  };

  return (
    <>
      <BackLink to="/teach/attendance" label="Attendance" />
      <Loaded state={state}>
        {(s) => s ? (
          <>
            <div className="hub-detail-head">
              <span className="eyebrow">{s.classes?.name}{isOffice(s) ? ' · Office hours' : ''}</span>
              <h1>{when(s.held_at)}</h1>
              <div className="hub-detail-meta">
                <span>{s.topic || 'No topic'}</span>
                <span className="hub-num">{[...marks.values()].filter((v) => v === 'present' || v === 'late').length}/{s.members.length} present</span>
              </div>
            </div>
            {error && <ErrorNote error={error} />}
            <EduschoolSync sessionId={s.id} classId={s.class_id} kind={kindOf(s)} changes={changes} />
            {s.members.length ? (
              <>
                <div className="hub-actions" style={{ marginBottom: 12 }}>
                  <button type="button" className="btn btn-sm" onClick={() => markAll(s.members)}><Icon name="check" size={14} /> Mark the rest present</button>
                </div>
                <div className="hub-list">
                  {s.members.map((m) => (
                    <div key={m.id} className="hub-att-row">
                      <PersonName person={m} />
                      <Seg label={`Attendance for ${m.name || m.email}`} value={marks.get(m.id) || null} onChange={(v) => mark(m.id, v)} options={STATUSES} />
                    </div>
                  ))}
                </div>
              </>
            ) : <p>No students in this class yet.</p>}
            <button type="button" className="btn btn-ghost btn-sm hub-danger" onClick={() => {
              confirmDialog({ title: 'Delete this session?', body: 'Its attendance register is deleted too.', confirmLabel: 'Delete', danger: true })
                .then((yes) => yes && api.deleteSession(s.id).then(() => go(`/teach/attendance?class=${s.class_id}`), setError));
            }}>Delete session</button>
          </>
        ) : <EmptyPanel icon="xCircle" title="Session not found" />}
      </Loaded>
    </>
  );
}
