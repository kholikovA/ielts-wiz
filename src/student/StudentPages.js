import React, { useState, useEffect } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import {
  attemptsFor, statusOf, isComplete, isOverdue, dueLabel, formatDate, pct, summarise, wordCount, srsStats,
} from './homework';
import {
  useHub, useAsync, Loaded, EmptyPanel, HubLink, BackLink, StatusPill, KindTag, Bar, ErrorNote, PageTitle, Coin,
} from './ui';
import FlashcardStudy from './FlashcardStudy';
import SrsSession from './SrsSession';
import { endOfStudyDay } from './fsrs';

// Homework + results for the signed-in student, with a derived status per item.
function useMyHomework() {
  const { user } = useHub();
  return useAsync(async () => {
    const [items, results] = await Promise.all([api.studentHomework(user.id), api.testResults(user.id)]);
    const rows = items.map((a) => {
      const attempts = attemptsFor(a, results);
      const base = statusOf(a, a.submission, attempts);
      return { ...a, attempts, status: isOverdue(a, base) ? 'overdue' : base };
    });
    rows.sort((x, y) => (x.due_at || '9999').localeCompare(y.due_at || '9999') || y.created_at.localeCompare(x.created_at));
    return { rows, results };
  }, [user.id]);
}

function HomeworkRow({ a }) {
  return (
    <HubLink to={`/homework/${a.id}`} className="card card-interactive hub-row">
      <div className="hub-row-main">
        <KindTag kind={a.kind} />
        <strong>{a.title}</strong>
        <small>{dueLabel(a.due_at)}</small>
      </div>
      <StatusPill status={a.status} />
    </HubLink>
  );
}

// ── Join a class ─────────────────────────────────────────────────────────────
export function JoinForm({ initialCode = '', onJoined }) {
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { onJoined(await api.joinClass(code)); }
    catch (err) { setError(err); setBusy(false); }
  };
  return (
    <form className="hub-inline-form" onSubmit={submit}>
      <input className="form-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Class code" maxLength={12} aria-label="Class code" />
      <button className="btn btn-primary" disabled={busy || code.trim().length < 4}>{busy ? 'Joining…' : 'Join class'}</button>
      {error && <div className="form-error" style={{ flexBasis: '100%' }}>{error.message}</div>}
    </form>
  );
}

export function JoinPage({ code }) {
  const { go } = useHub();
  const preview = useAsync(() => api.previewClass(code), [code]);
  return (
    <>
      <PageTitle eyebrow="Join a class" title="You've been invited" />
      <Loaded state={preview}>
        {(cls) => cls ? (
          <div className="card hub-join">
            <p className="body-lg"><strong>{cls.name}</strong>{cls.teacher ? ` with ${cls.teacher}` : ''}</p>
            <p className="body">Joining lets your teacher assign homework and see your progress on IELTS Wiz.</p>
            <JoinForm initialCode={code} onJoined={() => go('/')} />
          </div>
        ) : (
          <EmptyPanel icon="xCircle" title="Code not found" lead="Check the link with your teacher, or type the code below.">
            <JoinForm onJoined={() => go('/')} />
          </EmptyPanel>
        )}
      </Loaded>
    </>
  );
}

// ── Homework list ────────────────────────────────────────────────────────────
export function HomeworkList() {
  const hw = useMyHomework();
  const [tab, setTab] = useState('open');
  return (
    <>
      <PageTitle eyebrow="Homework" title="Your assignments" lead="Tasks set by your teacher, with due dates and feedback." />
      <Loaded state={hw}>
        {({ rows }) => {
          if (!rows.length) return <EmptyPanel icon="edit" title="No homework yet" lead="When your teacher assigns work it will show up here." />;
          const open = rows.filter((a) => !isComplete(a.status));
          const done = rows.filter((a) => isComplete(a.status)).reverse();
          const shown = tab === 'open' ? open : done;
          return (
            <>
              <div className="hub-tabs" role="tablist">
                <button role="tab" aria-selected={tab === 'open'} className={`chip${tab === 'open' ? ' is-selected' : ''}`} onClick={() => setTab('open')}>To do ({open.length})</button>
                <button role="tab" aria-selected={tab === 'done'} className={`chip${tab === 'done' ? ' is-selected' : ''}`} onClick={() => setTab('done')}>Completed ({done.length})</button>
              </div>
              {shown.length
                ? <div className="hub-list">{shown.map((a) => <HomeworkRow key={a.id} a={a} />)}</div>
                : <p className="body">{tab === 'open' ? 'All caught up.' : 'Nothing completed yet.'}</p>}
            </>
          );
        }}
      </Loaded>
    </>
  );
}

