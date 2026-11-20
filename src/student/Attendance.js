import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { confirmDialog } from './dialog';
import { EduschoolSync } from './Eduschool';
import {
  PERIODS, KINDS, REGISTER_KINDS, dayParas, laterParas, paraLabel, periodStart, periodEnd, nowMarker,
} from './schedule/timetable';
import './teach.css';
import './schedule/schedule.css';
import {
  useHub, useAsync, Loaded, BackLink, PageTitle, EmptyPanel, HubLink, PersonName, Seg, ErrorNote,
} from './ui';

// Attendance works like the EduSchool journal: the day's paras from the
// schedule, one register per para, and a register can be copied onto the
// class's next para (the second half of a double, later office hours).

const STATUSES = [
  { value: 'present', label: 'Present', short: 'P', icon: 'check' },
  { value: 'late', label: 'Late', short: 'L', icon: 'clock' },
  { value: 'absent', label: 'Absent', short: 'A', icon: 'x' },
  { value: 'excused', label: 'Excused', short: 'E', icon: 'info' },
];
const ATTENDED = new Set(['present', 'late']);
const MARK = { present: 'P', late: 'L', absent: 'A', excused: 'E' };
const GRID_SESSIONS = 12;

const pad = (n) => String(n).padStart(2, '0');
const plural = (n, one) => `${n} ${n === 1 ? one : `${one}s`}`;
const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromDateInput = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const longDay = (d) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
const when = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const shortDay = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const weekday = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
const kindOf = (s) => s.kind || 'lesson';
const isOffice = (s) => kindOf(s) === 'office';
// When a para starts on a day: the register's time.
function paraStart(day, period) {
  const d = fromDateInput(day);
  const [h, m] = periodStart(period).split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
// Weekdays only: the school week has no weekend lessons.
function shiftDay(day, dir) {
  const d = fromDateInput(day);
  do { d.setDate(d.getDate() + dir); } while (d.getDay() === 0 || d.getDay() === 6);
  return toDateInput(d);
}
function rate(marks) {
  const counted = marks.filter((m) => m && m !== 'excused');
  return counted.length ? Math.round((counted.filter((m) => ATTENDED.has(m)).length / counted.length) * 100) : null;
}
const rateTone = (r) => (r == null ? '' : r >= 90 ? 'tp-good' : r >= 75 ? 'tp-mid' : 'tp-low');
// "1-para" / "Whole day" for a register.
const regTitle = (s) => (s.period ? `${paraLabel(s.period)} · ${periodStart(s.period)}` : 'Whole day');
// What the schedule calls this para (SAT, IELTS, Office hours…).
function subjectOf(slots, s) {
  if (isOffice(s)) return REGISTER_KINDS.office;
  const d = new Date(s.held_at).getDay();
  const slot = slots.find((x) => x.class_id === s.class_id && x.day === d && x.kind !== 'office' && x.kind !== 'blocked'
    && (!s.period || (s.period >= x.period && s.period < x.period + x.span)));
  return slot ? (slot.kind === 'other' ? slot.title : KINDS[slot.kind]?.label) : REGISTER_KINDS.lesson;
}

function setQuery(params) {
  const q = new URLSearchParams(window.location.search);
  Object.entries(params).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)));
  try { window.history.replaceState(window.history.state, '', `/teach/attendance?${q}`); } catch { /* ignore */ }
}

function SyncChip({ sync }) {
  if (!sync) return null;
  const map = {
    ok: ['checkCircle', 'is-ok', 'EduSchool'],
    partial: sync.retry_at ? ['clock', 'is-warn', 'EduSchool: waiting'] : ['info', 'is-warn', 'EduSchool: partly'],
    error: ['xCircle', 'is-bad', 'EduSchool: failed'],
    no_lessons: ['info', 'is-warn', 'Not in EduSchool'],
    not_linked: ['link', '', 'Not linked'],
  };
  const [icon, tone, text] = map[sync.status] || map.not_linked;
  return <span className={`at-chip ${tone}`.trim()}><Icon name={icon} size={13} />{text}</span>;
}

