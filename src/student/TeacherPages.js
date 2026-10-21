import React, { useState, useMemo } from 'react';
import Icon from '../components/ui/icons';
import PageHeader from '../components/ui/PageHeader';
import * as api from './api';
import {
  KINDS, attemptsFor, statusOf, isComplete, isOverdue, dueLabel, formatDate, pct, parseCards, wordCount,
} from './homework';
import { TEST_GROUPS, ALL_TESTS, testKey, WRITING_PROMPTS } from './catalog';
import {
  useHub, useAsync, Loaded, EmptyPanel, HubLink, BackLink, StatusPill, KindTag, PersonName, CopyButton, ErrorNote,
} from './ui';
import { ResultsSummary, RecentAttempts } from './StudentPages';

const joinUrl = (code) => `${window.location.origin}/join/${code}`;

// ── Classes ──────────────────────────────────────────────────────────────────
export function Classes() {
  const { user, go } = useHub();
  const state = useAsync(() => api.teacherClasses(user.id), [user.id]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { const c = await api.createClass(name.trim()); go(`/teach/classes/${c.id}`); }
    catch (err) { setError(err); setBusy(false); }
  };

  return (
    <>
      <PageHeader eyebrow="Teaching" title="Classes" lead="Create a class and share its join link. Students who join get the class's homework." />
      <form className="hub-inline-form" onSubmit={create}>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="New class name, e.g. Evening B2" maxLength={80} aria-label="Class name" />
        <button className="btn btn-primary" disabled={busy || !name.trim()}><Icon name="plus" size={16} /> Create class</button>
      </form>
      {error && <ErrorNote error={error} />}
      <Loaded state={state}>
        {(classes) => classes.length ? (
          <div className="hub-list" style={{ marginTop: 'var(--space-6)' }}>
            {classes.map((c) => (
              <HubLink key={c.id} to={`/teach/classes/${c.id}`} className="card card-interactive hub-row">
                <div className="hub-row-main">
                  <strong>{c.name}</strong>
                  <small>{c.class_members?.[0]?.count ?? 0} students · code <code>{c.join_code}</code></small>
                </div>
                <Icon name="chevronRight" size={18} />
              </HubLink>
            ))}
          </div>
        ) : <EmptyPanel icon="users" title="No classes yet" lead="Create your first class above." />}
      </Loaded>
    </>
  );
}

export function ClassDetail({ id }) {
  const { go } = useHub();
  const state = useAsync(() => api.classWithMembers(id), [id]);
  const [error, setError] = useState(null);

  const act = async (fn) => {
    setError(null);
    try { await fn(); state.reload(); } catch (err) { setError(err); }
  };

  return (
    <>
      <BackLink to="/teach/classes" label="Classes" />
      <Loaded state={state}>
        {(c) => c ? (
          <>
            <div className="hub-detail-head">
              <h1 className="h2">{c.name}</h1>
              <div className="hub-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                  const n = window.prompt('Rename class', c.name);
                  if (n && n.trim()) act(() => api.renameClass(c.id, n.trim()));
                }}><Icon name="edit" size={14} /> Rename</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                  if (window.confirm(`Archive "${c.name}"? Students stay linked to existing homework, but the join code stops working.`)) {
                    api.archiveClass(c.id).then(() => go('/teach/classes'), setError);
                  }
                }}>Archive</button>
              </div>
            </div>
            {error && <ErrorNote error={error} />}

            <div className="card hub-invite">
              <div>
                <small className="eyebrow">Join code</small>
                <div className="hub-code">{c.join_code}</div>
                <p className="form-help">{joinUrl(c.join_code)}</p>
              </div>
              <div className="hub-actions">
                <CopyButton text={joinUrl(c.join_code)} label="Copy link" />
                <CopyButton text={c.join_code} label="Copy code" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                  if (window.confirm('Make a new code? The old link will stop working.')) act(() => api.newJoinCode(c.id));
                }}><Icon name="refresh" size={14} /> New code</button>
              </div>
            </div>

            <section className="hub-section">
              <div className="hub-section-head">
                <h2 className="h3">Students ({c.members.length})</h2>
                <HubLink to={`/teach/assignments/new?class=${c.id}`} className="btn btn-primary btn-sm"><Icon name="plus" size={14} /> Assign homework</HubLink>
              </div>
              {c.members.length ? (
                <div className="hub-list">
                  {c.members.map((m) => (
                    <div key={m.id} className="card hub-row">
                      <HubLink to={`/teach/students/${m.id}`} className="hub-row-main hub-plain"><PersonName person={m} /></HubLink>
                      <small>Joined {formatDate(m.joined_at)}</small>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                        if (window.confirm(`Remove ${m.name || m.email} from ${c.name}?`)) act(() => api.removeMember(c.id, m.id));
                      }}>Remove</button>
                    </div>
                  ))}
                </div>
              ) : <p className="body">No students yet. Share the join link above.</p>}
            </section>
          </>
        ) : <EmptyPanel icon="xCircle" title="Class not found" />}
      </Loaded>
    </>
  );
}

