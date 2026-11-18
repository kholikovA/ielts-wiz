import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import {
  KINDS, attemptsFor, statusOf, isComplete, isOverdue, dueLabel, formatDate, pct, parseCards, wordCount,
 assignmentCounts, DEFAULT_PASS, passPercent, isScored,
} from './homework';
import { CoinFields, coinsValue, useHomeworkRule } from './AssignmentCoins';
import { TEST_GROUPS, ALL_TESTS, testKey, WRITING_PROMPTS } from './catalog';
import { bankCatalogEntry } from './ielts/ielts';
import {
  useHub, useAsync, Loaded, EmptyPanel, HubLink, BackLink, StatusPill, KindTag, PersonName, CopyButton, ErrorNote,
  PageTitle, Seg, Coin, toLocalInput, Spinner, ClassPicklist,
} from './ui';
import { ResultsSummary, RecentAttempts, SrsStatsBlock, AttendanceHistory } from './StudentPages';
import { GiveCoins } from './CoinAdmin';
import { confirmDialog, promptDialog, alertDialog, chooseDialog } from './dialog';
import { messageUser } from './chat/store';
import { ProofFiles } from './TaskProof';
import CardEnricher, { withExtras, extraKey } from './vocab/CardEnricher';
import { SentenceResults, usedCount } from './vocab/SentenceWork';
import { splitTest, joinTest, newId } from './quiz/quiz';
import { emptyTest, testProblems } from './quiz/QuizBuilder';
import { DictationResult } from './dictation/Dictation';
import { checkDictation } from './dictation/diff';
import { IntegrityNote } from './guard';
import { EduschoolClassPanel } from './Eduschool';
import ClassAvatar from './ClassAvatar';
import './teach.css';

const DictationSetup = React.lazy(() => import('./dictation/DictationSetup'));
const WritingReview = React.lazy(() => import('./writing/WritingReview'));
const QuizBuilder = React.lazy(() => import('./quiz/QuizBuilder'));
const QuizReview = React.lazy(() => import('./quiz/QuizWork').then((m) => ({ default: m.QuizReview })));
const QuizAnalysis = React.lazy(() => import('./quiz/QuizAnalysis'));
const AssignmentPreview = React.lazy(() => import('./StudentPages').then((m) => ({ default: m.AssignmentPreview })));
const dictationAccuracy = (sub, key) => sub.data?.score?.accuracy ?? checkDictation(sub.body || '', key.transcript).score.accuracy;

const joinUrl = (code) => `${window.location.origin}/join/${code}`;

// ── Classes ──────────────────────────────────────────────────────────────────
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function NewClassForm({ onCancel }) {
  const { go } = useHub();
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
    <form className="card tp-newclass" onSubmit={create}>
      <label className="form-label" htmlFor="new-class">Class name</label>
      <div className="hub-inline-form">
        <input id="new-class" className="form-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Evening B2" maxLength={80} />
        <button className="btn btn-primary" disabled={busy || !name.trim()}>{busy ? 'Creating…' : 'Create class'}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
      <p className="form-help">You get a join link to share. Students who join see the class's homework.</p>
      {error && <ErrorNote error={error} />}
    </form>
  );
}

// Join-code cell on a class card: click copies the invite link.
function CopyCode({ code, link }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <button type="button" className="tp-copycode" onClick={copy} title="Copy the invite link">
      <span>{done ? 'Link copied' : 'Join code'}</span>
      <strong><code>{code}</code><Icon name={done ? 'check' : 'copy'} size={13} /></strong>
    </button>
  );
}

export function Classes() {
  const { user } = useHub();
  const state = useAsync(async () => {
    const [classes, assignments] = await Promise.all([
      api.teacherClasses(user.id), api.teacherAssignments(user.id).catch(() => []),
    ]);
    return { classes, assignments };
  }, [user.id]);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Classes" lead="Share a class's join link to add students. Open a class to manage its roster.">
        {!creating && <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Icon name="plus" size={14} /> New class</button>}
      </PageTitle>
      <Loaded state={state}>
        {({ classes, assignments }) => {
          const now = new Date();
          const work = new Map(classes.map((c) => [c.id, { open: 0, toReview: 0 }]));
          assignments.forEach((a) => {
            const w = work.get(a.class_id);
            if (!w) return;
            const n = assignmentCounts(a, now);
            if (!n.scheduled && !n.pastDue) w.open += 1;
            w.toReview += n.toReview;
          });
          return (
            <>
              {(creating || !classes.length) && <NewClassForm onCancel={classes.length ? () => setCreating(false) : null} />}
              {classes.length ? (
                <div className="tp-classes">
                  {classes.map((c) => {
                    const count = c.class_members?.[0]?.count ?? 0;
                    const w = work.get(c.id);
                    return (
                      <article key={c.id} className="card tp-class">
                        <HubLink to={`/teach/classes/${c.id}`} className="tp-class-head hub-plain">
                          <ClassAvatar name={c.name} size={42} className="tp-class-mark" />
                          <span className="tp-class-name">
                            <strong>{c.name}</strong>
                            <small>{plural(count, 'student')}</small>
                          </span>
                          <Icon name="chevronRight" size={16} />
                        </HubLink>
                        <div className="tp-class-facts">
                          <HubLink to="/teach/assignments" className="hub-plain" title="Open homework">
                            <span>Homework</span><strong className="hub-num">{w.open}</strong>
                          </HubLink>
                          <HubLink to="/teach/assignments" className={`hub-plain${w.toReview ? ' is-warn' : ''}`}>
                            <span>To review</span><strong className="hub-num">{w.toReview}</strong>
                          </HubLink>
                          <CopyCode code={c.join_code} link={joinUrl(c.join_code)} />
                        </div>
                        <div className="tp-class-actions">
                          <HubLink to={`/teach/assignments/new?class=${c.id}`} className="btn btn-sm"><Icon name="plus" size={14} /> Homework</HubLink>
                          <HubLink to={`/teach/attendance?class=${c.id}`} className="btn btn-sm"><Icon name="clipboard" size={14} /> Register</HubLink>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </>
          );
        }}
      </Loaded>
    </>
  );
}

export function ClassDetail({ id }) {
  const { go, user } = useHub();
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
                <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
                  const n = await promptDialog({ title: 'Rename class', label: 'Class name', value: c.name, maxLength: 80 });
                  if (n && n !== c.name) act(() => api.renameClass(c.id, n));
                }}><Icon name="edit" size={14} /> Rename</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
                  if (await confirmDialog({
                    title: `Archive "${c.name}"?`,
                    body: 'Students stay linked to existing homework, but the join code stops working.',
                    confirmLabel: 'Archive', danger: true,
                  })) {
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
                <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
                  if (await confirmDialog({ title: 'Make a new join code?', body: 'The old code and link will stop working.', confirmLabel: 'New code' })) act(() => api.newJoinCode(c.id));
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
                      <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
                        let others;
                        try { others = (await api.teacherClasses(user.id)).filter((o) => o.id !== c.id); } catch (err) { setError(err); return; }
                        if (!others.length) { await alertDialog({ title: 'No other class', body: 'Create another class first, then move students into it.' }); return; }
                        const to = await chooseDialog({
                          title: `Move ${m.name || m.email}`,
                          body: `They'll leave ${c.name} and join the class you pick. Homework already assigned to them stays; the new class's open homework is added.`,
                          label: 'New class',
                          options: others.map((o) => ({ value: o.id, label: o.name })),
                          confirmLabel: 'Move',
                        });
                        if (to) act(() => api.moveMember(c.id, to, m.id));
                      }}>Move</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
                        if (await confirmDialog({ title: `Remove ${m.name || m.email}?`, body: `They'll leave ${c.name}. Their past homework stays.`, confirmLabel: 'Remove', danger: true })) {
                          act(() => api.removeMember(c.id, m.id));
                        }
                      }}>Remove</button>
                    </div>
                  ))}
                </div>
              ) : <p className="body">No students yet. Share the join link above.</p>}
            </section>

            <ViewersPanel classId={c.id} className={c.name} />
            <EduschoolClassPanel classId={c.id} />
          </>
        ) : <EmptyPanel icon="xCircle" title="Class not found" />}
      </Loaded>
    </>
  );
}