// /teach/attendance — the day's lessons, like the EduSchool journal.
export function AttendanceHome() {
  const { user, go } = useHub();
  const today = toDateInput(new Date());
  const [day, setDayState] = useState(() => {
    const q = new URLSearchParams(window.location.search).get('day');
    return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : today;
  });
  const setDay = (d) => { setDayState(d); setQuery({ day: d === today ? null : d }); };
  const slots = useAsync(() => api.teacherSchedule(user.id).catch(() => []), [user.id]);
  const classes = useAsync(() => api.teacherClasses(user.id), [user.id]);
  const regs = useAsync(() => api.registersOn(user.id, day), [user.id, day]);
  const [opening, setOpening] = useState(null);
  const [error, setError] = useState(null);

  const date = fromDateInput(day);
  const isToday = day === today;
  const now = isToday ? nowMarker() : null;

  const open = async (classId, period, kind) => {
    const key = `${classId}:${kind}:${period}`;
    setOpening(key); setError(null);
    try {
      const s = await api.lessonRegister(classId, paraStart(day, period), period, kind);
      go(`/teach/attendance/${s.id}`);
    } catch (err) { setError(err); setOpening(null); }
  };

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Attendance" lead="Take the register for each para. Attending builds each student's streak and earns them coins." />

      <div className="at-daybar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDay(shiftDay(day, -1))} aria-label="Previous day"><Icon name="chevronLeft" size={16} /></button>
        <div className="at-daybar-label">
          <strong>{isToday ? 'Today' : longDay(date)}</strong>
          <small>{isToday ? longDay(date) : date.getFullYear()}</small>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDay(shiftDay(day, 1))} disabled={day >= today} aria-label="Next day"><Icon name="chevronRight" size={16} /></button>
        <span className="at-daybar-spacer" />
        {!isToday && <button type="button" className="btn btn-sm" onClick={() => setDay(today)}>Today</button>}
        <input type="date" className="form-input at-daybar-date" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Date" />
      </div>
      {error && <ErrorNote error={error} />}

      <Loaded state={slots}>
        {(sl) => (
          <Loaded state={regs}>
            {(rs) => {
              const paras = dayParas(sl, date.getDay());
              const byKey = new Map(rs.filter((r) => r.period).map((r) => [`${r.class_id}:${kindOf(r)}:${r.period}`, r]));
              const extra = rs.filter((r) => !r.period || !paras.some((p) => p.key === `${r.class_id}:${kindOf(r)}:${r.period}`))
                .sort((a, b) => (a.period || 0) - (b.period || 0));
              const rows = paras.map((p) => ({ p, r: byKey.get(p.key) }));
              if (!rows.length && !extra.length) {
                return (
                  <EmptyPanel icon="calendar" title={date.getDay() === 0 || date.getDay() === 6 ? 'No lessons at the weekend' : 'No lessons on your schedule this day'}
                    lead="Lessons come from your Schedule. You can still take a register for any class below." />
                );
              }
              return (
                <div className="card at-lessons">
                  {rows.map(({ p, r }) => {
                    const marks = r?.attendance || [];
                    const present = marks.filter((m) => ATTENDED.has(m.status)).length;
                    const absent = marks.filter((m) => m.status === 'absent').length;
                    const live = now?.period === p.period;
                    const body = (
                      <>
                        <span className="at-para"><strong>{paraLabel(p.period)}</strong><small>{p.start}–{p.end}</small></span>
                        <span className="at-lesson-main">
                          <strong>{p.class_name}</strong>
                          <small>
                            <i className={`at-kind sch-${p.kind === 'office' ? 'office' : (sl.find((x) => x.class_id === p.class_id && x.day === date.getDay() && p.period >= x.period && p.period < x.period + x.span)?.kind || 'other')}`} />
                            {p.label}{p.part ? ` · part ${p.part} of ${p.span}` : ''}{live ? ' · now' : ''}
                          </small>
                        </span>
                        {r && marks.length ? (
                          <span className="at-lesson-count hub-num">
                            <span>{present}/{marks.length} present{absent ? ` · ${absent} absent` : ''}</span>
                            <SyncChip sync={r.sync} />
                          </span>
                        ) : (
                          <span className="at-lesson-cta">{opening === p.key ? 'Opening…' : 'Take attendance'}</span>
                        )}
                        <Icon name="chevronRight" size={16} />
                      </>
                    );
                    return r ? (
                      <HubLink key={p.key} to={`/teach/attendance/${r.id}`} className={`at-lesson${marks.length ? ' is-done' : ''}${live ? ' is-now' : ''}`}>{body}</HubLink>
                    ) : (
                      <button key={p.key} type="button" className={`at-lesson${live ? ' is-now' : ''}`} disabled={!!opening} onClick={() => open(p.class_id, p.period, p.kind)}>{body}</button>
                    );
                  })}
                  {extra.map((r) => {
                    const marks = r.attendance || [];
                    return (
                      <HubLink key={r.id} to={`/teach/attendance/${r.id}`} className="at-lesson is-done">
                        <span className="at-para"><strong>{r.period ? paraLabel(r.period) : 'Day'}</strong><small>{r.period ? periodStart(r.period) : 'whole day'}</small></span>
                        <span className="at-lesson-main"><strong>{r.classes?.name}</strong><small>{isOffice(r) ? 'Office hours' : 'Not on the schedule'}{r.topic ? ` · ${r.topic}` : ''}</small></span>
                        <span className="at-lesson-count hub-num"><span>{marks.filter((m) => ATTENDED.has(m.status)).length}/{marks.length} present</span><SyncChip sync={r.sync} /></span>
                        <Icon name="chevronRight" size={16} />
                      </HubLink>
                    );
                  })}
                </div>
              );
            }}
          </Loaded>
        )}
      </Loaded>

      <Loaded state={classes}>
        {(list) => list.length > 0 && <OtherLesson classes={list} busy={!!opening} onOpen={open} />}
      </Loaded>

      <Loaded state={classes}>
        {(list) => (list.length ? <ClassHistory classes={list} /> : (
          <EmptyPanel icon="users" title="No classes yet" lead="Create a class first.">
            <HubLink to="/teach/classes" className="btn btn-primary">Go to classes</HubLink>
          </EmptyPanel>
        ))}
      </Loaded>
    </>
  );
}