// ── Homework detail ──────────────────────────────────────────────────────────
function Feedback({ submission }) {
  if (!submission?.reviewed_at) return null;
  return (
    <div className="card hub-feedback">
      <div className="hub-section-head">
        <h3 className="h3">Teacher feedback</h3>
        {submission.band != null && <span className="pill pill-success">Band {Number(submission.band).toFixed(1)}</span>}
      </div>
      {submission.feedback ? <p className="hub-pre">{submission.feedback}</p> : <p className="body">Reviewed — no written comments.</p>}
    </div>
  );
}

function TestWork({ a }) {
  const { href, label } = a.payload || {};
  const best = a.attempts.reduce((m, r) => Math.max(m, pct(r.correct, r.total)), 0);
  return (
    <div className="card">
      <p className="body-lg"><strong>{label}</strong></p>
      {a.attempts.length ? (
        <>
          <p className="body">Completed {a.attempts.length} time{a.attempts.length > 1 ? 's' : ''} · best score {best}%</p>
          <ul className="hub-attempts">
            {a.attempts.map((r) => <li key={r.completed_at}>{formatDate(r.completed_at, true)} — {r.correct}/{r.total}</li>)}
          </ul>
        </>
      ) : (
        <p className="body">Take the test and it's marked done automatically.</p>
      )}
      {href && <a className="btn btn-primary" href={href}><Icon name="play" size={16} /> {a.attempts.length ? 'Take it again' : 'Start test'}</a>}
    </div>
  );
}

function WritingWork({ a, onSaved }) {
  const { user } = useHub();
  const draftKey = `iw.v1.hub.draft.${a.id}`;
  const sub = a.submission;
  const locked = Boolean(sub?.reviewed_at);
  const [text, setText] = useState(() => {
    if (sub?.body) return sub.body;
    try { return localStorage.getItem(draftKey) || ''; } catch { return ''; }
  });
  const [editing, setEditing] = useState(!sub || sub.status !== 'submitted');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const words = wordCount(text);
  const min = a.payload?.min_words || 0;

  useEffect(() => {
    if (!editing) return;
    try { localStorage.setItem(draftKey, text); } catch { /* storage off */ }
  }, [text, editing, draftKey]);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await api.saveSubmission(a.id, user.id, { status: 'submitted', body: text, submitted_at: new Date().toISOString() });
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setEditing(false);
      onSaved();
    } catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <div className="card">
      {a.payload?.task && <span className="eyebrow">{a.payload.task}</span>}
      {a.payload?.prompt && <p className="hub-pre hub-prompt">{a.payload.prompt}</p>}
      {a.payload?.visual_url && <img className="hub-visual" src={a.payload.visual_url} alt="Task visual" />}
      <textarea className="form-textarea hub-essay" value={text} onChange={(e) => setText(e.target.value)}
        readOnly={!editing || locked} placeholder="Write your answer here…" aria-label="Your answer" />
      <div className="hub-essay-foot">
        <span className={min && words < min ? 'hub-warn' : ''}>{words} words{min ? ` · aim for ${min}+` : ''}</span>
        {editing && !locked && (
          <button type="button" className="btn btn-primary" disabled={busy || !text.trim()} onClick={submit}>
            {busy ? 'Submitting…' : sub?.status === 'submitted' ? 'Resubmit' : 'Submit'}
          </button>
        )}
        {!editing && !locked && <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>}
      </div>
      {!editing && sub?.submitted_at && !locked && <p className="form-help">Submitted {formatDate(sub.submitted_at, true)}. You can edit until your teacher reviews it.</p>}
      {error && <ErrorNote error={error} />}
    </div>
  );
}