// Viewers: read-only accounts (e.g. a Head Teacher) who see this group's homework,
// scores, attendance and coins on their own Overview page. They can't change anything.
function ViewersPanel({ classId, className }) {
  const state = useAsync(() => api.classViewers(classId), [classId]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const add = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setError(null);
    try { await api.addClassViewer(classId, email.trim()); setEmail(''); state.reload(); } catch (err) { setError(err); }
    setBusy(false);
  };
  const remove = async (v) => {
    if (!(await confirmDialog({ title: `Remove ${v.name || v.email}?`, body: `They'll stop seeing ${className}.`, confirmLabel: 'Remove', danger: true }))) return;
    setError(null);
    try { await api.removeClassViewer(classId, v.viewer_id); state.reload(); } catch (err) { setError(err); }
  };

  return (
    <section className="hub-section">
      <div className="hub-section-head"><h2 className="h3">Viewers</h2></div>
      <p className="form-help">
        Viewers see this group's homework completion, scores, attendance and coins. They can't change anything,
        and they don't see essays, feedback or messages. They sign up on the Student Hub first, then you add their email here.
      </p>
      <form className="hub-viewer-add" onSubmit={add}>
        <input className="form-input" type="email" placeholder="Their account email" value={email}
          onChange={(e) => setEmail(e.target.value)} aria-label="Viewer email" />
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !email.trim()}>
          <Icon name="eye" size={14} /> Add viewer
        </button>
      </form>
      {error && <ErrorNote error={error} />}
      <Loaded state={state}>
        {(rows) => rows.length ? (
          <div className="hub-list">
            {rows.map((v) => (
              <div key={v.viewer_id} className="card hub-row">
                <span className="hub-row-main"><PersonName person={{ name: v.name, email: v.email }} /></span>
                <small>Added {formatDate(v.granted_at)}</small>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(v)}>Remove</button>
              </div>
            ))}
          </div>
        ) : null}
      </Loaded>
    </section>
  );
}

// ── Students ─────────────────────────────────────────────────────────────────
export function Students() {
  const { user } = useHub();
  const state = useAsync(async () => {
    const [roster, sums] = await Promise.all([api.teacherStudents(user.id), api.teacherSummaries().catch(() => new Map())]);
    return { ...roster, sums };
  }, [user.id]);
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 1 });
  const sortBy = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'name' ? 1 : -1 }));
  const Head = ({ k, children, title }) => (
    <button type="button" className={`tp-th${sort.key === k ? ' is-sorted' : ''}`} onClick={() => sortBy(k)} title={title}>
      {children}{sort.key === k && <Icon name="chevronDown" size={12} className={sort.dir > 0 ? 'tp-up' : ''} />}
    </button>
  );
  return (
    <>
      <PageTitle eyebrow="Teaching" title="Students" lead="Everyone in your classes. Click a column to sort; open a student for their scores and homework." />
      <Loaded state={state}>
        {({ students, classes, sums }) => {
          if (!students.length) return <EmptyPanel icon="users" title="No students yet" lead="Create a class and share its join link." />;
          const needle = q.trim().toLowerCase();
          const val = (s) => {
            const m = sums.get(s.id) || {};
            if (sort.key === 'name') return (s.name || s.email || '').toLowerCase();
            return Number(m[sort.key] ?? -Infinity);
          };
          const shown = students
            .filter((s) => (!cls || s.classIds.includes(cls)) && (!needle || `${s.name} ${s.email}`.toLowerCase().includes(needle)))
            .sort((a, b) => {
              const x = val(a); const y = val(b);
              return (x < y ? -1 : x > y ? 1 : 0) * sort.dir || (a.name || '').localeCompare(b.name || '');
            });
          return (
            <>
              <div className="tp-toolbar">
                <div className="tp-search">
                  <Icon name="search" size={15} />
                  <input className="form-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" aria-label="Search students" />
                </div>
                <select className="form-select tp-select" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class">
                  <option value="">All classes</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className="hub-muted tp-count">{shown.length === students.length ? plural(students.length, 'student') : `${shown.length} of ${students.length}`}</span>
              </div>
              <div className="hub-list tp-table tp-students" role="table" aria-label="Students">
                <div className="tp-tr tp-thead" role="row">
                  <Head k="name">Student</Head>
                  <span className="tp-th tp-col-classes">Classes</span>
                  <Head k="balance" title="Coin balance">Coins</Head>
                  <Head k="week" title="Coins earned in the last 7 days">This week</Head>
                  <Head k="attendance_streak" title="Classes attended in a row">Attendance</Head>
                  <Head k="homework_streak" title="Homework done on time in a row">Homework</Head>
                  <span />
                </div>
                {shown.map((s) => {
                  const m = sums.get(s.id);
                  return (
                    <HubLink key={s.id} to={`/teach/students/${s.id}`} className="card card-interactive tp-tr" role="row">
                      <span className="tp-td-main"><PersonName person={s} /></span>
                      <span className="tp-col-classes tp-chips">{s.classNames.map((n) => <span key={n} className="tp-chip">{n}</span>)}</span>
                      <span className="hub-num tp-td"><Coin size={12} /> {m ? m.balance : '–'}</span>
                      <span className={`hub-num tp-td${m && m.week < 0 ? ' is-neg' : m && m.week > 0 ? ' is-pos' : ''}`}>{m ? `${m.week > 0 ? '+' : ''}${m.week}` : '–'}</span>
                      <span className="hub-num tp-td"><Streak n={m?.attendance_streak} /></span>
                      <span className="hub-num tp-td"><Streak n={m?.homework_streak} /></span>
                      <Icon name="chevronRight" size={16} className="tp-chev" />
                    </HubLink>
                  );
                })}
                {!shown.length && <p className="tp-none">No students match.</p>}
              </div>
            </>
          );
        }}
      </Loaded>
    </>
  );
}

const Streak = ({ n }) => (n == null ? '–' : (
  <span className={`tp-streak${n >= 3 ? ' is-hot' : n === 0 ? ' is-zero' : ''}`}>{n >= 3 && <Icon name="flame" size={12} />}{n}</span>
));