// A register for a para that isn't on the schedule (a swapped or extra lesson).
function OtherLesson({ classes, busy, onOpen }) {
  const [show, setShow] = useState(false);
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [period, setPeriod] = useState(1);
  const [kind, setKind] = useState('lesson');
  if (!show) {
    return <button type="button" className="at-other-link" onClick={() => setShow(true)}><Icon name="plus" size={14} /> Register for a lesson that isn't on the schedule</button>;
  }
  return (
    <form className="card at-other" onSubmit={(e) => { e.preventDefault(); onOpen(classId, period, kind); }}>
      <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select className="form-select" value={period} onChange={(e) => setPeriod(Number(e.target.value))} aria-label="Para">
        {PERIODS.map((p) => <option key={p.period} value={p.period}>{`${paraLabel(p.period)} · ${p.start}`}</option>)}
      </select>
      <Seg label="Type" value={kind} onChange={setKind} options={Object.entries(REGISTER_KINDS).map(([value, label]) => ({ value, label }))} />
      <button className="btn btn-primary" disabled={busy || !classId}>Open register</button>
      <button type="button" className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
    </form>
  );
}

// Per-class history: rates and the last registers.
function ClassHistory({ classes }) {
  const [classId, setClassIdState] = useState(() => {
    const q = new URLSearchParams(window.location.search).get('class');
    return classes.some((c) => c.id === q) ? q : classes[0].id;
  });
  const setClassId = (id) => { setClassIdState(id); setQuery({ class: id }); };
  const data = useAsync(async () => {
    const [sessions, cls] = await Promise.all([api.classSessions(classId), api.classWithMembers(classId)]);
    return { sessions, members: cls?.members || [] };
  }, [classId]);

  return (
    <section className="hub-section at-history">
      <div className="tp-section-head">
        <h2 className="h3">History</h2>
        {classes.length <= 6 ? (
          <Seg label="Class" value={classId} onChange={setClassId} options={classes.map((c) => ({ value: c.id, label: c.name }))} />
        ) : (
          <select className="form-select tp-select" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      <Loaded state={data}>
        {({ sessions, members }) => {
          const past = sessions.filter((s) => new Date(s.held_at) <= new Date());
          if (!past.length) return <p className="body">No registers for this class yet.</p>;
          const marksIn = (s) => new Map((s.attendance || []).map((m) => [m.student_id, m.status]));
          const classRate = rate(past.flatMap((s) => (s.attendance || []).map((m) => m.status)));
          const grid = past.slice(0, GRID_SESSIONS).reverse().map((s) => ({ s, marks: marksIn(s) }));
          const students = members.map((m) => {
            const mine = past.map((s) => marksIn(s).get(m.id));
            return { m, rate: rate(mine), absences: mine.filter((x) => x === 'absent').length };
          });
          const flagged = students.filter((x) => x.rate != null && x.rate < 75).length;
          return (
            <>
              <div className="tp-kpis at-kpis">
                <div className="card tp-kpi"><small>Registers</small><strong className="hub-num">{past.length}</strong><span>Last {shortDay(past[0].held_at)}</span></div>
                <div className="card tp-kpi"><small>Attendance rate</small><strong className={`hub-num ${rateTone(classRate)}`}>{classRate == null ? '–' : `${classRate}%`}</strong><span>present or late</span></div>
                <div className={`card tp-kpi${flagged ? ' is-danger' : ''}`}><small>Below 75%</small><strong className="hub-num">{flagged}</strong><span>{flagged ? `${plural(flagged, 'student')} to follow up` : 'Nobody'}</span></div>
              </div>
              {members.length > 0 && (
                <>
                  <div className="tp-section-head">
                    <h3 className="h4">By student</h3>
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
                              <HubLink to={`/teach/attendance/${s.id}`} className="hub-plain" title={`${isOffice(s) ? 'Office hours · ' : ''}${when(s.held_at)} · ${regTitle(s)}${s.topic ? ` · ${s.topic}` : ''}`}>
                                <small>{weekday(s.held_at)}{s.period ? ` ${s.period}p` : ''}{isOffice(s) ? ' OH' : ''}</small>{shortDay(s.held_at)}
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
                  {past.length > GRID_SESSIONS && <p className="form-help">Showing the last {GRID_SESSIONS} registers. Rates cover all {past.length}.</p>}
                </>
              )}
            </>
          );
        }}
      </Loaded>
    </section>
  );
}

// /teach/attendance/<session> — one para's register.
export function Register({ id }) {
  const { user, go } = useHub();
  const state = useAsync(() => api.sessionRegister(id), [id]);
  const slots = useAsync(() => api.teacherSchedule(user.id).catch(() => []), [user.id]);
  const [marks, setMarks] = useState(new Map());
  const [error, setError] = useState(null);
  const [changes, setChanges] = useState(0);
  const [copying, setCopying] = useState(null);
  useEffect(() => { if (state.data) setMarks(new Map(state.data.marks)); }, [state.data]);

  const s = state.data;
  const day = s ? toDateInput(new Date(s.held_at)) : null;
  const targets = useMemo(() => {
    if (!s?.period || !slots.data) return [];
    const paras = dayParas(slots.data, new Date(s.held_at).getDay());
    const self = paras.find((p) => p.class_id === s.class_id && p.kind === kindOf(s) && p.period === s.period)
      || { class_id: s.class_id, kind: kindOf(s), period: s.period };
    return laterParas(paras, self);
  }, [s, slots.data]);

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

  const markRest = async (members) => {
    const ids = members.filter((m) => !marks.get(m.id)).map((m) => m.id);
    if (!ids.length) return;
    setMarks((m) => { const n = new Map(m); ids.forEach((x) => n.set(x, 'present')); return n; });
    setError(null);
    try { await api.markMany(id, ids, 'present'); setChanges((n) => n + 1); }
    catch (err) { setError(err); state.reload(); }
  };

  const copyTo = async (p) => {
    setCopying(p.key); setError(null);
    try {
      const target = await api.lessonRegister(s.class_id, paraStart(day, p.period), p.period, p.kind);
      if (await api.registerMarkCount(target.id) > 0 && !await confirmDialog({
        title: `${paraLabel(p.period)} already has marks`,
        body: `Replace them with this register (${paraLabel(s.period)})?`,
        confirmLabel: 'Replace',
      })) { setCopying(null); return; }
      await api.copyRegister(id, target.id);
      // Send it to EduSchool straight away; its page shows the result.
      await api.eduschool('push', { session_id: target.id }).catch(() => {});
      go(`/teach/attendance/${target.id}`);
    } catch (err) { setError(err); }
    setCopying(null);
  };

  const counts = STATUSES.map((st) => ({ ...st, n: [...marks.values()].filter((v) => v === st.value).length }));

  return (
    <>
      <BackLink to={day ? `/teach/attendance?day=${day}` : '/teach/attendance'} label="Attendance" />
      <Loaded state={state}>
        {(reg) => reg ? (
          <>
            <div className="hub-detail-head">
              <span className="eyebrow">{reg.classes?.name} · {subjectOf(slots.data || [], reg)}</span>
              <h1>{reg.period ? `${paraLabel(reg.period)} · ${periodStart(reg.period)}–${periodEnd(reg.period)}` : 'Whole day'}</h1>
              <div className="hub-detail-meta">
                <span>{when(reg.held_at)}</span>
                {reg.topic && <span>{reg.topic}</span>}
              </div>
            </div>
            {error && <ErrorNote error={error} />}
            <EduschoolSync sessionId={reg.id} classId={reg.class_id} kind={kindOf(reg)} changes={changes} />
            {reg.members.length ? (
              <>
                <div className="at-toolbar">
                  <button type="button" className="btn btn-sm" onClick={() => markRest(reg.members)} disabled={marks.size >= reg.members.length}>
                    <Icon name="checkCircle" size={14} /> {marks.size ? 'Mark the rest present' : 'All present'}
                  </button>
                  <span className="at-counts hub-num">
                    {counts.map((c) => <span key={c.value} className={c.n ? '' : 'is-zero'}><i className={`at-dot at-${c.value}`}>{c.short}</i>{c.n}</span>)}
                    {reg.members.length - marks.size > 0 && <span className="at-unmarked">{reg.members.length - marks.size} not marked</span>}
                  </span>
                </div>
                <div className="card at-register">
                  {reg.members.map((m, i) => {
                    const v = marks.get(m.id) || null;
                    return (
                      <div key={m.id} className={`at-student${v ? '' : ' is-unmarked'}`}>
                        <span className="at-num hub-num">{i + 1}</span>
                        <span className="at-student-name"><PersonName person={m} /></span>
                        <span className="at-marks" role="radiogroup" aria-label={`Attendance for ${m.name || m.email}`}>
                          {STATUSES.map((st) => (
                            <button key={st.value} type="button" role="radio" aria-checked={v === st.value}
                              className={`at-mark at-mark--${st.value}${v === st.value ? ' is-on' : ''}`}
                              onClick={() => mark(m.id, st.value)} title={st.label}>
                              <Icon name={st.icon} size={14} /><span>{st.label}</span>
                            </button>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {targets.length > 0 && (
                  <div className="card at-copy">
                    <Icon name="copy" size={16} />
                    <span>Same students in the next para?</span>
                    {targets.map((p) => (
                      <button key={p.key} type="button" className="btn btn-primary btn-sm" disabled={!marks.size || !!copying} onClick={() => copyTo(p)}>
                        {copying === p.key ? 'Copying…' : <>Copy to {paraLabel(p.period)} · {p.start} <Icon name="arrowRight" size={14} /></>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : <p>No students in this class yet.</p>}
            <button type="button" className="btn btn-ghost btn-sm hub-danger at-delete" onClick={() => {
              confirmDialog({ title: 'Delete this register?', body: 'Its marks are deleted too.', confirmLabel: 'Delete', danger: true })
                .then((yes) => yes && api.deleteSession(reg.id).then(() => go(`/teach/attendance?day=${day}`), setError));
            }}>Delete register</button>
          </>
        ) : <EmptyPanel icon="xCircle" title="Register not found" />}
      </Loaded>
    </>
  );
}
