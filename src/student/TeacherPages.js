import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import {
  KINDS, attemptsFor, statusOf, isComplete, isOverdue, dueLabel, formatDate, pct, parseCards, wordCount,
} from './homework';
import { TEST_GROUPS, ALL_TESTS, testKey, WRITING_PROMPTS } from './catalog';
import {
  useHub, useAsync, Loaded, EmptyPanel, HubLink, BackLink, StatusPill, KindTag, PersonName, CopyButton, ErrorNote,
  PageTitle, Seg, Coin, toLocalInput, Spinner,
} from './ui';
import { ResultsSummary, RecentAttempts, SrsStatsBlock, AttendanceHistory } from './StudentPages';
import { GiveCoins } from './CoinAdmin';
import { confirmDialog, promptDialog } from './dialog';
import { ProofFiles } from './TaskProof';
import CardEnricher, { withExtras, extraKey } from './vocab/CardEnricher';
import { SentenceResults, usedCount } from './vocab/SentenceWork';
import { DictationResult } from './dictation/Dictation';
import { checkDictation } from './dictation/diff';

const DictationSetup = React.lazy(() => import('./dictation/DictationSetup'));
const WritingReview = React.lazy(() => import('./writing/WritingReview'));
const dictationAccuracy = (sub, key) => sub.data?.score?.accuracy ?? checkDictation(sub.body || '', key.transcript).score.accuracy;

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
      <PageTitle eyebrow="Teaching" title="Classes" lead="Create a class and share its join link. Students who join get the class's homework." />
      <form className="hub-inline-form" onSubmit={create}>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="New class name, e.g. Evening B2" maxLength={80} aria-label="Class name" />
        <button className="btn btn-primary" disabled={busy || !name.trim()}><Icon name="plus" size={16} /> Create class</button>
      </form>
      {error && <ErrorNote error={error} />}
      <Loaded state={state}>
        {(classes) => classes.length ? (
          <div className="hub-list" style={{ marginTop: '24px' }}>
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
                        if (await confirmDialog({ title: `Remove ${m.name || m.email}?`, body: `They'll leave ${c.name}. Their past homework stays.`, confirmLabel: 'Remove', danger: true })) {
                          act(() => api.removeMember(c.id, m.id));
                        }
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
  const state = useAsync(async () => {
    const [roster, sums] = await Promise.all([api.teacherStudents(user.id), api.teacherSummaries().catch(() => new Map())]);
    return { ...roster, sums };
  }, [user.id]);
  const [q, setQ] = useState('');
  return (
    <>
      <PageTitle eyebrow="Teaching" title="Students" lead="Everyone in your classes. Open a student to see their scores and homework." />
      <Loaded state={state}>
        {({ students, sums }) => {
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
                    {sums.get(s.id) && (
                      <>
                        <small title="Coins this week" className="hub-num"><Coin size={12} /> {sums.get(s.id).week}/wk</small>
                        <small title="Attendance streak" className="hub-num">Att. {sums.get(s.id).attendance_streak}</small>
                        <small title="Homework streak" className="hub-num">HW {sums.get(s.id).homework_streak}</small>
                      </>
                    )}
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
  const { user, viewAsStudent } = useHub();
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
              {viewAsStudent && (
                <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => viewAsStudent(d.profile)}>
                  <Icon name="eye" size={14} /> View as student
                </button>
              )}
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

export function Assignments() {
  const { user } = useHub();
  const state = useAsync(() => api.teacherAssignments(user.id), [user.id]);
  const [tab, setTab] = useState('active');
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
              <div style={{ marginBottom: 12 }}>
                <Seg label="Filter assignments" value={tab} onChange={setTab} options={[
                  { value: 'active', label: `Active (${groups.active.length})` },
                  { value: 'scheduled', label: `Scheduled (${groups.scheduled.length})` },
                  { value: 'past', label: `Past (${groups.past.length})` },
                ]} />
              </div>
              {shown.length ? (
                <div className="hub-list">
                  {shown.map((a) => {
                    const total = a.assignment_recipients.length;
                    const submitted = a.submissions.filter((x) => x.status === 'submitted').length;
                    const toReview = a.submissions.filter((x) => x.status === 'submitted' && !x.reviewed_at).length;
                    const scheduled = new Date(a.publish_at) > now;
                    return (
                      <HubLink key={a.id} to={`/teach/assignments/${a.id}`} className="card card-interactive hub-row">
                        <span className="hub-kind-icon"><Icon name={KINDS[a.kind]?.icon || 'edit'} size={16} /></span>
                        <div className="hub-row-main">
                          <strong>{a.title}</strong>
                          <small>{a.classes?.name ? `${a.classes.name} · ` : ''}{scheduled ? `Publishes ${whenShort(a.publish_at)}` : dueLabel(a.due_at)}</small>
                        </div>
                        {scheduled
                          ? <span className="pill pill-accent"><Icon name="calendar" size={12} /> Scheduled</span>
                          : <small className="hub-num">{a.kind === 'test' ? `${total} student${total === 1 ? '' : 's'}` : `${submitted}/${total} submitted`}</small>}
                        {toReview > 0 && a.kind !== 'flashcards' && <span className="pill pill-amber">{toReview} to review</span>}
                        <Icon name="chevronRight" size={16} />
                      </HubLink>
                    );
                  })}
                </div>
              ) : <EmptyPanel icon="edit" title={tab === 'scheduled' ? 'Nothing scheduled' : 'Nothing here'} lead="Create an assignment and pick when it goes out." />}
            </>
          );
        }}
      </Loaded>
    </>
  );
}

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
  const [uploads, setUploads] = useState(false);
  const [cardsText, setCardsText] = useState('');
  const [extras, setExtras] = useState({}); // AI study material per card front
  const [wordsText, setWordsText] = useState('');
  const [dict, setDict] = useState(null); // { payload, key } from DictationSetup
  const [dictInitial, setDictInitial] = useState(null);
  const [target, setTarget] = useState('class');
  const [classId, setClassId] = useState(presetClass);
  const [picked, setPicked] = useState(new Set());
  const [due, setDue] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(23, 59, 0, 0); return toLocalInput(d);
  });
  const [publishMode, setPublishMode] = useState('now');
  const [publishAt, setPublishAt] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return toLocalInput(d);
  });

  // ?from=<id> duplicates an assignment, shifted one day later.
  const fromId = new URLSearchParams(window.location.search).get('from');
  const source = useAsync(() => (fromId ? api.assignmentDetail(fromId) : Promise.resolve(null)), [fromId]);
  useEffect(() => {
    const a = source.data;
    if (!a) return;
    const shift = (iso) => { const d = new Date(iso); d.setDate(d.getDate() + 1); return d; };
    setKind(a.kind);
    setTitle(a.title);
    setInstructions(a.instructions || '');
    const pl = a.payload || {};
    if (a.kind === 'test') setTestKeyVal(`${pl.kind}:${pl.test_id}`);
    if (a.kind === 'writing') { setPrompt(pl.prompt || ''); setTask(pl.task || 'Task 2'); setMinWords(pl.min_words || 250); setPromptId(pl.prompt_id || ''); }
    if (a.kind === 'custom') { setLink(pl.link || ''); setUploads(Boolean(pl.uploads)); }
    if (a.kind === 'flashcards') {
      setCardsText((pl.cards || []).map((c) => `${c.f} - ${c.b}`).join('\n'));
      setExtras(Object.fromEntries((pl.cards || []).filter((c) => c.ex || c.gap).map((c) => [extraKey(c.f), c])));
    }
    if (a.kind === 'sentences') setWordsText((pl.words || []).map((w) => (w.m ? `${w.w} - ${w.m}` : w.w)).join('\n'));
    if (a.kind === 'dictation') api.dictationKey(a.id).then((key) => key && setDictInitial({ payload: pl, key })).catch(() => {});
    if (a.class_id) { setTarget('class'); setClassId(a.class_id); }
    else { setTarget('students'); setPicked(new Set(a.recipients.map((r) => r.id))); }
    const pub = shift(a.publish_at);
    if (pub > new Date()) { setPublishMode('later'); setPublishAt(toLocalInput(pub)); }
    if (a.due_at) setDue(toLocalInput(shift(a.due_at)));
  }, [source.data]);
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
    if (kind === 'flashcards') return cards.length ? { cards: cards.map((c) => withExtras(c, extras)) } : null;
    if (kind === 'sentences') return words.length ? { words } : null;
    if (kind === 'dictation') return dict ? dict.payload : null;
    return { link: link.trim() || null, uploads };
  };

  const recipients = (data) => {
    if (target === 'class') return data.students.filter((s) => s.classIds.includes(classId)).map((s) => s.id);
    return [...picked];
  };

  const submit = async (e, data) => {
    e.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (!payload) {
      setError({ message: { test: 'Pick a test.', writing: 'Add a writing prompt.', dictation: 'Prepare the audio first.', sentences: 'Add at least one word.' }[kind] || 'Add at least one card (front - back).' });
      return;
    }
    if (target === 'class' && !classId) { setError({ message: 'Pick a class.' }); return; }
    if (publishMode === 'later' && due && new Date(due) <= new Date(publishAt)) { setError({ message: 'The due date must be after the publish time.' }); return; }
    const ids = recipients(data);
    if (target === 'students' && !ids.length) { setError({ message: 'Pick at least one student.' }); return; }
    setBusy(true);
    try {
      const a = await api.createAssignment({
        kind, title: title.trim(), instructions: instructions.trim() || null, payload,
        class_id: target === 'class' ? classId : null,
        due_at: due ? new Date(due).toISOString() : null,
        publish_at: publishMode === 'later' && publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
      }, ids, kind === 'dictation' ? (created) => api.saveDictationKey(created.id, dict.key.transcript, dict.key.source) : null);
      go(`/teach/assignments/${a.id}`);
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <>
      <BackLink to="/teach/assignments" label="Assignments" />
      <PageTitle title={fromId ? 'Duplicate assignment' : 'New assignment'} lead={fromId ? 'Copied from an earlier assignment and moved one day later.' : null} />
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
              <span className="form-label">Publish</span>
              <Seg label="Publish" value={publishMode} onChange={setPublishMode} options={[
                { value: 'now', label: 'Now' },
                { value: 'later', label: 'Schedule', icon: 'calendar' },
              ]} />
              {publishMode === 'later' && (
                <>
                  <input type="datetime-local" className="form-input" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} aria-label="Publish at" style={{ marginTop: 8 }} />
                  <p className="form-help">Students won't see it, or get notified, until then. Flashcard words join their queue at that time.</p>
                </>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="na-due">Due</label>
              <input id="na-due" type="datetime-local" className="form-input" value={due} onChange={(e) => setDue(e.target.value)} />
              <p className="form-help">Clear it for no due date.</p>
            </div>

            {error && <ErrorNote error={error} />}
            <button className="btn btn-primary" disabled={busy || !title.trim()}>{busy ? 'Saving…' : publishMode === 'later' ? 'Schedule homework' : 'Assign homework'}</button>
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

function ScheduleEditor({ a, onSaved }) {
  const [open, setOpen] = useState(false);
  const [publishAt, setPublishAt] = useState(() => toLocalInput(new Date(a.publish_at)));
  const [due, setDue] = useState(() => (a.due_at ? toLocalInput(new Date(a.due_at)) : ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const published = new Date(a.publish_at) <= new Date();
  if (!open) {
    return (
      <div style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}><Icon name="calendar" size={14} /> Edit dates</button>
      </div>
    );
  }
  const save = async () => {
    setBusy(true); setError(null);
    try {
      const fields = { due_at: due ? new Date(due).toISOString() : null };
      if (!published) fields.publish_at = new Date(publishAt).toISOString();
      await api.updateAssignment(a.id, fields);
      setOpen(false); onSaved();
    } catch (err) { setError(err); }
    setBusy(false);
  };
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="hub-form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="ed-pub">Publish</label>
          <input id="ed-pub" type="datetime-local" className="form-input" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} disabled={published} />
          {published && <p className="form-help">Already published.</p>}
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="ed-due">Due</label>
          <input id="ed-due" type="datetime-local" className="form-input" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>
      {error && <ErrorNote error={error} />}
      <div className="hub-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>Save</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
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

export function AssignmentDetail({ id }) {
  const { go } = useHub();
  const state = useAsync(async () => {
    const a = await api.assignmentDetail(id);
    if (a && a.kind === 'flashcards') a.deck = await api.deckProgress(id);
    if (a && a.kind === 'dictation') a.key = await api.dictationKey(id).catch(() => null);
    if (a && a.kind === 'sentences') a.checks = await api.usageChecks(id).catch(() => []);
    return a;
  }, [id]);
  const [open, setOpen] = useState(null);

  return (
    <>
      <BackLink to="/teach/assignments" label="Assignments" />
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
                <div className="hub-section-head" style={{ marginBottom: 0 }}>
                  <h1>{a.title}</h1>
                  <HubLink to={`/teach/assignments/new?from=${a.id}`} className="btn btn-sm"><Icon name="copy" size={14} /> Duplicate</HubLink>
                </div>
                <div className="hub-detail-meta">
                  <span>{a.classes?.name || 'Individual students'}</span>
                  {new Date(a.publish_at) > new Date()
                    ? <span className="pill pill-accent"><Icon name="calendar" size={12} /> Publishes {whenShort(a.publish_at)}</span>
                    : <span>Posted {formatDate(a.publish_at)}</span>}
                  <span>{dueLabel(a.due_at)}</span>
                  <span>{done}/{rows.length} complete</span>
                </div>
              </div>
              <ScheduleEditor a={a} onSaved={state.reload} />
              {a.instructions && <div className="card hub-instructions"><p className="hub-pre">{a.instructions}</p></div>}
              {a.kind === 'writing' && a.payload?.prompt && <div className="card hub-instructions"><span className="eyebrow">{a.payload.task}</span><p className="hub-pre">{a.payload.prompt}</p></div>}
              {a.kind === 'test' && <p className="body">Test: <strong>{a.payload?.label}</strong></p>}
              {a.kind === 'flashcards' && <DeckEnrich a={a} onSaved={state.reload} />}
              {a.kind === 'dictation' && (
                <p className="body">
                  {a.payload?.cues?.length || 0} sentences
                  {a.key?.source === 'generated' ? ' · transcript generated from the audio' : a.key?.source === 'teacher' ? ' · your transcript' : a.key?.source === 'test' ? ' · transcript from the test' : ''}
                </p>
              )}

              <section className="hub-section">
                <h2 className="h3">Students</h2>
                {rows.length ? (
                  <div className="hub-list">
                    {rows.map(({ student, sub, attempts, status }) => {
                      const best = attempts.reduce((m, r) => Math.max(m, pct(r.correct, r.total)), 0);
                      const canReview = sub && ['writing', 'custom', 'dictation', 'sentences'].includes(a.kind) && sub.status === 'submitted';
                      const isOpen = open === student.id;
                      return (
                        <div key={student.id} className="card hub-row hub-row--stack">
                          <div className="hub-row-top">
                            <HubLink to={`/teach/students/${student.id}`} className="hub-row-main hub-plain"><PersonName person={student} /></HubLink>
                            {a.kind === 'test' && attempts.length > 0 && <small>Best {best}% · {attempts.length} attempt{attempts.length > 1 ? 's' : ''}</small>}
                            {a.kind === 'flashcards' && a.deck?.[student.id] && <small>{a.deck[student.id].learned}/{a.deck[student.id].total} learned</small>}
                            {a.kind === 'sentences' && a.checks && (a.checks.some((c) => c.student_id === student.id)) && (
                              <small>{usedCount(a.checks.filter((c) => c.student_id === student.id))}/{a.payload?.words?.length || 0} used</small>
                            )}
                            {a.kind === 'custom' && sub?.data?.files?.length > 0 && <small>{sub.data.files.length} file{sub.data.files.length === 1 ? '' : 's'}</small>}
                            {a.kind === 'dictation' && sub?.status === 'submitted' && a.key && <small>{dictationAccuracy(sub, a.key)}% accurate</small>}
                            {sub?.band != null && <span className="pill">Band {Number(sub.band).toFixed(1)}</span>}
                            <StatusPill status={status} />
                            {canReview && (
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(isOpen ? null : student.id)}>
                                {isOpen ? 'Close' : sub.reviewed_at ? 'View' : 'Review'}
                              </button>
                            )}
                          </div>
                          {isOpen && canReview && (a.kind === 'writing'
                            ? <React.Suspense fallback={<Spinner />}><WritingReview a={a} sub={sub} onDone={() => { setOpen(null); state.reload(); }} /></React.Suspense>
                            : <ReviewPanel a={a} sub={sub} onDone={() => { setOpen(null); state.reload(); }} />)}
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="body">Nobody is assigned yet. Students who join the class while it's open will get it.</p>}
              </section>

              <button type="button" className="btn btn-ghost btn-sm hub-danger" onClick={() => {
                confirmDialog({ title: 'Delete this assignment?', body: 'All of its submissions are deleted too. This can’t be undone.', confirmLabel: 'Delete', danger: true })
                  .then((yes) => yes && api.deleteAssignment(a.id).then(() => go('/teach/assignments')));
              }}>Delete assignment</button>
            </>
          );
        }}
      </Loaded>
    </>
  );
}