export function StudentDetail({ id }) {
  const { user, viewAsStudent, go } = useHub();
  const message = () => messageUser(id, go).catch((e) => alertDialog({ title: 'Could not open the chat', body: e.message }));
  const state = useAsync(async () => {
    const [profile, results, homework, summary] = await Promise.all([
      api.studentProfile(id), api.testResults(id), api.homeworkForStudent(user.id, id), api.hubSummary(id).catch(() => null),
    ]);
    if (!profile) return null;
    const rows = homework.map((a) => {
      const attempts = attemptsFor(a, results);
      const base = statusOf(a, a.submission, attempts);
      return { ...a, attempts, status: isOverdue(a, base) ? 'overdue' : base };
    }).sort((x, y) => y.created_at.localeCompare(x.created_at));
    return { profile, results, rows, summary };
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={message}>
                  <Icon name="message" size={14} /> Message
                </button>
                {viewAsStudent && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => viewAsStudent(d.profile)}>
                    <Icon name="eye" size={14} /> View as student
                  </button>
                )}
              </div>
            </div>
            {d.summary && (
              <div className="hub-stats" style={{ marginBottom: 12 }}>
                <div className="card hub-stat"><small><Coin /> Coins</small><strong>{d.summary.balance}</strong><span>{d.summary.week.reduce((t, x) => t + x.coins, 0)} this week</span></div>
                <div className="card hub-stat"><small>Attendance streak</small><strong>{d.summary.attendance_streak}</strong><span>{d.summary.attendance?.attended || 0}/{d.summary.attendance?.sessions || 0} classes</span></div>
                <div className="card hub-stat"><small>Homework streak</small><strong>{d.summary.homework_streak}</strong><span>on time in a row</span></div>
              </div>
            )}
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
            <section className="hub-section">
              <h2 className="h3">Give or take coins</h2>
              <GiveCoins students={[d.profile]} fixed={[d.profile]} onDone={state.reload} />
            </section>
            <section className="hub-section"><h2 className="h3">Attendance</h2><AttendanceHistory uid={id} /></section>
            <section className="hub-section"><h2 className="h3">Flashcards</h2><SrsStatsBlock uid={id} /></section>
            <section className="hub-section"><h2 className="h3">Scores by section</h2><ResultsSummary results={d.results} /></section>
            <section className="hub-section"><h2 className="h3">Recent attempts</h2><RecentAttempts results={d.results} limit={15} /></section>
          </>
        ) : <EmptyPanel icon="xCircle" title="Student not found" lead="They may have left your classes." />}
      </Loaded>
    </>
  );
}

// ── Assignments ──────────────────────────────────────────────────────────────
const whenShort = (iso) => new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function AssignmentRow({ a, now }) {
  const { total, submitted, toReview, scheduled } = assignmentCounts(a, now);
  return (
    <HubLink to={`/teach/assignments/${a.id}`} className="card card-interactive hub-row">
      <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={16} /></span>
      <div className="hub-row-main">
        <strong>{a.title}</strong>
        <small>{a.classes?.name ? `${a.classes.name} · ` : ''}{scheduled ? `Publishes ${whenShort(a.publish_at)}` : dueLabel(a.due_at)}</small>
      </div>
      {scheduled
        ? <span className="pill pill-accent"><Icon name="calendar" size={12} /> Scheduled</span>
        : <small className="hub-num">{a.kind === 'test' ? `${total} student${total === 1 ? '' : 's'}` : `${submitted}/${total} submitted`}</small>}
      {toReview > 0 && <span className="pill pill-amber">{toReview} to review</span>}
      <Icon name="chevronRight" size={16} />
    </HubLink>
  );
}

// Board columns: every assignment sits in exactly one.
const BOARD = [
  { key: 'scheduled', label: 'Scheduled', icon: 'calendar' },
  { key: 'open', label: 'Open', icon: 'edit' },
  { key: 'review', label: 'To review', icon: 'eye' },
  { key: 'done', label: 'Done', icon: 'checkCircle' },
];
const DONE_SHOWN = 12;

function boardColumn(a, now) {
  const c = assignmentCounts(a, now);
  if (c.scheduled) return 'scheduled';
  if (c.toReview > 0) return 'review';
  if (c.pastDue || (c.total > 0 && c.submitted === c.total)) return 'done';
  return 'open';
}

function BoardCard({ a, now }) {
  const { total, submitted, toReview, scheduled } = assignmentCounts(a, now);
  const share = total ? submitted / total : 0;
  return (
    <HubLink to={`/teach/assignments/${a.id}`} className="card card-interactive kb-card">
      <div className="kb-card-top">
        <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={14} /></span>
        <strong>{a.title}</strong>
      </div>
      <small>{a.classes?.name || 'Individual students'}</small>
      <small>{scheduled ? `Publishes ${whenShort(a.publish_at)}` : dueLabel(a.due_at)}</small>
      {!scheduled && a.kind !== 'test' && (
        <div className="kb-card-bar">
          <span className="hub-bar hub-bar--wide"><span style={{ width: `${share * 100}%` }} /></span>
          <small className="hub-num">{submitted}/{total}</small>
        </div>
      )}
      {toReview > 0 && <span className="pill pill-amber">{toReview} to review</span>}
    </HubLink>
  );
}

