import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/ui/icons';
import * as api from '../api';
import { useHub, useAsync, ErrorNote, Spinner } from '../ui';
import { formatDate, wordCount } from '../homework';
import { confirmDialog } from '../dialog';
import { useHomeworkGuard, GuardFrame, IntegrityNote } from '../guard';
import { VARIANTS, markTest, numbering } from './quiz';
import MathText from './MathText';
import { SatTake, SatResults, satStartKey } from './SatQuiz';

// Student side of a custom test, and the same view (read-only, marked) for
// results and the teacher's review.

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SAVE_EVERY_MS = 20000;

const Mark = ({ ok }) => <span className={`qz-mark ${ok ? 'is-ok' : 'is-no'}`} aria-label={ok ? 'Correct' : 'Incorrect'}><Icon name={ok ? 'check' : 'close'} size={12} /></span>;

function Num({ n }) {
  return <span className="qz-num">{n.from === n.to ? n.from : `${n.from}–${n.to}`}</span>;
}

function MCQ({ q, value, set, review }) {
  const picked = Array.isArray(value) ? value : [];
  const toggle = (i) => {
    if (review) return;
    if (!q.multi) { set([i]); return; }
    if (picked.includes(i)) set(picked.filter((x) => x !== i));
    else if (picked.length < q.pick) set([...picked, i]);
  };
  const key = review?.key || [];
  return (
    <div className="qz-options" role={q.multi ? 'group' : 'radiogroup'}>
      {q.multi && <small className="qz-hint">Choose {q.pick === 2 ? 'TWO' : q.pick === 3 ? 'THREE' : q.pick} letters.</small>}
      {q.options.map((o, i) => {
        const on = picked.includes(i);
        const cls = review ? (key.includes(i) ? ' is-key' : on ? ' is-wrong' : '') : '';
        return (
          <button key={i} type="button" role={q.multi ? 'checkbox' : 'radio'} aria-checked={on}
            className={`qz-option${on ? ' is-on' : ''}${cls}`} onClick={() => toggle(i)} disabled={Boolean(review)}>
            <span className="qz-letter">{LETTERS[i]}</span><MathText text={o} />
          </button>
        );
      })}
    </div>
  );
}

function TFNG({ q, value, set, review }) {
  return (
    <div className="qz-tf">
      {VARIANTS[q.variant || 'tfng'].map(([v, label]) => {
        const cls = review ? (review.key === v ? ' is-key' : value === v ? ' is-wrong' : '') : '';
        return (
          <button key={v} type="button" className={`qz-option qz-option--inline${value === v ? ' is-on' : ''}${cls}`}
            onClick={() => !review && set(v)} disabled={Boolean(review)} aria-pressed={value === v}>{label}</button>
        );
      })}
    </div>
  );
}