function CustomWork({ a, onSaved }) {
  const { user } = useHub();
  const sub = a.submission;
  const done = sub?.status === 'submitted';
  const [note, setNote] = useState(sub?.note || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async (status) => {
    setBusy(true); setError(null);
    try {
      await api.saveSubmission(a.id, user.id, {
        status, note, submitted_at: status === 'submitted' ? new Date().toISOString() : null,
      });
      onSaved();
    } catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <div className="card">
      {a.payload?.link && (
        <p><a href={a.payload.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          <Icon name="arrowRight" size={14} /> Open resource
        </a></p>
      )}
      <label className="form-label" htmlFor="hw-note">Note for your teacher (optional)</label>
      <textarea id="hw-note" className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)} readOnly={Boolean(sub?.reviewed_at)} />
      {!sub?.reviewed_at && (
        <div className="hub-actions">
          {done
            ? <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => save('in_progress')}>Mark as not done</button>
            : <button type="button" className="btn btn-primary" disabled={busy} onClick={() => save('submitted')}><Icon name="check" size={16} /> Mark as done</button>}
          {done && note !== (sub?.note || '') && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => save('submitted')}>Save note</button>}
        </div>
      )}
      {error && <ErrorNote error={error} />}
    </div>
  );
}

function FlashcardWork({ a }) {
  const { user } = useHub();
  const total = (a.payload?.cards || []).length;
  const snap = useAsync(() => api.srsSnapshot(user.id), [user.id]);
  return (
    <div className="card">
      <Loaded state={snap}>
        {({ cards }) => {
          const mine = cards.filter((c) => c.assignment_id === a.id);
          const learned = mine.filter((c) => c.state !== 0).length;
          const due = mine.filter((c) => c.state !== 0 && new Date(c.due) <= endOfStudyDay()).length;
          return (
            <>
              <p className="body-lg"><strong>{learned}/{mine.length || total} words learned</strong></p>
              <p className="body">
                These words join your daily flashcard queue and keep coming back on a spaced-repetition schedule.
                {due ? ` ${due} due for review today.` : ''}
              </p>
              <HubLink to={`/flashcards/study?deck=${a.id}`} className="btn btn-primary">
                <Icon name="play" size={16} /> {learned < mine.length ? 'Learn these words' : 'Review this deck'}
              </HubLink>
            </>
          );
        }}
      </Loaded>
    </div>
  );
}

export function HomeworkDetail({ id }) {
  const { user } = useHub();
  const state = useAsync(async () => {
    const [a, results] = await Promise.all([api.assignmentForStudent(id, user.id), api.testResults(user.id)]);
    if (!a) return null;
    const attempts = attemptsFor(a, results);
    const base = statusOf(a, a.submission, attempts);
    return { ...a, attempts, status: isOverdue(a, base) ? 'overdue' : base };
  }, [id, user.id]);

  return (
    <>
      <BackLink to="/homework" label="Homework" />
      <Loaded state={state}>
        {(a) => a ? (
          <>
            <div className="hub-detail-head">
              <KindTag kind={a.kind} />
              <h1 className="h2">{a.title}</h1>
              <div className="hub-detail-meta"><StatusPill status={a.status} /><span>{dueLabel(a.due_at)}</span></div>
            </div>
            {a.instructions && <div className="card hub-instructions"><p className="hub-pre">{a.instructions}</p></div>}
            {a.kind === 'test' && <TestWork a={a} />}
            {a.kind === 'writing' && <WritingWork a={a} onSaved={state.reload} />}
            {a.kind === 'custom' && <CustomWork a={a} onSaved={state.reload} />}
            {a.kind === 'flashcards' && <FlashcardWork a={a} />}
            <Feedback submission={a.submission} />
          </>
        ) : <EmptyPanel icon="xCircle" title="Not found" lead="This assignment doesn't exist or isn't assigned to you." />}
      </Loaded>
    </>
  );
}

