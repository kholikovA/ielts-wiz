import React, { useState, useEffect } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import {
  useHub, useAsync, Loaded, BackLink, PageTitle, EmptyPanel, HubLink, PersonName, Seg, ErrorNote, toLocalInput,
} from './ui';

const STATUSES = [
  { value: 'present', label: 'Present', className: 'att-present' },
  { value: 'late', label: 'Late', className: 'att-late' },
  { value: 'absent', label: 'Absent', className: 'att-absent' },
  { value: 'excused', label: 'Excused', className: 'att-excused' },
];

const when = (iso) => new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// /teach/attendance — pick a class, see its sessions, start a new one.
export function AttendanceHome() {
  const { user, go } = useHub();
  const classes = useAsync(() => api.teacherClasses(user.id), [user.id]);
  const [classId, setClassId] = useState(() => new URLSearchParams(window.location.search).get('class') || '');
  useEffect(() => {
    if (!classId && classes.data?.length) setClassId(classes.data[0].id);
  }, [classes.data, classId]);
  const sessions = useAsync(() => (classId ? api.classSessions(classId) : Promise.resolve([])), [classId]);
  const [heldAt, setHeldAt] = useState(() => toLocalInput(new Date()));
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const start = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const s = await api.createSession(classId, new Date(heldAt).toISOString(), topic.trim());
      go(`/teach/attendance/${s.id}`);
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Attendance" lead="Take the register for each class. Attendance builds each student's attendance streak and earns them coins." />
      <Loaded state={classes}>
        {(list) => !list.length ? (
          <EmptyPanel icon="users" title="No classes yet" lead="Create a class first.">
            <HubLink to="/teach/classes" className="btn btn-primary">Go to classes</HubLink>
          </EmptyPanel>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <form className="hub-form-row" onSubmit={start} style={{ alignItems: 'end' }}>
                <div className="form-field" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="att-class">Class</label>
                  <select id="att-class" className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                    {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-field" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="att-when">Session</label>
                  <input id="att-when" type="datetime-local" className="form-input" value={heldAt} onChange={(e) => setHeldAt(e.target.value)} required />
                </div>
                <div className="form-field" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="att-topic">Topic (optional)</label>
                  <input id="att-topic" className="form-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Task 1 maps" />
                </div>
                <button className="btn btn-primary" disabled={busy || !classId}><Icon name="clipboard" size={14} /> Take register</button>
              </form>
              {error && <div style={{ marginTop: 12 }}><ErrorNote error={error} /></div>}
            </div>

            <h2 className="h3" style={{ marginBottom: 12 }}>Past sessions</h2>
            <Loaded state={sessions}>
              {(rows) => rows.length ? (
                <div className="hub-list">
                  {rows.map((s) => {
                    const marks = s.attendance || [];
                    const present = marks.filter((m) => m.status === 'present' || m.status === 'late').length;
                    return (
                      <HubLink key={s.id} to={`/teach/attendance/${s.id}`} className="card card-interactive hub-row">
                        <span className="hub-kind-icon"><Icon name="calendar" size={16} /></span>
                        <div className="hub-row-main"><strong>{when(s.held_at)}</strong><small>{s.topic || 'No topic'}</small></div>
                        <small className="hub-num">{present}/{marks.length} present</small>
                        <Icon name="chevronRight" size={16} />
                      </HubLink>
                    );
                  })}
                </div>
              ) : <p>No sessions for this class yet.</p>}
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
  useEffect(() => { if (state.data) setMarks(new Map(state.data.marks)); }, [state.data]);

  const mark = async (studentId, status) => {
    const prev = marks.get(studentId);
    setMarks((m) => new Map(m).set(studentId, status));
    setError(null);
    try { await api.markAttendance(id, studentId, status); }
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
              <span className="eyebrow">{s.classes?.name}</span>
              <h1>{when(s.held_at)}</h1>
              <div className="hub-detail-meta">
                <span>{s.topic || 'No topic'}</span>
                <span className="hub-num">{[...marks.values()].filter((v) => v === 'present' || v === 'late').length}/{s.members.length} present</span>
              </div>
            </div>
            {error && <ErrorNote error={error} />}
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
              if (window.confirm('Delete this session and its register?')) api.deleteSession(s.id).then(() => go(`/teach/attendance?class=${s.class_id}`), setError);
            }}>Delete session</button>
          </>
        ) : <EmptyPanel icon="xCircle" title="Session not found" />}
      </Loaded>
    </>
  );
}