function Gap({ q, value, set, review, num }) {
  const vals = Array.isArray(value) ? value : [];
  const setAt = (i, v) => { const next = [...vals]; next[i] = v; set(next); };
  const pieces = String(q.text).split(/\{\{(\d+)\}\}/);
  return (
    <>
      {q.limit && <small className="qz-hint">{q.limit}</small>}
      <p className="qz-gaptext">
        {pieces.map((p, k) => {
          if (k % 2 === 0) return <React.Fragment key={k}>{p}</React.Fragment>;
          const i = Number(p) - 1;
          const n = num.from + i;
          const ok = review?.result?.parts?.[i];
          return (
            <span key={k} className="qz-gap">
              {q.bank ? (
                <select className={`form-select qz-gapinput${review ? (ok ? ' is-ok' : ' is-no') : ''}`} value={vals[i] || ''} disabled={Boolean(review)}
                  onChange={(e) => setAt(i, e.target.value)} aria-label={`Answer ${n}`}>
                  <option value="">{q.gaps > 1 ? n : '…'}</option>
                  {q.bank.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              ) : (
                <input className={`form-input qz-gapinput${review ? (ok ? ' is-ok' : ' is-no') : ''}`} value={vals[i] || ''} readOnly={Boolean(review)}
                  onChange={(e) => setAt(i, e.target.value)} aria-label={`Answer ${n}`} placeholder={q.gaps > 1 ? String(n) : ''} autoComplete="off" spellCheck={false}
                  style={{ width: `${Math.max(7, (vals[i] || '').length + 2)}ch` }} />
              )}
              {review && !ok && <span className="qz-fix">{(review.key?.[i] || []).join(' / ')}</span>}
            </span>
          );
        })}
      </p>
      {q.bank && !review && <div className="qz-bank">{q.bank.map((w) => <span key={w} className={vals.includes(w) ? 'is-used' : ''}>{w}</span>)}</div>}
    </>
  );
}

function Match({ q, value, set, review, num }) {
  const vals = Array.isArray(value) ? value : [];
  const used = new Set(vals.filter((v) => v != null));
  return (
    <>
      <ol className="qz-match-opts" type="A">{q.right.map((r, k) => <li key={k}><strong>{LETTERS[k]}</strong> {r}</li>)}</ol>
      <div className="qz-match">
        {q.left.map((l, i) => {
          const ok = review?.result?.parts?.[i];
          return (
            <label key={i} className="qz-match-row">
              <span className="qz-gapnum">{num.from + i}</span>
              <span className="qz-match-left">{l}</span>
              <select className={`form-select${review ? (ok ? ' is-ok' : ' is-no') : ''}`} value={vals[i] ?? ''} disabled={Boolean(review)}
                onChange={(e) => { const next = [...vals]; next[i] = e.target.value === '' ? null : Number(e.target.value); set(next); }}>
                <option value="">…</option>
                {q.right.map((_, k) => <option key={k} value={k} disabled={!q.reuse && used.has(k) && vals[i] !== k}>{LETTERS[k]}</option>)}
              </select>
              {review && !ok && <span className="qz-fix">{LETTERS[review.key?.[i]]}</span>}
            </label>
          );
        })}
      </div>
    </>
  );
}

function Short({ q, value, set, review }) {
  return (
    <div className="qz-short">
      {q.keyword && <span className="qz-keyword">{q.keyword.toUpperCase()}</span>}
      {q.limit && <small className="qz-hint">{q.limit}</small>}
      <div className="qz-short-row">
        {q.lead && <span className="qz-lead">{q.lead}</span>}
        <input className={`form-input${review ? (review.result.earned ? ' is-ok' : ' is-no') : ''}`} value={value || ''} readOnly={Boolean(review)}
          onChange={(e) => set(e.target.value)} aria-label="Your answer" autoComplete="off" spellCheck={false} />
      </div>
      {review && !review.result.earned && <span className="qz-fix">{q.lead ? `${q.lead} ` : ''}{(review.key || [])[0]}</span>}
    </div>
  );
}

function Reorder({ q, value, set, review }) {
  // value: the sentence built so far; tiles are used once each.
  const chosen = useMemo(() => (value ? String(value).split(' ') : []), [value]);
  const remaining = useMemo(() => {
    const left = [...q.tiles];
    chosen.forEach((w) => { const i = left.indexOf(w); if (i >= 0) left.splice(i, 1); });
    return left;
  }, [q.tiles, chosen]);
  return (
    <div className="qz-reorder">
      <div className={`qz-line${review ? (review.result.earned ? ' is-ok' : ' is-no') : ''}`}>
        {chosen.length ? chosen.map((w, i) => (
          <button key={i} type="button" className="qz-tile is-placed" disabled={Boolean(review)}
            onClick={() => set(chosen.filter((_, k) => k !== i).join(' '))}>{w}</button>
        )) : <span className="qz-placeholder">Tap the words in order</span>}
      </div>
      {!review && (
        <div className="qz-tiles">
          {remaining.map((w, i) => <button key={`${w}-${i}`} type="button" className="qz-tile" onClick={() => set([...chosen, w].join(' '))}>{w}</button>)}
          {chosen.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('')}>Clear</button>}
        </div>
      )}
      {review && !review.result.earned && <span className="qz-fix">{(review.key || [])[0]}</span>}
    </div>
  );
}