function AssignmentBoard({ list, now }) {
  const cols = Object.fromEntries(BOARD.map((c) => [c.key, []]));
  list.forEach((a) => cols[boardColumn(a, now)].push(a));
  cols.scheduled.sort((x, y) => x.publish_at.localeCompare(y.publish_at));
  cols.open.sort((x, y) => (x.due_at || '9999').localeCompare(y.due_at || '9999'));
  cols.review.sort((x, y) => (x.due_at || '').localeCompare(y.due_at || ''));
  cols.done.sort((x, y) => (y.due_at || y.created_at).localeCompare(x.due_at || x.created_at));
  return (
    <div className="kb">
      {BOARD.map((c) => {
        const items = c.key === 'done' ? cols.done.slice(0, DONE_SHOWN) : cols[c.key];
        return (
          <section key={c.key} className={`kb-col kb-col--${c.key}`} aria-label={c.label}>
            <header className="kb-col-head"><Icon name={c.icon} size={14} /> {c.label}<span className="hub-num">{cols[c.key].length}</span></header>
            <div className="kb-col-body">
              {items.map((a) => <BoardCard key={a.id} a={a} now={now} />)}
              {!items.length && <p className="kb-empty">Nothing here</p>}
              {c.key === 'done' && cols.done.length > DONE_SHOWN && <p className="kb-empty">+{cols.done.length - DONE_SHOWN} older in List view</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AssignmentGroups({ list, now }) {
  const groups = new Map();
  list.forEach((a) => {
    const name = a.classes?.name || 'Individual students';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(a);
  });
  const names = [...groups.keys()].sort((x, y) => (x === 'Individual students') - (y === 'Individual students') || x.localeCompare(y));
  return (
    <div className="hub-stack">
      {names.map((name) => {
        const items = groups.get(name);
        const toReview = items.reduce((n, a) => n + assignmentCounts(a, now).toReview, 0);
        return (
          <section key={name} className="as-group">
            <header className="as-group-head">
              <h2 className="h3">{name}</h2>
              <span className="hub-muted">{items.length} assignment{items.length === 1 ? '' : 's'}</span>
              {toReview > 0 && <span className="pill pill-amber">{toReview} to review</span>}
            </header>
            <div className="hub-list">{items.map((a) => <AssignmentRow key={a.id} a={a} now={now} />)}</div>
          </section>
        );
      })}
    </div>
  );
}

const VIEW_KEY = 'iw.v1.hub.assignmentsView';

export function Assignments() {
  const { user } = useHub();
  const state = useAsync(() => api.teacherAssignments(user.id), [user.id]);
  const [tab, setTab] = useState('active');
  const [view, setViewState] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) || 'list'; } catch { return 'list'; }
  });
  const setView = (v) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage off */ } };
  return (
    <>
      <PageTitle eyebrow="Teaching" title="Assignments" lead="Schedule homework ahead, track completion, review submissions.">
        <HubLink to="/teach/assignments/new" className="btn btn-primary btn-sm"><Icon name="plus" size={14} /> New</HubLink>
      </PageTitle>
      <Loaded state={state}>
        {(list) => {
          const now = new Date();
          const groups = {
            scheduled: list.filter((a) => new Date(a.publish_at) > now).sort((x, y) => x.publish_at.localeCompare(y.publish_at)),
            active: list.filter((a) => new Date(a.publish_at) <= now && !(a.due_at && new Date(a.due_at) < now)),
            past: list.filter((a) => new Date(a.publish_at) <= now && a.due_at && new Date(a.due_at) < now),
          };
          const shown = groups[tab];
          return (
            <>
              <div className="as-bar">
                {view !== 'board' && (
                  <Seg label="Filter assignments" value={tab} onChange={setTab} options={[
                    { value: 'active', label: `Active (${groups.active.length})` },
                    { value: 'scheduled', label: `Scheduled (${groups.scheduled.length})` },
                    { value: 'past', label: `Past (${groups.past.length})` },
                  ]} />
                )}
                <div className="as-bar-spacer" />
                <Seg label="View" value={view} onChange={setView} options={[
                  { value: 'list', label: 'List' },
                  { value: 'board', label: 'Board' },
                  { value: 'groups', label: 'By class' },
                ]} />
              </div>
              {!list.length ? <EmptyPanel icon="edit" title="No assignments yet" lead="Create an assignment and pick when it goes out." />
                : view === 'board' ? <AssignmentBoard list={list} now={now} />
                  : shown.length ? (view === 'groups'
                    ? <AssignmentGroups list={shown} now={now} />
                    : <div className="hub-list">{shown.map((a) => <AssignmentRow key={a.id} a={a} now={now} />)}</div>)
                    : <EmptyPanel icon="edit" title={tab === 'scheduled' ? 'Nothing scheduled' : 'Nothing here'} lead="Create an assignment and pick when it goes out." />}
            </>
          );
        }}
      </Loaded>
    </>
  );
}

export function NewAssignment({ editId = null }) {
  const { user, go } = useHub();
  const presetClass = new URLSearchParams(window.location.search).get('class') || '';
  const roster = useAsync(() => api.teacherStudents(user.id), [user.id]);

  const presetTest = new URLSearchParams(window.location.search).get('test') || '';
  const [kind, setKind] = useState('test');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [testKeyVal, setTestKeyVal] = useState(presetTest);
  const [promptId, setPromptId] = useState('');
  const [task, setTask] = useState('Task 2');
  const [prompt, setPrompt] = useState('');
  const [minWords, setMinWords] = useState(250);
  const [link, setLink] = useState('');
  const [uploads, setUploads] = useState(false);
  const [cardsText, setCardsText] = useState('');
  const [extras, setExtras] = useState({}); // AI study material per card front
  const [wordsText, setWordsText] = useState('');
  const [level, setLevel] = useState('junior');
  const [quiz, setQuiz] = useState(emptyTest);
  const [dict, setDict] = useState(null); // { payload, key } from DictationSetup
  const [dictInitial, setDictInitial] = useState(null);
  const [target, setTarget] = useState('class');
  const [classIds, setClassIds] = useState(presetClass ? [presetClass] : []);
  const classId = classIds[0] || '';
  const setClassId = (id) => setClassIds(id ? [id] : []);
  const [picked, setPicked] = useState(new Set());
  const [due, setDue] = useState(() => {
    const d = new Date(); d.setHours(23, 59, 0, 0); return toLocalInput(d);
  });
  const [publishMode, setPublishMode] = useState('now');
  const [publishAt, setPublishAt] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return toLocalInput(d);
  });
  const [coins, setCoins] = useState('');
  const [pass, setPass] = useState(DEFAULT_PASS);

  // ?from=<id> duplicates an assignment, shifted one day later.
  // /teach/assignments/<id>/edit edits it in place.
  const fromId = new URLSearchParams(window.location.search).get('from');
  const srcId = editId || fromId;
  const editing = Boolean(editId);
  const source = useAsync(() => (srcId ? api.assignmentDetail(srcId) : Promise.resolve(null)), [srcId]);
  const published = editing && source.data && new Date(source.data.publish_at) <= new Date();
  useEffect(() => {
    const a = source.data;
    if (!a) return;
    const shift = (iso) => { const d = new Date(iso); if (!editing) d.setDate(d.getDate() + 1); return d; };
    setKind(a.kind);
    setTitle(a.title);
    setInstructions(a.instructions || '');
    if (a.coins != null) setCoins(String(a.coins));
    setPass(isScored(a.kind) ? passPercent(a) : DEFAULT_PASS);
    const pl = a.payload || {};
    if (a.kind === 'test') setTestKeyVal(`${pl.kind}:${pl.test_id}`);
    if (a.kind === 'writing') { setPrompt(pl.prompt || ''); setTask(pl.task || 'Task 2'); setMinWords(pl.min_words || 250); setPromptId(pl.prompt_id || ''); }
    if (a.kind === 'custom') { setLink(pl.link || ''); setUploads(Boolean(pl.uploads)); }
    if (a.kind === 'flashcards') {
      setCardsText((pl.cards || []).map((c) => `${c.f} - ${c.b}`).join('\n'));
      setExtras(Object.fromEntries((pl.cards || []).filter((c) => c.ex || c.gap).map((c) => [extraKey(c.f), c])));
    }
    if (a.kind === 'quiz') {
      api.quizKey(a.id).then((k) => {
        const t = joinTest(pl, k?.key || {});
        // Editing keeps the ids so students' answers still line up; a copy gets fresh
        // ids so its key can't collide with the original's.
        setQuiz(editing ? { sections: t.sections }
          : { sections: t.sections.map((s) => ({ ...s, id: newId(), questions: s.questions.map((q) => ({ ...q, id: newId() })) })) });
      }).catch(() => {});
    }
    if (a.kind === 'flashcards' && editing) setExtras(Object.fromEntries((pl.cards || []).filter((c) => c.ex || c.gap || c.forms || c.coll).map((c) => [extraKey(c.f), c])));
    if (a.kind === 'sentences') {
      setWordsText((pl.words || []).map((w) => (w.m ? `${w.w} - ${w.m}` : w.w)).join('\n'));
      setLevel(pl.level === 'senior' ? 'senior' : 'junior');
    }
    if (a.kind === 'dictation') api.dictationKey(a.id).then((key) => key && setDictInitial({ payload: pl, key })).catch(() => {});
    if (a.class_id) { setTarget('class'); setClassId(a.class_id); }
    else { setTarget('students'); setPicked(new Set(a.recipients.map((r) => r.id))); }
    const pub = shift(a.publish_at);
    if (pub > new Date()) { setPublishMode('later'); setPublishAt(toLocalInput(pub)); }
    if (a.due_at) setDue(toLocalInput(shift(a.due_at)));
    else if (editing) setDue('');
  }, [source.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const cards = useMemo(() => parseCards(cardsText), [cardsText]);
  // "word" or "word - meaning", one per line (max 20).
  const words = useMemo(() => wordsText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 20).map((l) => {
    const [p] = parseCards(l);
    return p ? { w: p.f, m: p.b } : { w: l };
  }), [wordsText]);
  const deckOptions = useAsync(
    () => (kind === 'sentences' ? api.teacherAssignments(user.id).then((l) => l.filter((x) => x.kind === 'flashcards')) : Promise.resolve([])),
    [kind, user.id],
  );
  // Built-in tests plus the IELTS question bank.
  const bank = useAsync(() => api.ieltsTests().catch(() => []), []);
  const { testGroups, allTests } = useMemo(() => {
    const rows = bank.data || [];
    const bankGroups = [
      { label: 'IELTS bank · Reading', tests: rows.filter((r) => r.skill === 'reading').map(bankCatalogEntry) },
      { label: 'IELTS bank · Listening', tests: rows.filter((r) => r.skill === 'listening').map(bankCatalogEntry) },
    ].filter((g) => g.tests.length);
    const groups = [...bankGroups, ...TEST_GROUPS];
    return { testGroups: groups, allTests: [...bankGroups.flatMap((g) => g.tests), ...ALL_TESTS] };
  }, [bank.data]);
  const test = allTests.find((t) => testKey(t) === testKeyVal);

  const pickTest = (key) => {
    setTestKeyVal(key);
    const t = allTests.find((x) => testKey(x) === key);
    if (t && (!title || allTests.some((x) => x.label === title))) setTitle(t.label);
  };
  // Arriving from the bank's "Assign" button: fill in the title once the bank has loaded.
  useEffect(() => {
    if (!presetTest || title) return;
    const t = allTests.find((x) => testKey(x) === presetTest);
    if (t) setTitle(t.label);
  }, [allTests]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const built = buildOwnPayload();
    const orig = source.data?.kind === kind ? source.data.payload : null;
    return built && orig && (kind === 'quiz' || kind === 'test') ? { ...orig, ...built } : built;
  };
  const buildOwnPayload = () => {
    if (kind === 'test') return test ? { kind: test.kind, test_id: test.test_id, href: test.href, label: test.label, pass_percent: Number(pass) } : null;
    if (kind === 'writing') {
      const p = WRITING_PROMPTS.find((x) => x.id === promptId);
      return prompt.trim() ? { task, prompt: prompt.trim(), min_words: Number(minWords) || 0, prompt_id: promptId || null, visual_url: p?.visualUrl || null } : null;
    }
    if (kind === 'flashcards') return cards.length ? { cards: cards.map((c) => withExtras(c, extras)) } : null;
    if (kind === 'sentences') return words.length ? { words, level } : null;
    if (kind === 'quiz') return testProblems(quiz).length ? null : { ...splitTest(quiz).payload, pass_percent: Number(pass) };
    if (kind === 'dictation') return dict ? dict.payload : null;
    return { link: link.trim() || null, uploads };
  };

  const recipients = (data, cid = classId) => {
    if (target === 'class') return data.students.filter((s) => s.classIds.includes(cid)).map((s) => s.id);
    return [...picked];
  };

  const submit = async (e, data) => {
    e.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (!payload && kind === 'quiz') { setError({ message: testProblems(quiz).slice(0, 3).join(' ') }); return; }
    if (!payload) {
      setError({ message: { test: 'Pick a test.', writing: 'Add a writing prompt.', dictation: 'Prepare the audio first.', sentences: 'Add at least one word.' }[kind] || 'Add at least one card (front - back).' });
      return;
    }
    if (target === 'class' && !classIds.length) { setError({ message: 'Pick a class.' }); return; }
    if (publishMode === 'later' && due && new Date(due) <= new Date(publishAt)) { setError({ message: 'The due date must be after the publish time.' }); return; }
    const ids = recipients(data);
    if (target === 'students' && !ids.length) { setError({ message: 'Pick at least one student.' }); return; }
    setBusy(true);
    if (editing) {
      try {
        const a = source.data;
        const fields = {
          title: title.trim(), instructions: instructions.trim() || null, coins: coinsValue(coins),
          class_id: target === 'class' ? classId : null,
          due_at: due ? new Date(due).toISOString() : null,
        };
        if (kind !== 'flashcards') fields.payload = payload;
        if (!published) fields.publish_at = publishMode === 'later' && publishAt ? new Date(publishAt).toISOString() : new Date().toISOString();
        await api.updateAssignment(a.id, fields);
        if (kind === 'flashcards') await api.updateDeck(a.id, payload.cards);
        if (kind === 'quiz') await api.saveQuizKey(a.id, splitTest(quiz).key);
        if (kind === 'dictation' && dict) await api.saveDictationKey(a.id, dict.key.transcript, dict.key.source);
        await api.syncRecipients(a.id, a.recipients.map((r) => r.id), ids);
        go(`/teach/assignments/${a.id}`);
      } catch (err) { setError(err); setBusy(false); }
      return;
    }
    try {
      const targets = target === 'class' ? classIds : [null];
      let a = null;
      for (const cid of targets) {
      // eslint-disable-next-line no-await-in-loop
      a = await api.createAssignment({
        kind, title: title.trim(), instructions: instructions.trim() || null, payload, coins: coinsValue(coins),
        class_id: cid,
        due_at: due ? new Date(due).toISOString() : null,
        publish_at: publishMode === 'later' && publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
      }, cid ? recipients(data, cid) : ids, kind === 'dictation' ? (created) => api.saveDictationKey(created.id, dict.key.transcript, dict.key.source)
        : kind === 'quiz' ? (created) => api.saveQuizKey(created.id, splitTest(quiz).key)
          : null);
      }
      go(targets.length > 1 ? '/teach/assignments' : `/teach/assignments/${a.id}`);
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <>
      {editing ? <BackLink to={`/teach/assignments/${editId}`} label="Assignment" /> : <BackLink to="/teach/assignments" label="Assignments" />}
      <PageTitle title={editing ? 'Edit assignment' : fromId ? 'Duplicate assignment' : 'New assignment'}
        lead={editing ? 'Changes apply for everyone it is assigned to. Work already submitted is kept.' : fromId ? 'Copied from an earlier assignment and moved one day later.' : null} />
      {editing && source.data === null && !source.loading ? <EmptyPanel icon="xCircle" title="Assignment not found" /> : (
      <Loaded state={editing && !source.data ? source : roster}>
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
                  <button key={k} type="button" className={`chip${kind === k ? ' is-selected' : ''}`} onClick={() => setKind(k)}
                    disabled={editing && kind !== k} title={editing && kind !== k ? 'The type can\'t change. Duplicate it to make a different kind.' : undefined}>
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
                  {testGroups.filter((g) => g.tests.length).map((g) => (
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
                <label className="hub-switch">
                  <input type="checkbox" role="switch" checked={uploads} onChange={(e) => setUploads(e.target.checked)} />
                  <span className="hub-switch-track" aria-hidden="true"><span /></span>
                  <span>
                    <strong>Students upload proof</strong>
                    <small>Photos, screenshots, video, audio or PDF. You check them and mark the task as passed, or send it back to redo.</small>
                  </span>
                </label>
                {!uploads && <p className="form-help">Students mark it done and can leave you a note.</p>}
              </div>
            )}

            {kind === 'dictation' && (
              <React.Suspense fallback={<Spinner />}>
                <DictationSetup key={dictInitial ? 'dup' : 'new'} initial={dictInitial} onChange={setDict}
                  onSuggestTitle={(t) => setTitle((cur) => (!cur || cur.startsWith('Dictation') ? t : cur))} />
              </React.Suspense>
            )}

            {kind === 'flashcards' && (
              <div className="form-field">
                <label className="form-label" htmlFor="na-cards">Cards — one per line: <code>front - back</code></label>
                <textarea id="na-cards" className="form-textarea" rows={8} value={cardsText} onChange={(e) => setCardsText(e.target.value)}
                  placeholder={'mitigate - to make something less severe\nubiquitous - found everywhere'} />
                <p className="form-help">{cards.length} card{cards.length === 1 ? '' : 's'} detected. Pasting two columns from a spreadsheet works too. Words go to the front of each student's daily queue, then repeat on a spaced-repetition schedule.</p>
                <CardEnricher cards={cards} extras={extras} onChange={setExtras} />
              </div>
            )}

            {kind === 'quiz' && (
              <div className="form-field">
                <span className="form-label">Questions</span>
                <React.Suspense fallback={<Spinner />}><QuizBuilder value={quiz} onChange={setQuiz} /></React.Suspense>
              </div>
            )}

            {kind === 'sentences' && (
              <div className="form-field">
                <label className="form-label" htmlFor="na-words">Target words — one per line: <code>word</code> or <code>word - meaning</code></label>
                <textarea id="na-words" className="form-textarea" rows={8} value={wordsText} onChange={(e) => setWordsText(e.target.value)}
                  placeholder={'mitigate - make something less severe\npose a threat\nheavily reliant on'} />
                {deckOptions.data?.length > 0 && (
                  <select className="form-select" style={{ marginTop: 8 }} value="" aria-label="Use words from a flashcard assignment"
                    onChange={(e) => {
                      const d = deckOptions.data.find((x) => x.id === e.target.value);
                      if (d) setWordsText((d.payload?.cards || []).slice(0, 20).map((c) => `${c.f} - ${c.b}`).join('\n'));
                    }}>
                    <option value="">Use the words from a flashcard assignment…</option>
                    {deckOptions.data.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                )}
                <p className="form-help">{words.length} word{words.length === 1 ? '' : 's'} (max 20). Students write one sentence with each and get instant AI feedback; a word counts as used once a sentence is correct.</p>
                <span className="form-label" style={{ marginTop: 14 }}>Level</span>
                <Seg label="Level" value={level} onChange={setLevel} options={[
                  { value: 'junior', label: 'Junior' },
                  { value: 'senior', label: 'Senior' },
                ]} />
                <p className="form-help">
                  {level === 'senior'
                    ? 'Senior (band 6.5+): sentences need about 14+ words, an academic tone and a complex structure. Plain ones come back as "Too simple".'
                    : 'Junior (band 5-6): sentences need about 10 words with a reason, result or example. Bare ones like "Many people work remotely." come back as "Too simple".'}
                </p>
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
                <button type="button" className={`chip${target === 'class' ? ' is-selected' : ''}`} onClick={() => setTarget('class')}>{editing ? 'A class' : 'Classes'}</button>
                <button type="button" className={`chip${target === 'students' ? ' is-selected' : ''}`} onClick={() => setTarget('students')}>Specific students</button>
              </div>
              {target === 'class' ? (
                <>
                  {editing ? (
                    <select className="form-select" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class" style={{ marginTop: 'var(--space-3)' }}>
                      <option value="">Choose a class…</option>
                      {data.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : <div style={{ marginTop: 'var(--space-3)' }}><ClassPicklist classes={data.classes} value={classIds} onChange={setClassIds} /></div>}
                  <p className="form-help">{!editing && classIds.length > 1 ? `Creates ${classIds.length} copies, one per class, so each class's results stay separate. ` : ''}Students who join the class later also get it while it's still open.</p>
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
              <span className="form-label">Publish</span>
              {published ? <p className="form-help">Published {formatDate(source.data.publish_at, true)}.</p> : (
              <Seg label="Publish" value={publishMode} onChange={setPublishMode} options={[
                { value: 'now', label: 'Now' },
                { value: 'later', label: 'Schedule', icon: 'calendar' },
              ]} />)}
              {!published && publishMode === 'later' && (
                <>
                  <input type="datetime-local" className="form-input" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} aria-label="Publish at" style={{ marginTop: 8 }} />
                  <p className="form-help">Students won't see it, or get notified, until then. Flashcard words join their queue at that time.</p>
                </>
              )}
            </div>

            <CoinFields kind={kind} coins={coins} setCoins={setCoins} pass={pass} setPass={setPass} idPrefix="na" />

            <div className="form-field">
              <label className="form-label" htmlFor="na-due">Due</label>
              <input id="na-due" type="datetime-local" className="form-input" value={due} onChange={(e) => setDue(e.target.value)} />
              <p className="form-help">Clear it for no due date.</p>
            </div>

            {error && <ErrorNote error={error} />}
            <button className="btn btn-primary" disabled={busy || !title.trim()}>{busy ? 'Saving…' : editing ? 'Save changes' : publishMode === 'later' ? 'Schedule homework' : 'Assign homework'}</button>
          </form>
        )}
      </Loaded>
      )}
    </>
  );
}

// ── Assignment detail + review ───────────────────────────────────────────────
function ReviewPanel({ a, sub, onDone }) {
  const [band, setBand] = useState(sub.band != null ? String(sub.band) : '');
  const [feedback, setFeedback] = useState(sub.feedback || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const isTask = a.kind === 'custom';

  const run = async (fn) => {
    setBusy(true); setError(null);
    try { await fn(); onDone(); } catch (err) { setError(err); setBusy(false); }
  };
  const save = () => run(() => api.reviewSubmission(sub.id, band === '' ? null : Number(band), feedback));
  const pass = () => run(() => api.reviewSubmission(sub.id, null, feedback, { verdict: 'passed' }));
  const redo = async () => {
    if (!await confirmDialog({
      title: 'Send it back to redo?',
      body: feedback.trim() ? 'The student sees your feedback and can submit again.' : 'Add feedback first so the student knows what to fix.',
      confirmLabel: 'Ask to redo',
    })) return;
    run(() => api.returnSubmission(sub.id, feedback));
  };

  return (
    <div className="hub-review">
      <IntegrityNote sub={sub} />
      {a.kind === 'writing' && (
        <>
          <p className="form-help">{wordCount(sub.body)} words · submitted {formatDate(sub.submitted_at, true)}</p>
          <div className="hub-pre hub-essay-view">{sub.body || '(empty)'}</div>
        </>
      )}
      {a.kind === 'dictation' && (
        <>
          <p className="form-help">Submitted {formatDate(sub.submitted_at, true)}</p>
          {a.key ? <DictationResult text={sub.body || ''} transcript={a.key.transcript} /> : <div className="hub-pre hub-essay-view">{sub.body || '(empty)'}</div>}
        </>
      )}
      {isTask && (
        <>
          <p className="form-help">Submitted {formatDate(sub.submitted_at, true)}</p>
          {(a.payload?.uploads || sub.data?.files?.length > 0) && <ProofFiles files={sub.data?.files || []} />}
        </>
      )}
      {a.kind === 'sentences' && <SentenceResults words={a.payload?.words || []} checks={(a.checks || []).filter((c) => c.student_id === sub.student_id)} />}
      {sub.note && <p className="hub-pre"><strong>Student note:</strong> {sub.note}</p>}
      {a.kind === 'writing' && (
        <div className="hub-form-row">
          <div className="form-field">
            <label className="form-label" htmlFor={`band-${sub.id}`}>Band</label>
            <select id={`band-${sub.id}`} className="form-select" value={band} onChange={(e) => setBand(e.target.value)}>
              <option value="">—</option>
              {Array.from({ length: 19 }, (_, i) => (9 - i * 0.5).toFixed(1)).map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      )}
      <div className="form-field">
        <label className="form-label" htmlFor={`fb-${sub.id}`}>Feedback</label>
        <textarea id={`fb-${sub.id}`} className="form-textarea" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </div>
      {error && <ErrorNote error={error} />}
      {isTask ? (
        <div className="hub-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={pass}><Icon name="check" size={16} /> {sub.reviewed_at ? 'Update · passed' : 'Mark as passed'}</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={redo}><Icon name="refresh" size={16} /> Ask to redo</button>
        </div>
      ) : (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>{sub.reviewed_at ? 'Update review' : 'Send review'}</button>
      )}
    </div>
  );
}

// Add (or refresh) AI study material on an existing deck; updates every student's cards.
function DeckEnrich({ a, onSaved }) {
  const cards = useMemo(() => a.payload?.cards || [], [a.payload]);
  const initial = useMemo(() => Object.fromEntries(cards.filter((c) => c.ex || c.gap || c.forms || c.coll).map((c) => [extraKey(c.f), c])), [cards]);
  const [open, setOpen] = useState(false);
  const [extras, setExtras] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const ready = cards.filter((c) => initial[extraKey(c.f)]).length;
  if (!open) {
    return (
      <div className="card ce-summary">
        <Icon name="layers" size={16} />
        <span>{cards.length} cards · {ready ? `${ready} with examples, forms and collocations` : 'no examples yet, so students only flip and type the word'}</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}><Icon name="sparkle" size={14} /> {ready ? 'Edit study material' : 'Add examples with AI'}</button>
      </div>
    );
  }
  const save = async () => {
    setBusy(true); setError(null);
    try {
      await api.enrichDeck(a.id, cards.map((c) => withExtras({ f: c.f, b: c.b }, extras)));
      setOpen(false); onSaved();
    } catch (err) { setError(err); }
    setBusy(false);
  };
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <CardEnricher cards={cards.map((c) => ({ f: c.f, b: c.b }))} extras={extras} onChange={setExtras} />
      {error && <ErrorNote error={error} />}
      <div className="hub-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save for all students'}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setExtras(initial); setOpen(false); }}>Cancel</button>
      </div>
    </div>
  );
}

const REVIEWABLE = ['writing', 'custom', 'dictation', 'sentences', 'quiz'];
// Order on the students list: what needs the teacher first, finished work last.
const ROW_ORDER = { review: 0, overdue: 1, redo: 2, started: 3, todo: 4, done: 5 };

// Score for one student's row: { pct } for percentages, { band } for writing.
function rowScore(a, { sub, attempts }, studentId) {
  if (a.kind === 'test') return attempts.length ? { pct: attempts.reduce((m, r) => Math.max(m, pct(r.correct, r.total)), 0) } : null;
  if (a.kind === 'quiz') { const s = sub?.marking?.score || sub?.data?.score; return s ? { pct: s.percent } : null; }
  if (a.kind === 'dictation') return sub?.status === 'submitted' && a.key ? { pct: dictationAccuracy(sub, a.key) } : null;
  if (a.kind === 'writing') return sub?.band != null ? { band: Number(sub.band) } : null;
  if (a.kind === 'flashcards') { const d = a.deck?.[studentId]; return d?.total ? { pct: pct(d.learned, d.total), note: `${d.learned}/${d.total} learned` } : null; }
  if (a.kind === 'sentences') {
    const mine = (a.checks || []).filter((c) => c.student_id === studentId);
    const n = a.payload?.words?.length || 0;
    return mine.length && n ? { pct: pct(usedCount(mine), n), note: `${usedCount(mine)}/${n} used` } : null;
  }
  return null;
}

function rowNote(a, { sub, attempts }) {
  if (a.kind === 'test' && attempts.length) return plural(attempts.length, 'attempt');
  if (a.kind === 'quiz') { const tries = (sub?.data?.attempts?.length || 0) + (sub ? 1 : 0); return tries > 1 ? `Attempt ${tries}${a.payload?.max_attempts ? ` of ${a.payload.max_attempts}` : ''}` : null; }
  if (a.kind === 'custom' && sub?.data?.files?.length) return plural(sub.data.files.length, 'file');
  if (a.kind === 'writing' && sub?.body) return `${wordCount(sub.body)} words`;
  return null;
}

const scoreTone = (p, pass) => (p >= (pass || 80) ? 'tp-good' : p >= 50 ? 'tp-mid' : 'tp-low');

export function AssignmentDetail({ id }) {
  const { go } = useHub();
  const state = useAsync(async () => {
    const a = await api.assignmentDetail(id);
    if (a && a.kind === 'flashcards') a.deck = await api.deckProgress(id);
    if (a && a.kind === 'dictation') a.key = await api.dictationKey(id).catch(() => null);
    if (a && a.kind === 'sentences') a.checks = await api.usageChecks(id).catch(() => []);
    if (a && a.kind === 'quiz') a.quizKey = (await api.quizKey(id).catch(() => null))?.key || null;
    return a;
  }, [id]);
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('all');
  const [analyzing, setAnalyzing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const closePreview = React.useCallback(() => setPreviewing(false), []);
  const rule = useHomeworkRule();
  const message = (sid) => messageUser(sid, go).catch((e) => alertDialog({ title: 'Could not open the chat', body: e.message }));

  return (
    <>
      <BackLink to="/teach/assignments" label="Assignments" />
      <Loaded state={state}>
        {(a) => {
          if (!a) return <EmptyPanel icon="xCircle" title="Assignment not found" />;
          const subs = new Map(a.submissions.map((s) => [s.student_id, s]));
          const pass = passPercent(a);
          const rows = a.recipients.map((r) => {
            const attempts = attemptsFor(a, a.results.map((x) => ({ ...x, kind: a.payload.kind, test_id: a.payload.test_id })).filter((x) => x.user_id === r.id));
            const sub = subs.get(r.id) || null;
            const base = statusOf(a, sub, attempts);
            const status = isOverdue(a, base) ? 'overdue' : base;
            const canReview = Boolean(sub) && REVIEWABLE.includes(a.kind)
              && (sub.status === 'submitted' || (a.kind === 'quiz' && sub.data?.attempts?.length > 0));
            const needsReview = canReview && !sub.reviewed_at && sub.status === 'submitted';
            const row = { student: r, sub, attempts, status, canReview, needsReview };
            row.group = needsReview ? 'review' : isComplete(status) ? 'done' : 'missing';
            row.order = needsReview ? ROW_ORDER.review : ROW_ORDER[status] ?? ROW_ORDER.done;
            row.score = rowScore(a, row, r.id);
            row.note = row.score?.note || rowNote(a, row);
            return row;
          }).sort((x, y) => x.order - y.order || (x.student.name || '').localeCompare(y.student.name || ''));

          const count = (g) => rows.filter((r) => r.group === g).length;
          const done = rows.filter((r) => isComplete(r.status)).length;
          const overdue = rows.filter((r) => r.status === 'overdue').length;
          const scored = rows.filter((r) => r.score?.pct != null);
          const banded = rows.filter((r) => r.score?.band != null);
          const avg = scored.length ? Math.round(scored.reduce((t, r) => t + r.score.pct, 0) / scored.length) : null;
          const avgBand = banded.length ? (Math.round((banded.reduce((t, r) => t + r.score.band, 0) / banded.length) * 2) / 2).toFixed(1) : null;
          const passed = isScored(a.kind) && pass ? scored.filter((r) => r.score.pct >= pass).length : null;
          const shown = filter === 'all' ? rows : rows.filter((r) => r.group === filter);
          const scheduled = new Date(a.publish_at) > new Date();
          const pastDue = a.due_at && new Date(a.due_at) < new Date();

          return (
            <>
              <header className="tp-ahead">
                <KindTag kind={a.kind} />
                <div className="tp-ahead-row">
                  <h1>{a.title}</h1>
                  <span className="hub-actions" style={{ margin: 0 }}>
                    <button type="button" className="btn btn-sm" onClick={() => setPreviewing(true)}><Icon name="eye" size={14} /> Preview</button>
                    <HubLink to={`/teach/assignments/${a.id}/edit`} className="btn btn-sm"><Icon name="edit" size={14} /> Edit</HubLink>
                    <HubLink to={`/teach/assignments/new?from=${a.id}`} className="btn btn-sm"><Icon name="copy" size={14} /> Duplicate</HubLink>
                    <button type="button" className="hub-icon-btn tp-danger-icon" title="Delete assignment" aria-label="Delete assignment" onClick={() => {
                      confirmDialog({ title: 'Delete this assignment?', body: 'All of its submissions are deleted too. This can’t be undone.', confirmLabel: 'Delete', danger: true })
                        .then((yes) => yes && api.deleteAssignment(a.id).then(() => go('/teach/assignments')));
                    }}><Icon name="trash" size={16} /></button>
                  </span>
                </div>
                <div className="tp-meta">
                  <span><Icon name="users" size={13} /> {a.classes?.name || 'Individual students'}</span>
                  {scheduled
                    ? <span className="pill pill-accent"><Icon name="calendar" size={12} /> Publishes {whenShort(a.publish_at)}</span>
                    : <span><Icon name="calendar" size={13} /> Posted {formatDate(a.publish_at)}</span>}
                  <span className={pastDue ? 'tp-meta-past' : ''}><Icon name="clock" size={13} /> {a.due_at ? `${pastDue ? 'Was due' : 'Due'} ${formatDate(a.due_at, true)}` : 'No due date'}</span>
                  <span className="hub-num"><Coin size={13} /> {a.coins ?? rule?.coins ?? '…'} coins on time{isScored(a.kind) ? ` · ${pass ? `${pass}%+ to earn` : 'any score'}` : ''}</span>
                </div>
              </header>

              {rows.length > 0 && (
                <div className="tp-kpis">
                  <div className="card tp-kpi">
                    <small>Completed</small>
                    <strong className="hub-num">{done}<span>/{rows.length}</span></strong>
                    <span className="hub-bar hub-bar--wide"><span style={{ width: `${(done / rows.length) * 100}%` }} /></span>
                  </div>
                  <button type="button" className={`card tp-kpi${count('review') ? ' is-warn' : ''}`} onClick={() => setFilter('review')} disabled={!count('review')}>
                    <small>To review</small>
                    <strong className="hub-num">{count('review')}</strong>
                    <span>{count('review') ? 'Waiting for you' : 'All caught up'}</span>
                  </button>
                  <button type="button" className={`card tp-kpi${overdue ? ' is-danger' : ''}`} onClick={() => setFilter('missing')} disabled={!count('missing')}>
                    <small>Not done</small>
                    <strong className="hub-num">{count('missing')}</strong>
                    <span>{overdue ? `${overdue} overdue` : count('missing') ? 'Still open' : 'Everyone handed in'}</span>
                  </button>
                  {(avg != null || avgBand != null) && (
                    <div className="card tp-kpi">
                      <small>{avgBand != null ? 'Average band' : 'Average score'}</small>
                      <strong className="hub-num">{avgBand != null ? avgBand : `${avg}%`}</strong>
                      <span>{passed != null ? `${passed}/${scored.length} reached ${pass}%` : `from ${plural(avgBand != null ? banded.length : scored.length, 'student')}`}</span>
                    </div>
                  )}
                </div>
              )}

              {a.instructions && <div className="card hub-instructions"><p className="hub-pre">{a.instructions}</p></div>}
              {a.kind === 'writing' && a.payload?.prompt && <div className="card hub-instructions"><span className="eyebrow">{a.payload.task}</span><p className="hub-pre">{a.payload.prompt}</p></div>}
              {a.kind === 'test' && <p className="body">Test: <strong>{a.payload?.label}</strong></p>}
              {a.kind === 'quiz' && (
                <div className="qa-entry">
                  <p className="body">
                    {a.payload?.sections?.reduce((n, s) => n + s.questions.length, 0) || 0} questions
                    {' · '}{a.payload?.sections?.reduce((n, s) => n + s.questions.reduce((m, q) => m + (q.points || 1), 0), 0) || 0} points
                  </p>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={!a.quizKey} onClick={() => setAnalyzing(true)}>
                    <Icon name="trending" size={14} /> Analyze with the class
                  </button>
                </div>
              )}
              {previewing && <React.Suspense fallback={<Spinner />}><AssignmentPreview a={a} onClose={closePreview} /></React.Suspense>}
              {analyzing && a.quizKey && (
                <React.Suspense fallback={<Spinner />}><QuizAnalysis a={a} onClose={() => setAnalyzing(false)} /></React.Suspense>
              )}
              {a.kind === 'sentences' && <p className="body">{a.payload?.words?.length || 0} words · {a.payload?.level === 'senior' ? 'Senior' : 'Junior'} level</p>}
              {a.kind === 'flashcards' && <DeckEnrich a={a} onSaved={state.reload} />}
              {a.kind === 'dictation' && (
                <p className="body">
                  {a.payload?.cues?.length || 0} sentences
                  {a.key?.source === 'generated' ? ' · transcript generated from the audio' : a.key?.source === 'teacher' ? ' · your transcript' : a.key?.source === 'test' ? ' · transcript from the test' : ''}
                </p>
              )}

              <section className="hub-section">
                <div className="tp-section-head">
                  <h2 className="h3">Students</h2>
                  {rows.length > 0 && (
                    <Seg label="Show students" value={filter} onChange={setFilter} options={[
                      { value: 'all', label: `All ${rows.length}` },
                      { value: 'review', label: `To review ${count('review')}` },
                      { value: 'missing', label: `Not done ${count('missing')}` },
                      { value: 'done', label: `Done ${count('done')}` },
                    ]} />
                  )}
                </div>
                {rows.length ? (
                  <div className="hub-list tp-subs">
                    {shown.map((row) => {
                      const { student, sub, status, canReview, needsReview, score, note } = row;
                      const isOpen = open === student.id;
                      const close = () => { setOpen(null); state.reload(); };
                      return (
                        <div key={student.id} className={`card tp-sub${isOpen ? ' is-open' : ''}`}>
                          <div className="tp-sub-row">
                            <HubLink to={`/teach/students/${student.id}`} className="tp-sub-who hub-plain"><PersonName person={student} /></HubLink>
                            <span className="tp-sub-note">{note}</span>
                            <span className="tp-sub-score hub-num">
                              {score?.band != null && <span className="pill">Band {score.band.toFixed(1)}</span>}
                              {score?.pct != null && (
                                <span className={`tp-score ${scoreTone(score.pct, pass)}`}>
                                  <span className="hub-bar"><span style={{ width: `${score.pct}%` }} /></span>{score.pct}%
                                </span>
                              )}
                            </span>
                            <span className="tp-sub-status"><StatusPill status={needsReview ? 'submitted' : status} /></span>
                            <span className="tp-sub-actions">
                              {canReview && (
                                <button type="button" className={`btn btn-sm ${needsReview && !isOpen ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setOpen(isOpen ? null : student.id)}>
                                  {isOpen ? 'Close' : needsReview ? 'Review' : 'View'}
                                </button>
                              )}
                              {!isComplete(status) && (
                                <button type="button" className="hub-icon-btn" title={`Message ${student.name || 'student'}`} aria-label={`Message ${student.name || 'student'}`} onClick={() => message(student.id)}>
                                  <Icon name="message" size={16} />
                                </button>
                              )}
                              {sub && a.kind !== 'flashcards' && (
                                <button type="button" className="hub-icon-btn" title="Let this student do it again" aria-label={`Allow ${student.name || 'student'} to retake`} onClick={async () => {
                                  if (!await confirmDialog({
                                    title: `Let ${student.name || 'this student'} retake it?`,
                                    body: 'Their answers, score and feedback for this assignment are deleted, and it opens again as To do. Coins they already earned stay. They get a notification and an email.',
                                    confirmLabel: 'Allow retake',
                                    danger: true,
                                  })) return;
                                  try { await api.allowRetake(a.id, student.id); setOpen(null); state.reload(); }
                                  catch (err) { await confirmDialog({ title: "Couldn't reset it", body: err.message, confirmLabel: 'OK' }); }
                                }}>
                                  <Icon name="refresh" size={16} />
                                </button>
                              )}
                            </span>
                          </div>
                          {isOpen && canReview && a.kind === 'quiz' && (
                            <React.Suspense fallback={<Spinner />}><QuizReview a={a} sub={sub} onDone={close} /></React.Suspense>
                          )}
                          {isOpen && canReview && a.kind !== 'quiz' && (a.kind === 'writing'
                            ? <React.Suspense fallback={<Spinner />}><WritingReview a={a} sub={sub} onDone={close} /></React.Suspense>
                            : <ReviewPanel a={a} sub={sub} onDone={close} />)}
                        </div>
                      );
                    })}
                    {!shown.length && <p className="tp-none">Nobody here.</p>}
                  </div>
                ) : <p className="body">Nobody is assigned yet. Students who join the class while it's open will get it.</p>}
              </section>
            </>
          );
        }}
      </Loaded>
    </>
  );
}
