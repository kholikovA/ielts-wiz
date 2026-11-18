import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useAsync, Loaded, ErrorNote, HubLink } from './ui';

// EduSchool = the school's own platform. Registers taken in the hub are sent
// to its journal by the `eduschool` edge function.

// Class page: link the hub class to an EduSchool class/group + subject, and
// check which student is which.
export function EduschoolClassPanel({ classId }) {
  const state = useAsync(() => api.eduschool('roster', { class_id: classId }), [classId]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  const act = async (fn) => {
    setError(null);
    try { await fn(); state.reload(); } catch (err) { setError(err); }
  };

  return (
    <section className="hub-section">
      <div className="hub-section-head">
        <h2 className="h3">EduSchool</h2>
        {state.data?.link && !editing && (
          <div className="hub-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Icon name="edit" size={14} /> Change</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => act(() => api.eduschool('unlink', { class_id: classId }))}>Unlink</button>
          </div>
        )}
      </div>
      {error && <ErrorNote error={error} />}
      <Loaded state={state}>
        {(d) => (!d?.link || editing) ? (
          <LinkForm
            current={d?.link}
            onCancel={d?.link ? () => setEditing(false) : null}
            onSave={(v) => act(async () => { await api.eduschool('link', { class_id: classId, ...v }); setEditing(false); })}
          />
        ) : (
          <>
            <p className="form-help" style={{ marginTop: 0, marginBottom: 12 }}>
              Registers for this class go to <strong>{d.link.es_class_label}</strong>{d.link.es_subject_name ? ` · ${d.link.es_subject_name}` : ''} in EduSchool,
              on every {d.link.es_subject_name ? `${d.link.es_subject_name} ` : ''}lesson that day. Late is sent as "Kech keldi".
            </p>
            <div className="card">
              {d.students.map((s) => (
                <div key={s.id} className="hub-att-row">
                  <span className="hub-person"><span><strong>{s.name || 'Unnamed'}</strong>{s.email && <small>{s.email}</small>}</span></span>
                  {s.es_student_id && s.in_roster === false && <small className="hub-danger">Not in {d.link.es_class_label}</small>}
                  <select
                    className="form-select" style={{ maxWidth: 320 }}
                    aria-label={`EduSchool record for ${s.name || s.email}`}
                    value={s.es_student_id && s.in_roster ? s.es_student_id : ''}
                    onChange={(e) => act(() => api.eduschool('map', { class_id: classId, student_id: s.id, es_student_id: e.target.value || null }))}
                  >
                    <option value="">{s.skipped ? 'Not linked' : 'Not linked yet'}</option>
                    {d.roster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              ))}
              {!d.students.length && <p className="body" style={{ padding: 16 }}>No students in this class yet.</p>}
            </div>
            <p className="form-help">Students were matched by name. Fix any that are wrong; unlinked students are left out of EduSchool.</p>
          </>
        )}
      </Loaded>
    </section>
  );
}

function LinkForm({ current, onSave, onCancel }) {
  const classes = useAsync(() => api.eduschool('classes'), []);
  const [esClass, setEsClass] = useState(current?.es_class_id || '');
  // A group has one subject, so only a class needs one picked.
  const isGroup = classes.data?.find((x) => x.id === esClass)?.type === 'group';
  const subjects = useAsync(() => (esClass && !isGroup ? api.eduschool('subjects', { es_class_id: esClass }) : Promise.resolve([])), [esClass, isGroup]);
  const [subject, setSubject] = useState(current?.es_subject_id || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const list = subjects.data || [];
    if (list.length && !list.some((s) => s.id === subject)) setSubject(list.length === 1 ? list[0].id : '');
  }, [subjects.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    const c = classes.data.find((x) => x.id === esClass);
    const s = isGroup ? null : subjects.data.find((x) => x.id === subject);
    if (!c || (!isGroup && !s)) return;
    setBusy(true);
    await onSave({ es_class_id: c.id, es_class_label: c.label, es_subject_id: s?.id || null, es_subject_name: s?.name || null });
    setBusy(false);
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <p className="form-help" style={{ marginTop: 0 }}>Link this class to its EduSchool class or group. Attendance you take here is then sent to the EduSchool journal.</p>
      <Loaded state={classes}>
        {(list) => (
          <form className="hub-form-row" onSubmit={submit} style={{ alignItems: 'end' }}>
            <div className="form-field" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="es-class">EduSchool class or group</label>
              <select id="es-class" className="form-select" value={esClass} onChange={(e) => setEsClass(e.target.value)} required>
                <option value="">Choose…</option>
                {list.map((c) => <option key={c.id} value={c.id}>{c.label} ({c.students})</option>)}
              </select>
            </div>
            {!isGroup && <div className="form-field" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="es-subject">Subject</label>
              <select id="es-subject" className="form-select" value={subject} onChange={(e) => setSubject(e.target.value)} required disabled={!esClass || subjects.loading}>
                <option value="">{subjects.loading ? 'Loading…' : 'Choose…'}</option>
                {(subjects.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}{s.teacher ? ` · ${s.teacher}` : ''}</option>)}
              </select>
              {!subjects.loading && esClass && !subjects.data?.length && <p className="form-help">EduSchool lists no subjects for this class.</p>}
            </div>}
            <button className="btn btn-primary" disabled={busy || !esClass || (!isGroup && !subject)}><Icon name="link" size={14} /> {current ? 'Save' : 'Link'}</button>
            {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
          </form>
        )}
      </Loaded>
      {subjects.error && <ErrorNote error={subjects.error} />}
    </div>
  );
}

const ago = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

// Register page: sends the register a moment after the last change (and when
// leaving the page), and shows what EduSchool has.
export function EduschoolSync({ sessionId, classId, changes }) {
  const link = useAsync(() => api.eduschoolLink(classId), [classId]);
  const last = useAsync(() => api.eduschoolSync(sessionId), [sessionId]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const pending = useRef(false);
  const timer = useRef(null);

  const send = useCallback(async () => {
    clearTimeout(timer.current);
    pending.current = false;
    setBusy(true); setError(null);
    try { setResult(await api.eduschool('push', { session_id: sessionId })); } catch (err) { setError(err); }
    setBusy(false);
  }, [sessionId]);

  useEffect(() => {
    if (!changes || !link.data) return undefined;
    pending.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(send, 1500);
    return undefined;
  }, [changes, link.data, send]);

  // Leaving the page before the timer fires still sends it.
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (pending.current) api.eduschool('push', { session_id: sessionId }).catch(() => {});
  }, [sessionId]);

  if (link.loading && !link.data) return null;
  if (!link.data) {
    return (
      <div className="card hub-sync">
        <Icon name="link" size={16} />
        <span>Not linked to EduSchool. <HubLink to={`/teach/classes/${classId}`}>Link this class</HubLink> to send registers to the school journal.</span>
      </div>
    );
  }

  const r = result || last.data;
  let icon = 'refresh';
  let text = `Changes are sent to EduSchool (${[link.data.es_class_label, link.data.es_subject_name].filter(Boolean).join(' · ')}).`;
  let tone = '';
  if (busy) { text = 'Sending to EduSchool…'; }
  else if (error) { icon = 'xCircle'; tone = 'is-bad'; text = error.message; }
  else if (r) {
    const lessons = (r.lessons || []).map((l) => l.label).join(', ');
    if (r.status === 'ok') { icon = 'checkCircle'; tone = 'is-ok'; text = `In EduSchool: ${r.sent} student${r.sent === 1 ? '' : 's'} on ${lessons} · ${ago(r.synced_at)}`; }
    else if (r.status === 'partial') {
      icon = 'info'; tone = 'is-warn';
      text = [r.sent ? `In EduSchool: ${r.sent} on ${lessons}` : null,
        r.unlinked?.length ? `not linked: ${r.unlinked.join(', ')}` : null, r.message].filter(Boolean).join(' · ');
    } else { icon = r.status === 'error' ? 'xCircle' : 'info'; tone = r.status === 'error' ? 'is-bad' : 'is-warn'; text = r.message; }
  }

  return (
    <div className={`card hub-sync ${tone}`.trim()} role="status">
      <Icon name={icon} size={16} />
      <span>{text}{r?.unlinked?.length > 0 && !busy && <> — <HubLink to={`/teach/classes/${classId}`}>link students</HubLink></>}</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={send} disabled={busy}>{r ? 'Send again' : 'Send now'}</button>
    </div>
  );
}