function Open({ q, value, set, review, manual, setManual }) {
  return (
    <div className="qz-open">
      <textarea className="form-textarea" rows={5} value={value || ''} readOnly={Boolean(review)} onChange={(e) => set(e.target.value)}
        placeholder="Your answer…" aria-label="Your answer" />
      <small className="qz-hint">{wordCount(value || '')} words{q.min_words ? ` · at least ${q.min_words}` : ''}</small>
      {review && setManual && (
        <label className="qz-manual">Points
          <input type="number" min="0" max={q.points} className="form-input" value={manual ?? ''} onChange={(e) => setManual(e.target.value === '' ? null : Number(e.target.value))} />
          <span>/ {q.points}</span>
        </label>
      )}
      {review && !setManual && <small className="qz-hint">{manual != null ? `${manual} / ${q.points} points` : 'Your teacher will mark this.'}</small>}
    </div>
  );
}

const RENDER = { mcq: MCQ, tfng: TFNG, gap: Gap, match: Match, short: Short, reorder: Reorder, open: Open };

// The whole test. review = { key, marks, manual, setManual } for marked views.
export function QuizView({ payload, answers, setAnswer, review }) {
  const nums = useMemo(() => numbering(payload), [payload]);
  return (
    <div className="qz">
      {payload.sections.map((s) => {
        const questions = (
          <div className="qz-questions">
            {(s.title || s.instructions) && (
              <header className="qz-sec-head">
                {s.title && <span className="qz-sec-title">{s.title}</span>}
                {s.instructions && <h2 className="qz-sec-instr">{s.instructions}</h2>}
              </header>
            )}
            {s.questions.map((q) => {
              const R = RENDER[q.type];
              const r = review?.marks?.items?.[q.id];
              const showMark = review && r && !r.manual && q.type !== 'match' && !(q.type === 'gap' && q.gaps > 1);
              return (
                <div key={q.id} className={`qz-q qz-q--${q.type}`}>
                  <div className="qz-q-num">{q.type !== 'match' && <Num n={nums[q.id]} />}</div>
                  <div className="qz-q-body">
                    {q.passage && <MathText block text={q.passage} className="qz-passage-text" />}
                    {q.prompt && <MathText block text={q.prompt} className="qz-prompt" />}
                    {review && q.bank?.id && <small className="qz-qid">Question ID {q.bank.id}</small>}
                    {q.image && <img className="qz-image" src={q.image} alt="Task visual" />}
                    <R q={q} num={nums[q.id]} value={answers?.[q.id]} set={(v) => setAnswer?.(q.id, v)}
                      review={review ? { key: review.key?.[q.id], result: r } : null}
                      manual={review?.manual?.[q.id]} setManual={review?.setManual ? (v) => review.setManual(q.id, v) : null} />
                  </div>
                  <div className="qz-q-mark">{showMark && <Mark ok={r.earned === r.possible} />}</div>
                </div>
              );
            })}
          </div>
        );
        if (!s.passage && !s.audio_url) return <section key={s.id} className="card qz-section">{questions}</section>;
        return (
          <section key={s.id} className="qz-section qz-split">
            <aside className="card qz-passage">
              {s.audio_url && <audio controls preload="none" src={s.audio_url} className="qz-audio" />}
              {s.passage && <div className="hub-pre">{s.passage}</div>}
            </aside>
            <div className="card">{questions}</div>
          </section>
        );
      })}
    </div>
  );
}

export function ScoreBar({ marks }) {
  return (
    <div className="card qz-score">
      <strong>{marks.percent}%</strong>
      <span>{marks.earned} of {marks.possible} points</span>
      {marks.pendingManual > 0 && <span className="pill">{marks.pendingManual} points waiting for your teacher</span>}
    </div>
  );
}