// ── Progress ─────────────────────────────────────────────────────────────────
export function ResultsSummary({ results }) {
  const rows = summarise(results);
  if (!rows.length) return <p className="body">No test attempts yet.</p>;
  return (
    <div className="hub-table-wrap">
      <table className="hub-table">
        <thead><tr><th>Section</th><th>Attempts</th><th>Average</th><th>Best</th><th>Last</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.kind}>
              <td>{r.label}</td>
              <td>{r.attempts}</td>
              <td><span className="hub-bar-cell"><Bar value={r.avg} /> {r.avg}%</span></td>
              <td>{r.best}%</td>
              <td>{formatDate(r.last)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RecentAttempts({ results, limit = 10 }) {
  if (!results.length) return null;
  return (
    <ul className="hub-attempts">
      {results.slice(0, limit).map((r, i) => (
        <li key={`${r.completed_at}-${i}`}>
          <span>{formatDate(r.completed_at, true)}</span>
          <span>{r.kind.replace('_', ' ')} · {r.test_id}</span>
          <strong>{r.correct}/{r.total}</strong>
        </li>
      ))}
    </ul>
  );
}

export function AttendanceHistory({ uid }) {
  const state = useAsync(() => api.studentAttendance(uid), [uid]);
  const LABEL = { present: 'Present', late: 'Late', absent: 'Absent', excused: 'Excused' };
  const CLS = { present: 'pill pill-success', late: 'pill pill-amber', absent: 'pill hub-pill-danger', excused: 'pill' };
  return (
    <Loaded state={state}>
      {(rows) => {
        const list = rows.filter((r) => r.class_sessions)
          .sort((x, y) => y.class_sessions.held_at.localeCompare(x.class_sessions.held_at)).slice(0, 12);
        if (!list.length) return <p>No class attendance recorded yet.</p>;
        return (
          <div className="hub-list">
            {list.map((r, i) => (
              <div key={i} className="card hub-row">
                <div className="hub-row-main">
                  <strong>{new Date(r.class_sessions.held_at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                  <small>{[r.class_sessions.classes?.name, r.class_sessions.topic].filter(Boolean).join(' · ')}</small>
                </div>
                <span className={CLS[r.status]}>{LABEL[r.status]}</span>
              </div>
            ))}
          </div>
        );
      }}
    </Loaded>
  );
}

export function Progress() {
  const { user } = useHub();
  const hw = useMyHomework();
  const summary = useAsync(() => api.hubSummary(), [user.id]);
  return (
    <>
      <PageTitle eyebrow="Progress" title="Track your progress" lead="Scores across every test you've taken, plus your homework record." />
      <Loaded state={hw}>
        {({ rows, results }) => {
          const done = rows.filter((a) => isComplete(a.status)).length;
          const graded = rows.filter((a) => a.submission?.band != null);
          const avgBand = graded.length ? (graded.reduce((s, a) => s + Number(a.submission.band), 0) / graded.length).toFixed(1) : null;
          return (
            <>
              <Loaded state={summary}>
                {(sm) => (
                  <div className="hub-stats" style={{ marginBottom: 12 }}>
                    <HubLink to="/coins" className="card card-interactive hub-stat"><small><Coin /> Coins</small><strong>{sm.balance}</strong><span>{sm.week.reduce((t, d) => t + d.coins, 0)} this week</span></HubLink>
                    <div className="card hub-stat"><small>Attendance streak</small><strong>{sm.attendance_streak}</strong><span>{sm.attendance?.attended || 0}/{sm.attendance?.sessions || 0} classes</span></div>
                    <div className="card hub-stat"><small>Homework streak</small><strong>{sm.homework_streak}</strong><span>on time in a row</span></div>
                  </div>
                )}
              </Loaded>
              <div className="hub-stats">
                <div className="card hub-stat"><small>Homework done</small><strong>{done}/{rows.length}</strong></div>
                <div className="card hub-stat"><small>Tests taken</small><strong>{results.length}</strong></div>
                <div className="card hub-stat"><small>Avg. writing band</small><strong>{avgBand || '—'}</strong></div>
              </div>
              <section className="hub-section"><h2 className="h3">Class attendance</h2><AttendanceHistory uid={user.id} /></section>
              <section className="hub-section"><h2 className="h3">Flashcards</h2><SrsStatsBlock uid={user.id} /></section>
              <section className="hub-section"><h2 className="h3">By section</h2><ResultsSummary results={results} /></section>
              <section className="hub-section"><h2 className="h3">Recent attempts</h2><RecentAttempts results={results} /></section>
            </>
          );
        }}
      </Loaded>
    </>
  );
}

// ── Flashcards ───────────────────────────────────────────────────────────────
export function SrsStatsBlock({ uid }) {
  const snap = useAsync(() => api.srsSnapshot(uid), [uid]);
  return (
    <Loaded state={snap}>
      {(data) => {
        if (!data.cards.length) return <p className="body">No flashcards yet.</p>;
        const s = srsStats(data, new Date(), endOfStudyDay());
        return (
          <div className="hub-stats">
            <div className="card hub-stat"><small>Due today</small><strong>{s.due + s.fresh}</strong></div>
            <div className="card hub-stat"><small>Words learned</small><strong>{s.learned}/{s.total}</strong></div>
            <div className="card hub-stat"><small>Mature (21d+)</small><strong>{s.mature}</strong></div>
            <div className="card hub-stat"><small>Retention, 30d</small><strong>{s.retention == null ? '—' : `${s.retention}%`}</strong></div>
            <div className="card hub-stat"><small>Streak</small><strong>{s.streak} day{s.streak === 1 ? '' : 's'}</strong></div>
            <div className="card hub-stat"><small>Reviewed today</small><strong>{s.today}</strong></div>
          </div>
        );
      }}
    </Loaded>
  );
}

function SavedWordsStudy() {
  const { user, go } = useHub();
  const words = useAsync(() => api.savedWords(user.id), [user.id]);
  return (
    <>
      <BackLink to="/flashcards" label="Flashcards" />
      <h1 className="h2" style={{ marginBottom: 'var(--space-6)' }}>My saved words</h1>
      <Loaded state={words}>
        {(list) => <FlashcardStudy cards={list.map((w) => ({ f: w.word, b: [w.definition, w.example && `“${w.example}”`].filter(Boolean).join('\n\n') }))} onExit={() => go('/flashcards')} />}
      </Loaded>
    </>
  );
}

export function Flashcards({ deckId }) {
  const { user, go } = useHub();
  const snap = useAsync(() => api.srsSnapshot(user.id), [user.id]);
  const hw = useMyHomework();
  const words = useAsync(() => api.savedWords(user.id), [user.id]);

  if (deckId === 'saved') return <SavedWordsStudy />;
  if (deckId === 'study') {
    const deck = new URLSearchParams(window.location.search).get('deck');
    return (
      <>
        <BackLink to="/flashcards" label="Flashcards" />
        <SrsSession deck={deck} onExit={() => go('/flashcards')} />
      </>
    );
  }

  return (
    <>
      <PageTitle eyebrow="Flashcards" title="Daily review"
        lead="New words from your teacher come first, then everything due for review. The schedule adapts to how well you remember each word." />
      <Loaded state={snap}>
        {(data) => {
          const s = srsStats(data, new Date(), endOfStudyDay());
          return (
            <div className="card fc-today">
              <div className="fc-today-counts">
                <span><strong className="fc-count fc-count--new">{s.fresh}</strong> new</span>
                <span><strong className="fc-count fc-count--review">{s.due}</strong> to review</span>
              </div>
              {s.fresh + s.due > 0
                ? <HubLink to="/flashcards/study" className="btn btn-primary"><Icon name="play" size={16} /> Study now</HubLink>
                : <span className="body">{s.total ? 'All done for today.' : 'No words assigned yet.'}</span>}
            </div>
          );
        }}
      </Loaded>

      <section className="hub-section">
        <h2 className="h3">Your stats</h2>
        <SrsStatsBlock uid={user.id} />
      </section>

      <section className="hub-section">
        <h2 className="h3">Decks</h2>
        <div className="hub-grid">
          <Loaded state={hw}>
            {({ rows }) => {
              const cards = snap.data?.cards || [];
              return rows.filter((a) => a.kind === 'flashcards').map((a) => {
                const mine = cards.filter((c) => c.assignment_id === a.id);
                const learned = mine.filter((c) => c.state !== 0).length;
                return (
                  <HubLink key={a.id} to={`/flashcards/study?deck=${a.id}`} className="card card-interactive hub-deck">
                    <Icon name="layers" size={22} />
                    <strong>{a.title}</strong>
                    <small>{learned}/{mine.length || (a.payload?.cards || []).length} learned · assigned {formatDate(a.assigned_at || a.created_at)}</small>
                  </HubLink>
                );
              });
            }}
          </Loaded>
          <Loaded state={words} fallback={null}>
            {(list) => (
              <HubLink to="/flashcards/saved" className="card card-interactive hub-deck">
                <Icon name="bookOpen" size={22} />
                <strong>My saved words</strong>
                <small>{list.length} word{list.length === 1 ? '' : 's'} from Articles · free practice</small>
              </HubLink>
            )}
          </Loaded>
        </div>
      </section>
    </>
  );
}