// ── Students ─────────────────────────────────────────────────────────────────
export function Students() {
  const { user } = useHub();
  const state = useAsync(() => api.teacherStudents(user.id), [user.id]);
  const [q, setQ] = useState('');
  return (
    <>
      <PageHeader eyebrow="Teaching" title="Students" lead="Everyone in your classes. Open a student to see their scores and homework." />
      <Loaded state={state}>
        {({ students }) => {
          if (!students.length) return <EmptyPanel icon="users" title="No students yet" lead="Create a class and share its join link." />;
          const needle = q.trim().toLowerCase();
          const shown = needle ? students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(needle)) : students;
          return (
            <>
              <input className="form-input hub-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" aria-label="Search students" />
              <div className="hub-list">
                {shown.map((s) => (
                  <HubLink key={s.id} to={`/teach/students/${s.id}`} className="card card-interactive hub-row">
                    <div className="hub-row-main"><PersonName person={s} /></div>
                    <small>{s.classNames.join(', ')}</small>
                    <small>{s.target_score ? `Target ${s.target_score}` : ''}</small>
                    <Icon name="chevronRight" size={18} />
                  </HubLink>
                ))}
              </div>
            </>
          );
        }}
      </Loaded>
    </>
  );
}

export function StudentDetail({ id }) {
  const { user } = useHub();
  const state = useAsync(async () => {
    const [profile, results, homework] = await Promise.all([
      api.studentProfile(id), api.testResults(id), api.homeworkForStudent(user.id, id),
    ]);
    if (!profile) return null;
    const rows = homework.map((a) => {
      const attempts = attemptsFor(a, results);
      const base = statusOf(a, a.submission, attempts);
      return { ...a, attempts, status: isOverdue(a, base) ? 'overdue' : base };
    }).sort((x, y) => y.created_at.localeCompare(x.created_at));
    return { profile, results, rows };
  }, [id, user.id]);

  return (
    <>
      <BackLink to="/teach/students" label="Students" />
      <Loaded state={state}>
        {(d) => d ? (
          <>
            <div className="hub-detail-head">
              <PersonName person={d.profile} />
              <div className="hub-detail-meta">
                {d.profile.target_score && <span className="pill">Target {d.profile.target_score}</span>}
                {d.profile.last_sign_in_at && <span>Last seen {formatDate(d.profile.last_sign_in_at)}</span>}
              </div>
            </div>
            <div className="hub-stats">
              <div className="card hub-stat"><small>Homework done</small><strong>{d.rows.filter((a) => isComplete(a.status)).length}/{d.rows.length}</strong></div>
              <div className="card hub-stat"><small>Overdue</small><strong>{d.rows.filter((a) => a.status === 'overdue').length}</strong></div>
              <div className="card hub-stat"><small>Tests taken</small><strong>{d.results.length}</strong></div>
            </div>
            <section className="hub-section">
              <h2 className="h3">Homework</h2>
              {d.rows.length ? (
                <div className="hub-list">
                  {d.rows.map((a) => (
                    <HubLink key={a.id} to={`/teach/assignments/${a.id}`} className="card card-interactive hub-row">
                      <div className="hub-row-main"><KindTag kind={a.kind} /><strong>{a.title}</strong><small>{dueLabel(a.due_at)}</small></div>
                      {a.submission?.band != null && <span className="pill">Band {Number(a.submission.band).toFixed(1)}</span>}
                      <StatusPill status={a.status} />
                    </HubLink>
                  ))}
                </div>
              ) : <p className="body">You haven't assigned anything to this student yet.</p>}
            </section>
            <section className="hub-section"><h2 className="h3">Scores by section</h2><ResultsSummary results={d.results} /></section>
            <section className="hub-section"><h2 className="h3">Recent attempts</h2><RecentAttempts results={d.results} limit={15} /></section>
          </>
        ) : <EmptyPanel icon="xCircle" title="Student not found" lead="They may have left your classes." />}
      </Loaded>
    </>
  );
}

// ── Assignments ──────────────────────────────────────────────────────────────
export function Assignments() {
  const { user } = useHub();
  const state = useAsync(() => api.teacherAssignments(user.id), [user.id]);
  return (
    <>
      <PageHeader eyebrow="Teaching" title="Homework" lead="Everything you've assigned, with completion at a glance." />
      <HubLink to="/teach/assignments/new" className="btn btn-primary"><Icon name="plus" size={16} /> New assignment</HubLink>
      <Loaded state={state}>
        {(list) => list.length ? (
          <div className="hub-list" style={{ marginTop: 'var(--space-6)' }}>
            {list.map((a) => {
              const total = a.assignment_recipients.length;
              const submitted = a.submissions.filter((s) => s.status === 'submitted').length;
              const toReview = a.submissions.filter((s) => s.status === 'submitted' && !s.reviewed_at).length;
              return (
                <HubLink key={a.id} to={`/teach/assignments/${a.id}`} className="card card-interactive hub-row">
                  <div className="hub-row-main">
                    <KindTag kind={a.kind} />
                    <strong>{a.title}</strong>
                    <small>{a.classes?.name ? `${a.classes.name} · ` : ''}{dueLabel(a.due_at)}</small>
                  </div>
                  {a.kind !== 'test' && <small>{submitted}/{total} submitted</small>}
                  {a.kind === 'test' && <small>{total} student{total === 1 ? '' : 's'}</small>}
                  {toReview > 0 && a.kind !== 'flashcards' && <span className="pill pill-amber">{toReview} to review</span>}
                  <Icon name="chevronRight" size={18} />
                </HubLink>
              );
            })}
          </div>
        ) : <EmptyPanel icon="edit" title="No homework yet" lead="Create an assignment and pick a class or individual students." />}
      </Loaded>
    </>
  );
}

const toLocalInput = (d) => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

export function NewAssignment() {
  const { user, go } = useHub();
  const presetClass = new URLSearchParams(window.location.search).get('class') || '';
  const roster = useAsync(() => api.teacherStudents(user.id), [user.id]);

  const [kind, setKind] = useState('test');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [testKeyVal, setTestKeyVal] = useState('');
  const [promptId, setPromptId] = useState('');
  const [task, setTask] = useState('Task 2');
  const [prompt, setPrompt] = useState('');
  const [minWords, setMinWords] = useState(250);
  const [link, setLink] = useState('');
  const [cardsText, setCardsText] = useState('');
  const [target, setTarget] = useState('class');
  const [classId, setClassId] = useState(presetClass);
  const [picked, setPicked] = useState(new Set());
  const [due, setDue] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(23, 59, 0, 0); return toLocalInput(d);
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const cards = useMemo(() => parseCards(cardsText), [cardsText]);
  const test = ALL_TESTS.find((t) => testKey(t) === testKeyVal);

  const pickTest = (key) => {
    setTestKeyVal(key);
    const t = ALL_TESTS.find((x) => testKey(x) === key);
    if (t && (!title || ALL_TESTS.some((x) => x.label === title))) setTitle(t.label);
  };

  const pickPrompt = (id) => {
    setPromptId(id);
    const p = WRITING_PROMPTS.find((x) => x.id === id);
    if (!p) return;
    setPrompt(p.prompt);
    setTask(p.task);
    setMinWords(p.wordTarget || (p.task === 'Task 1' ? 150 : 250));
    if (!title) setTitle(`Writing ${p.task}: ${p.title}`);
  };

  const buildPayload = () => {
    if (kind === 'test') return test ? { kind: test.kind, test_id: test.test_id, href: test.href, label: test.label } : null;
    if (kind === 'writing') {
      const p = WRITING_PROMPTS.find((x) => x.id === promptId);
      return prompt.trim() ? { task, prompt: prompt.trim(), min_words: Number(minWords) || 0, prompt_id: promptId || null, visual_url: p?.visualUrl || null } : null;
    }
    if (kind === 'flashcards') return cards.length ? { cards } : null;
    return { link: link.trim() || null };
  };

  const recipients = (data) => {
    if (target === 'class') return data.students.filter((s) => s.classIds.includes(classId)).map((s) => s.id);
    return [...picked];
  };

  const submit = async (e, data) => {
    e.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (!payload) { setError({ message: kind === 'test' ? 'Pick a test.' : kind === 'writing' ? 'Add a writing prompt.' : 'Add at least one card (front - back).' }); return; }
    if (target === 'class' && !classId) { setError({ message: 'Pick a class.' }); return; }
    const ids = recipients(data);
    if (target === 'students' && !ids.length) { setError({ message: 'Pick at least one student.' }); return; }
    setBusy(true);
    try {
      const a = await api.createAssignment({
        kind, title: title.trim(), instructions: instructions.trim() || null, payload,
        class_id: target === 'class' ? classId : null,
        due_at: due ? new Date(due).toISOString() : null,
      }, ids);
      go(`/teach/assignments/${a.id}`);
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <>
      <BackLink to="/teach/assignments" label="Homework" />
      <h1 className="h2" style={{ marginBottom: 'var(--space-6)' }}>New assignment</h1>
      <Loaded state={roster}>
        {(data) => data.classes.length === 0 ? (
          <EmptyPanel icon="users" title="Create a class first" lead="Homework goes to students in your classes.">
            <HubLink to="/teach/classes" className="btn btn-primary">Go to classes</HubLink>
          </EmptyPanel>
        ) : (
          <form className="hub-form" onSubmit={(e) => submit(e, data)}>
            <div className="form-field">
              <span className="form-label">Type</span>
              <div className="hub-tabs">
                {Object.entries(KINDS).map(([k, v]) => (
                  <button key={k} type="button" className={`chip${kind === k ? ' is-selected' : ''}`} onClick={() => setKind(k)}>
                    <Icon name={v.icon} size={14} /> {v.label}
                  </button>
                ))}
              </div>
            </div>

            {kind === 'test' && (
              <div className="form-field">
                <label className="form-label" htmlFor="na-test">Test</label>
                <select id="na-test" className="form-select" value={testKeyVal} onChange={(e) => pickTest(e.target.value)}>
                  <option value="">Choose a test…</option>
                  {TEST_GROUPS.filter((g) => g.tests.length).map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.tests.map((t) => <option key={testKey(t)} value={testKey(t)}>{t.label}</option>)}
                    </optgroup>
                  ))}
                </select>
                <p className="form-help">Marked done automatically when the student finishes it.</p>
              </div>
            )}

            {kind === 'writing' && (
              <>
                <div className="form-field">
                  <label className="form-label" htmlFor="na-bank">Start from a prompt (optional)</label>
                  <select id="na-bank" className="form-select" value={promptId} onChange={(e) => pickPrompt(e.target.value)}>
                    <option value="">Write my own…</option>
                    {WRITING_PROMPTS.map((p) => <option key={p.id} value={p.id}>{p.task}: {p.title}</option>)}
                  </select>
                </div>
                <div className="hub-form-row">
                  <div className="form-field">
                    <label className="form-label" htmlFor="na-task">Task</label>
                    <select id="na-task" className="form-select" value={task} onChange={(e) => { setTask(e.target.value); setMinWords(e.target.value === 'Task 1' ? 150 : 250); }}>
                      <option>Task 1</option><option>Task 2</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="na-min">Minimum words</label>
                    <input id="na-min" type="number" min="0" className="form-input" value={minWords} onChange={(e) => setMinWords(e.target.value)} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="na-prompt">Prompt</label>
                  <textarea id="na-prompt" className="form-textarea" rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                </div>
              </>
            )}

            {kind === 'custom' && (
              <div className="form-field">
                <label className="form-label" htmlFor="na-link">Link (optional)</label>
                <input id="na-link" type="url" className="form-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
                <p className="form-help">Students mark it done and can leave you a note.</p>
              </div>
            )}

            {kind === 'flashcards' && (
              <div className="form-field">
                <label className="form-label" htmlFor="na-cards">Cards — one per line: <code>front - back</code></label>
                <textarea id="na-cards" className="form-textarea" rows={8} value={cardsText} onChange={(e) => setCardsText(e.target.value)}
                  placeholder={'mitigate - to make something less severe\nubiquitous - found everywhere'} />
                <p className="form-help">{cards.length} card{cards.length === 1 ? '' : 's'} detected. Pasting two columns from a spreadsheet works too.</p>
              </div>
            )}

            <div className="form-field">
              <label className="form-label" htmlFor="na-title">Title</label>
              <input id="na-title" className="form-input" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="na-instr">Instructions (optional)</label>
              <textarea id="na-instr" className="form-textarea" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>

            <div className="form-field">
              <span className="form-label">Assign to</span>
              <div className="hub-tabs">
                <button type="button" className={`chip${target === 'class' ? ' is-selected' : ''}`} onClick={() => setTarget('class')}>A class</button>
                <button type="button" className={`chip${target === 'students' ? ' is-selected' : ''}`} onClick={() => setTarget('students')}>Specific students</button>
              </div>
              {target === 'class' ? (
                <>
                  <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class" style={{ marginTop: 'var(--space-3)' }}>
                    <option value="">Choose a class…</option>
                    {data.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <p className="form-help">Students who join the class later also get it while it's still open.</p>
                </>
              ) : (
                <div className="hub-picklist">
                  {data.students.length ? data.students.map((s) => (
                    <label key={s.id} className="hub-pick">
                      <input type="checkbox" checked={picked.has(s.id)} onChange={() => setPicked((p) => { const n = new Set(p); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })} />
                      <PersonName person={s} />
                    </label>
                  )) : <p className="body">No students in your classes yet.</p>}
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="na-due">Due</label>
              <input id="na-due" type="datetime-local" className="form-input" value={due} onChange={(e) => setDue(e.target.value)} />
              <p className="form-help">Clear it for no due date.</p>
            </div>

            {error && <ErrorNote error={error} />}
            <button className="btn btn-primary" disabled={busy || !title.trim()}>{busy ? 'Assigning…' : 'Assign homework'}</button>
          </form>
        )}
      </Loaded>
    </>
  );
}

// ── Assignment detail + review ───────────────────────────────────────────────
function ReviewPanel({ a, sub, onDone }) {
  const [band, setBand] = useState(sub.band != null ? String(sub.band) : '');
  const [feedback, setFeedback] = useState(sub.feedback || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setBusy(true); setError(null);
    try { await api.reviewSubmission(sub.id, band === '' ? null : Number(band), feedback); onDone(); }
    catch (err) { setError(err); setBusy(false); }
  };

  return (
    <div className="hub-review">
      {a.kind === 'writing' && (
        <>
          <p className="form-help">{wordCount(sub.body)} words · submitted {formatDate(sub.submitted_at, true)}</p>
          <div className="hub-pre hub-essay-view">{sub.body || '(empty)'}</div>
        </>
      )}
      {sub.note && <p className="hub-pre"><strong>Student note:</strong> {sub.note}</p>}
      <div className="hub-form-row">
        {a.kind === 'writing' && (
          <div className="form-field">
            <label className="form-label" htmlFor={`band-${sub.id}`}>Band</label>
            <select id={`band-${sub.id}`} className="form-select" value={band} onChange={(e) => setBand(e.target.value)}>
              <option value="">—</option>
              {Array.from({ length: 19 }, (_, i) => (9 - i * 0.5).toFixed(1)).map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor={`fb-${sub.id}`}>Feedback</label>
        <textarea id={`fb-${sub.id}`} className="form-textarea" rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </div>
      {error && <ErrorNote error={error} />}
      <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>{sub.reviewed_at ? 'Update review' : 'Send review'}</button>
    </div>
  );
}

export function AssignmentDetail({ id }) {
  const { go } = useHub();
  const state = useAsync(() => api.assignmentDetail(id), [id]);
  const [open, setOpen] = useState(null);

  return (
    <>
      <BackLink to="/teach/assignments" label="Homework" />
      <Loaded state={state}>
        {(a) => {
          if (!a) return <EmptyPanel icon="xCircle" title="Assignment not found" />;
          const subs = new Map(a.submissions.map((s) => [s.student_id, s]));
          const rows = a.recipients.map((r) => {
            const attempts = attemptsFor(a, a.results.map((x) => ({ ...x, kind: a.payload.kind, test_id: a.payload.test_id })).filter((x) => x.user_id === r.id));
            const sub = subs.get(r.id) || null;
            const base = statusOf(a, sub, attempts);
            return { student: r, sub, attempts, status: isOverdue(a, base) ? 'overdue' : base };
          });
          const done = rows.filter((r) => isComplete(r.status)).length;
          return (
            <>
              <div className="hub-detail-head">
                <KindTag kind={a.kind} />
                <h1 className="h2">{a.title}</h1>
                <div className="hub-detail-meta">
                  <span>{a.classes?.name || 'Individual students'}</span>
                  <span>{dueLabel(a.due_at)}</span>
                  <span>{done}/{rows.length} complete</span>
                </div>
              </div>
              {a.instructions && <div className="card hub-instructions"><p className="hub-pre">{a.instructions}</p></div>}
              {a.kind === 'writing' && a.payload?.prompt && <div className="card hub-instructions"><span className="eyebrow">{a.payload.task}</span><p className="hub-pre">{a.payload.prompt}</p></div>}
              {a.kind === 'test' && <p className="body">Test: <strong>{a.payload?.label}</strong></p>}

              <section className="hub-section">
                <h2 className="h3">Students</h2>
                {rows.length ? (
                  <div className="hub-list">
                    {rows.map(({ student, sub, attempts, status }) => {
                      const best = attempts.reduce((m, r) => Math.max(m, pct(r.correct, r.total)), 0);
                      const canReview = sub && (a.kind === 'writing' || a.kind === 'custom') && sub.status === 'submitted';
                      const isOpen = open === student.id;
                      return (
                        <div key={student.id} className="card hub-row hub-row--stack">
                          <div className="hub-row-top">
                            <HubLink to={`/teach/students/${student.id}`} className="hub-row-main hub-plain"><PersonName person={student} /></HubLink>
                            {a.kind === 'test' && attempts.length > 0 && <small>Best {best}% · {attempts.length} attempt{attempts.length > 1 ? 's' : ''}</small>}
                            {a.kind === 'flashcards' && sub?.data?.sessions > 0 && <small>{sub.data.sessions} session{sub.data.sessions > 1 ? 's' : ''}</small>}
                            {sub?.band != null && <span className="pill">Band {Number(sub.band).toFixed(1)}</span>}
                            <StatusPill status={status} />
                            {canReview && (
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(isOpen ? null : student.id)}>
                                {isOpen ? 'Close' : sub.reviewed_at ? 'View' : 'Review'}
                              </button>
                            )}
                          </div>
                          {isOpen && canReview && <ReviewPanel a={a} sub={sub} onDone={() => { setOpen(null); state.reload(); }} />}
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="body">Nobody is assigned yet. Students who join the class while it's open will get it.</p>}
              </section>

              <button type="button" className="btn btn-ghost btn-sm hub-danger" onClick={() => {
                if (window.confirm('Delete this assignment and all its submissions?')) api.deleteAssignment(a.id).then(() => go('/teach/assignments'));
              }}>Delete assignment</button>
            </>
          );
        }}
      </Loaded>
    </>
  );
}