const countAnswered = (payload, answers) => payload.sections.reduce((n, s) => n + s.questions.filter((q) => {
  const v = answers?.[q.id];
  return Array.isArray(v) ? v.some((x) => x != null && x !== '') : v != null && String(v).trim() !== '';
}).length, 0);

// Remount for each new attempt so no state carries over.
export default function QuizWork({ a, onSaved }) {
  const n = a.submission?.data?.attempts?.length || 0;
  return <QuizAttempt key={`${a.id}:${n}`} a={a} onSaved={onSaved} />;
}

// Local per-attempt state (draft, timer, bookmarks, eliminations, guard leaves, position).
const clearAttemptStorage = (id) => {
  try {
    [`iw.v1.hub.quiz.${id}`, satStartKey(id), `iw.v1.hub.satmark.${id}`, `iw.v1.hub.satelim.${id}`, `iw.v1.hub.guard.${id}`].forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem(`iw.v1.hub.sat.${id}`);
  } catch { /* storage off */ }
};

function QuizAttempt({ a, onSaved }) {
  const { user, preview } = useHub();
  const sub = a.submission;
  const locked = sub?.status === 'submitted';
  const draftKey = `iw.v1.hub.quiz.${a.id}`;
  const [answers, setAnswers] = useState(() => {
    if (sub?.data?.answers) return sub.data.answers;
    try { return JSON.parse(localStorage.getItem(draftKey)) || {}; } catch { return {}; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const total = a.payload.sections.reduce((n, s) => n + s.questions.length, 0);
  const answered = countAnswered(a.payload, answers);

  // Draft: locally on every change, to the server every 20 s.
  const ref = useRef(answers);
  ref.current = answers;
  const guardRef = useRef();
  const lastSaved = useRef(JSON.stringify(sub?.data?.answers || {}));
  useEffect(() => {
    if (!locked) { try { localStorage.setItem(draftKey, JSON.stringify(answers)); } catch { /* storage off */ } }
  }, [answers, locked, draftKey]);
  useEffect(() => {
    if (locked || preview) return undefined;
    const id = setInterval(() => {
      const s = JSON.stringify(ref.current);
      if (s === lastSaved.current) return;
      const integrity = guardRef.current?.integrity;
      api.saveSubmission(a.id, user.id, { status: 'in_progress', data: { answers: ref.current, ...(integrity?.leaves ? { integrity } : {}) } })
        .then(() => { lastSaved.current = s; }).catch(() => {});
    }, SAVE_EVERY_MS);
    return () => clearInterval(id);
  }, [a.id, user.id, locked, preview]);

  const key = useAsync(() => (locked ? api.quizKey(a.id) : Promise.resolve(null)), [a.id, locked]);
  const marks = useMemo(() => (key.data ? markTest(a.payload, key.data.key, sub?.data?.answers || {}, sub?.marking?.manual) : null),
    [key.data, a.payload, sub]);

  // Store the auto score with the submission once the key is readable.
  useEffect(() => {
    if (!locked || !marks || preview || sub?.data?.score) return;
    api.saveSubmissionData(a.id, user.id, { ...sub.data, score: { earned: marks.earned, possible: marks.possible, percent: marks.percent } }).catch(() => {});
  }, [locked, marks, preview, sub, a.id, user.id]);

  const send = async (integrity = guardRef.current?.integrity) => {
    setBusy(true); setError(null);
    try {
      await api.saveSubmission(a.id, user.id, {
        status: 'submitted', submitted_at: new Date().toISOString(),
        data: { answers: ref.current, ...(integrity?.leaves ? { integrity } : {}) },
      });
      try { localStorage.removeItem(draftKey); localStorage.removeItem(satStartKey(a.id)); } catch { /* ignore */ }
      onSaved();
    } catch (err) { setError(err); setBusy(false); }
  };
  const submit = async () => {
    const left = total - answered;
    if (!await confirmDialog({
      title: 'Submit your test?',
      body: left ? `${left} question${left === 1 ? ' is' : 's are'} unanswered. You can't change your answers after submitting.` : "You can't change your answers after submitting.",
      confirmLabel: 'Submit',
    })) return;
    await send();
  };
  const guard = useHomeworkGuard(a, { active: !locked, onAutoSubmit: send });
  guardRef.current = guard;

  const sat = a.payload?.style === 'sat';
  const maxAttempts = Number(a.payload?.max_attempts) || 1;
  const history = sub?.data?.attempts || [];
  const attempts = { used: history.length + 1, max: maxAttempts, history, reviewOpened: Boolean(sub?.data?.review_opened) };
  const left = maxAttempts - attempts.used;
  const [shownAnswers, setShownAnswers] = useState(false);

  const retry = async () => {
    if (!await confirmDialog({
      title: `Start attempt ${attempts.used + 1} of ${maxAttempts}?`,
      body: 'Your answers start empty. This attempt\'s score stays in your results and your teacher sees every attempt.',
      confirmLabel: 'Start',
    })) return;
    try {
      await api.startQuizAttempt(a.id);
      clearAttemptStorage(a.id);
      onSaved();
    } catch (err) { setError(err); }
  };
  // Seeing the answers ends the remaining attempts.
  const openReview = async () => {
    if (left <= 0 || attempts.reviewOpened) return true;
    if (!await confirmDialog({
      title: 'See the answers now?',
      body: `You have ${left} attempt${left === 1 ? '' : 's'} left. Opening the correct answers and explanations ends them.`,
      confirmLabel: 'Show answers',
    })) return false;
    try { await api.mergeSubmissionData(a.id, user.id, { review_opened: true }); } catch { /* still show */ }
    setShownAnswers(true);
    return true;
  };

  if (locked) {
    if (key.loading) return <Spinner />;
    if (!marks) return <ErrorNote error={key.error || { message: "The answer key isn't available." }} />;
    if (sat) {
      return (
        <>
          <SatResults a={a} sub={sub} keyData={key.data.key} marks={marks} submittedLabel={`submitted ${formatDate(sub.submitted_at, true)}`}
            attempts={{ ...attempts, reviewOpened: attempts.reviewOpened || shownAnswers }} onRetry={preview ? null : retry} onOpenReview={openReview} />
          {error && <ErrorNote error={error} />}
        </>
      );
    }
    const hidden = left > 0 && !attempts.reviewOpened && !shownAnswers;
    return (
      <>
        <ScoreBar marks={marks} />
        {maxAttempts > 1 && <p className="form-help">Attempt {attempts.used} of {maxAttempts}{history.length ? ` · earlier: ${history.map((h) => (h.score ? `${h.score.percent}%` : '—')).join(', ')}` : ''}</p>}
        {hidden ? (
          <div className="hub-actions">
            {!preview && <button type="button" className="btn btn-primary" onClick={retry}><Icon name="refresh" size={16} /> Try again ({left} left)</button>}
            <button type="button" className="btn btn-secondary" onClick={openReview}>Show answers</button>
          </div>
        ) : (
          <>
            <p className="form-help">Submitted {formatDate(sub.submitted_at, true)}. Correct answers are shown in green.</p>
            <QuizView payload={a.payload} answers={sub.data.answers} review={{ key: key.data.key, marks, manual: sub.marking?.manual }} />
          </>
        )}
        {error && <ErrorNote error={error} />}
      </>
    );
  }

  if (sat) {
    const view = (
      <SatTake a={a} answers={answers} setAnswer={(id, v) => setAnswers((x) => ({ ...x, [id]: v }))} busy={busy || preview} onSubmit={submit} onTimeUp={preview ? undefined : () => send()}
        warning={guard.integrity?.leaves ? <span className="pill pill-amber">Warning used: next leave submits</span> : null} />
    );
    return (
      <>
        <GuardFrame g={guard} title={a.title} bare>{guard.on ? view : <div className="sat-inline">{view}</div>}</GuardFrame>
        {error && <ErrorNote error={error} />}
      </>
    );
  }

  return (
    <GuardFrame g={guard} title={a.title}>
      <QuizView payload={a.payload} answers={answers} setAnswer={(id, v) => setAnswers((x) => ({ ...x, [id]: v }))} />
      <div className="card uw-foot qz-foot">
        <span><strong>{answered}</strong> of {total} answered</span>
        <button type="button" className="btn btn-primary" disabled={busy || preview} onClick={submit}>{busy ? 'Submitting…' : 'Submit test'}</button>
      </div>
      {error && <ErrorNote error={error} />}
    </GuardFrame>
  );
}

// Teacher: one student's marked test, points for open answers, feedback.
// Earlier attempts are read-only; the latest (if submitted) can be marked.
export function QuizReview({ a, sub, onDone }) {
  const history = sub.data?.attempts || [];
  const current = sub.status === 'submitted';
  const [pick, setPick] = useState(current ? history.length : history.length - 1);
  if (pick < history.length) {
    const h = history[pick];
    const m = markTest(a.payload, a.quizKey || {}, h.answers || {}, h.manual || {});
    return (
      <div className="hub-review">
        <AttemptTabs history={history} current={current} pick={pick} setPick={setPick} />
        <p className="form-help">Attempt {pick + 1}{h.submitted_at ? ` · submitted ${formatDate(h.submitted_at, true)}` : ''}</p>
        <IntegrityNote sub={{ data: { integrity: h.integrity } }} />
        <ScoreBar marks={m} />
        <QuizView payload={a.payload} answers={h.answers || {}} review={{ key: a.quizKey, marks: m, manual: h.manual }} />
      </div>
    );
  }
  return <QuizMarking a={a} sub={sub} onDone={onDone} tabs={history.length ? <AttemptTabs history={history} current={current} pick={pick} setPick={setPick} /> : null} />;
}

function AttemptTabs({ history, current, pick, setPick }) {
  const n = history.length + (current ? 1 : 0);
  return (
    <div className="hub-tabs qz-attempt-tabs">
      {Array.from({ length: n }, (_, i) => {
        const score = i < history.length ? history[i].score : null;
        return (
          <button key={i} type="button" className={`chip${pick === i ? ' is-selected' : ''}`} onClick={() => setPick(i)}>
            Attempt {i + 1}{score ? ` · ${score.percent}%` : i === history.length ? ' (latest)' : ''}
          </button>
        );
      })}
      {!current && <span className="form-help">Attempt {history.length + 1} in progress</span>}
    </div>
  );
}

function QuizMarking({ a, sub, onDone, tabs }) {
  const [manual, setManual] = useState(() => ({ ...(sub.marking?.manual || {}) }));
  const [feedback, setFeedback] = useState(sub.feedback || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const marks = useMemo(() => markTest(a.payload, a.quizKey || {}, sub.data?.answers || {}, manual), [a, sub, manual]);
  const save = async () => {
    setBusy(true); setError(null);
    try {
      await api.reviewSubmission(sub.id, null, feedback, {
        manual, score: { earned: marks.earned, possible: marks.possible, percent: marks.percent },
      });
      onDone();
    } catch (err) { setError(err); setBusy(false); }
  };
  if (!a.quizKey) return <ErrorNote error={{ message: "The answer key couldn't be loaded." }} />;
  return (
    <div className="hub-review">
      {tabs}
      <IntegrityNote sub={sub} />
      <ScoreBar marks={marks} />
      <QuizView payload={a.payload} answers={sub.data?.answers || {}}
        review={{ key: a.quizKey, marks, manual, setManual: (id, v) => setManual((m) => ({ ...m, [id]: v })) }} />
      <div className="form-field" style={{ marginTop: 14 }}>
        <label className="form-label" htmlFor={`fb-${sub.id}`}>Feedback (optional)</label>
        <textarea id={`fb-${sub.id}`} className="form-textarea" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </div>
      {error && <ErrorNote error={error} />}
      <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : sub.reviewed_at ? 'Update marks' : marks.pendingManual ? 'Save marks' : 'Confirm score'}
      </button>
    </div>
  );
}
