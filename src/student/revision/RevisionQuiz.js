import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '../../components/ui/icons';
import { useHub, PageTitle, Seg, Bar } from '../ui';
import { confirmDialog } from '../dialog';
import bank from '../../data/revision/q1-revision.json';
import { GROUPS, buildRun, isCorrect, answerText, score, readBest, saveBest } from './revision';

// Quarter 1 Revision Quiz (Junior / Senior). Practice mode gives feedback after
// each question; Test mode marks everything at the end. The results screen
// breaks the score down by topic and shows a tip for every weak topic.

const QUIZ_ID = 'q1';
const TEST_MINUTES = 20;
const CHOICE_TYPES = ['mc', 'fix', 'tf', 'tfng'];
const topicsFor = (group) => Object.keys(bank.topics).filter((k) => bank.topics[k].group === group);

// "___" in a prompt shown as a visible blank.
function Prompt({ text }) {
  const parts = text.split('___');
  return (
    <p className="rv-prompt">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 && <span className="rv-blank" aria-label="blank">&nbsp;</span>}
        </React.Fragment>
      ))}
    </p>
  );
}

function Verdict({ ok, given }) {
  if (ok) return <span className="rv-verdict is-right"><Icon name="checkCircle" size={15} /> Correct</span>;
  return <span className="rv-verdict is-wrong"><Icon name="xCircle" size={15} /> {given ? 'Wrong' : 'Not answered'}</span>;
}

function Passage({ id, open, onToggle }) {
  const p = bank.passages[id];
  return (
    <details className="card rv-passage" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary><Icon name="bookOpen" size={15} /> <span>Reading: {p.title}</span><Icon name="chevronDown" size={15} className="rv-chev" /></summary>
      <p>{p.text}</p>
    </details>
  );
}

// ── Start screen ───────────────────────────────────────────────────────────
function Start({ uid, onStart, initial }) {
  const [group, setGroup] = useState(initial.group);
  const [mode, setMode] = useState(initial.mode);
  const [timed, setTimed] = useState(false);
  const [topics, setTopics] = useState(() => topicsFor(initial.group));
  const best = useMemo(() => readBest(QUIZ_ID, uid), [uid]);

  const pickGroup = (g) => { setGroup(g); setTopics(topicsFor(g)); };
  const toggleTopic = (k) => setTopics((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k]));
  const all = topicsFor(group);
  const count = bank.questions.filter((q) => q.group === group && topics.includes(q.topic)).length;

  return (
    <div className="rv">
      <PageTitle eyebrow="Revision" title={bank.title} lead="Choose your group and a mode. Your results show which topics to revise." />
      <div className="card rv-setup">
        <fieldset className="rv-field">
          <legend>Group</legend>
          <div className="rv-groups">
            {GROUPS.map((g) => {
              const b = best[g.value];
              return (
                <button key={g.value} type="button" className={`rv-choice${group === g.value ? ' is-on' : ''}`} aria-pressed={group === g.value} onClick={() => pickGroup(g.value)}>
                  <strong>{g.label}</strong>
                  <small>{g.level}</small>
                  <small>{b ? `Best: ${b.correct}/${b.total} (${b.pct}%)` : 'No score yet'}</small>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="rv-field">
          <legend>Mode</legend>
          <Seg label="Mode" value={mode} onChange={setMode} options={[
            { value: 'practice', label: 'Practice', icon: 'lightbulb' },
            { value: 'test', label: 'Test', icon: 'flag' },
          ]} />
          <p className="rv-hint">
            {mode === 'practice'
              ? 'You see the answer and an explanation after each question.'
              : 'No feedback until the end. You can change answers until you submit.'}
          </p>
          {mode === 'test' && (
            <label className="rv-check">
              <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
              <span>{TEST_MINUTES}-minute timer</span>
            </label>
          )}
        </fieldset>

        <fieldset className="rv-field">
          <legend>Topics</legend>
          <div className="rv-topics">
            {all.map((k) => (
              <label key={k} className="rv-check">
                <input type="checkbox" checked={topics.includes(k)} onChange={() => toggleTopic(k)} />
                <span>{bank.topics[k].name}</span>
              </label>
            ))}
          </div>
          <div className="hub-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTopics(all)} disabled={topics.length === all.length}>Select all</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTopics([])} disabled={!topics.length}>Clear</button>
          </div>
        </fieldset>

        <button type="button" className="btn btn-primary rv-start" disabled={!count}
          onClick={() => onStart({ group, mode, timed: mode === 'test' && timed, topics, full: topics.length === all.length })}>
          Start · {count} question{count === 1 ? '' : 's'} <Icon name="arrowRight" size={15} />
        </button>
      </div>
    </div>
  );
}

// ── One question ───────────────────────────────────────────────────────────
function Question({ item, value, locked, showResult, onChoose, onType, onCheck }) {
  const { q, options } = item;
  const input = useRef(null);
  useEffect(() => { if (q.type === 'gap' && !locked) input.current?.focus({ preventScroll: true }); }, [q, locked]);
  const ok = isCorrect(q, value);

  return (
    <div className="card rv-q">
      <div className="rv-q-head">
        <span className="rv-topic">{bank.topics[q.topic].name}</span>
      </div>
      {q.type === 'fix' ? (
        <>
          <p className="rv-ask">Which sentence is correct?</p>
          <p className="rv-wrongline"><Icon name="xCircle" size={15} /><span><span className="sr-only">Sentence with a mistake: </span>{q.prompt}</span></p>
        </>
      ) : (
        <>
          {(q.type === 'tf' || q.type === 'tfng') && <p className="rv-ask">{q.type === 'tf' ? 'True or False?' : 'True, False or Not Given?'}</p>}
          {q.type === 'gap' && <p className="rv-ask">Type the missing word(s).</p>}
          <Prompt text={q.prompt} />
        </>
      )}

      {CHOICE_TYPES.includes(q.type) && (
        <div className={`rv-options${q.type === 'tf' || q.type === 'tfng' ? ' rv-options--row' : ''}`} role="group" aria-label="Answer options">
          {options.map((o, i) => {
            const picked = value === o;
            const key = o === q.answer;
            let cls = picked ? ' is-on' : '';
            let mark = null;
            if (showResult && key) { cls = ' is-right'; mark = <><Icon name="check" size={15} /><span className="sr-only"> (correct answer)</span></>; }
            else if (showResult && picked) { cls = ' is-wrong'; mark = <><Icon name="close" size={15} /><span className="sr-only"> (your answer, wrong)</span></>; }
            return (
              <button key={o} type="button" className={`rv-opt${cls}`} aria-pressed={picked} disabled={locked} onClick={() => onChoose(o)}>
                <kbd aria-hidden="true">{i + 1}</kbd><span className="rv-opt-text">{o}</span>{mark}
              </button>
            );
          })}
        </div>
      )}

      {q.type === 'gap' && (
        <form className="rv-gap" onSubmit={(e) => { e.preventDefault(); if (onCheck && value?.trim()) onCheck(); }}>
          <label className="sr-only" htmlFor={`gap-${q.id}`}>Your answer</label>
          <input id={`gap-${q.id}`} ref={input} className={`form-input${showResult ? (ok ? ' is-right' : ' is-wrong') : ''}`}
            value={value || ''} onChange={(e) => onType(e.target.value)} disabled={locked}
            placeholder="Type your answer" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false" />
          {onCheck && !locked && <button className="btn btn-primary" disabled={!value?.trim()}>Check</button>}
        </form>
      )}

      {showResult && (
        <div className={`rv-feedback ${ok ? 'is-right' : 'is-wrong'}`} role="status">
          <Verdict ok={ok} given={value} />
          {!ok && <p><strong>Answer:</strong> {answerText(q)}</p>}
          <p>{q.explain}</p>
        </div>
      )}
    </div>
  );
}

// ── Quiz run ───────────────────────────────────────────────────────────────
function Run({ settings, run, onFinish, onQuit }) {
  const practice = settings.mode === 'practice';
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [passageOpen, setPassageOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 640);
  const [endAt] = useState(() => (settings.timed ? Date.now() + TEST_MINUTES * 60000 : null));
  const [now, setNow] = useState(Date.now());
  const topRef = useRef(null);
  const finished = useRef(false);

  const item = run[idx];
  const { q } = item;
  const locked = practice && Boolean(checked[q.id]);
  const answeredCount = run.filter(({ q: x }) => (answers[x.id] || '').trim()).length;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish(answers);
  }, [answers, onFinish]);

  // Timer (Test mode, optional). Submits when time runs out.
  const left = endAt ? Math.max(0, endAt - now) : null;
  useEffect(() => {
    if (!endAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endAt]);
  useEffect(() => { if (left === 0) finish(); }, [left, finish]);

  const move = (n) => {
    setIdx(n);
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const choose = useCallback((o) => {
    if (locked) return;
    setAnswers((a) => ({ ...a, [q.id]: o }));
    if (practice) setChecked((c) => ({ ...c, [q.id]: true }));
  }, [locked, practice, q.id]);

  // Keys 1–4 pick an option (not while typing).
  useEffect(() => {
    if (!CHOICE_TYPES.includes(q.type)) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= item.options.length) choose(item.options[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q.type, item.options, choose]);

  const submit = async () => {
    const missing = run.length - answeredCount;
    if (!practice && missing > 0) {
      const go = await confirmDialog({
        title: 'Submit the test?',
        body: `${missing} question${missing === 1 ? ' is' : 's are'} not answered. Unanswered questions count as wrong.`,
        confirmLabel: 'Submit',
      });
      if (!go) return;
    }
    finish();
  };

  const quit = async () => {
    if (answeredCount && !await confirmDialog({ title: 'Leave the quiz?', body: 'Your answers will not be saved.', confirmLabel: 'Leave', danger: true })) return;
    onQuit();
  };

  const last = idx === run.length - 1;
  const mm = left != null ? `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}` : null;

  return (
    <div className="rv" ref={topRef}>
      <div className="rv-bar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={quit}><Icon name="close" size={14} /> Quit</button>
        <span className="rv-count" aria-live="polite">Question {idx + 1} of {run.length}</span>
        {mm && <span className={`rv-timer${left < 120000 ? ' is-low' : ''}`} role="timer" aria-label={`Time left ${mm}`}><Icon name="clock" size={14} /> {mm}</span>}
        <span className="rv-mode">{practice ? 'Practice' : 'Test'}</span>
      </div>
      <div className="rv-progress" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={run.length} aria-valuenow={idx + 1}>
        <span style={{ width: `${((idx + 1) / run.length) * 100}%` }} />
      </div>

      {q.passage && <Passage id={q.passage} open={passageOpen} onToggle={setPassageOpen} />}

      <Question
        key={q.id}
        item={item}
        value={answers[q.id]}
        locked={locked}
        showResult={locked}
        onChoose={choose}
        onType={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
        onCheck={practice ? () => setChecked((c) => ({ ...c, [q.id]: true })) : null}
      />

      <div className="rv-nav">
        <button type="button" className="btn" disabled={idx === 0} onClick={() => move(idx - 1)}>
          <Icon name="arrowLeft" size={15} /> Previous
        </button>
        {last ? (
          <button type="button" className="btn btn-primary" onClick={submit}>
            {practice ? 'See results' : 'Submit test'} <Icon name="check" size={15} />
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => move(idx + 1)}>
            Next <Icon name="arrowRight" size={15} />
          </button>
        )}
      </div>
      {!practice && !last && (
        <p className="rv-hint rv-center">
          {answeredCount} of {run.length} answered · <button type="button" className="rv-link" onClick={submit}>Submit now</button>
        </p>
      )}
    </div>
  );
}

// ── Results ────────────────────────────────────────────────────────────────
function Results({ settings, result, newBest, onRetryWrong, onRestart }) {
  const [filter, setFilter] = useState(result.wrongIds.length ? 'wrong' : 'all');
  const rows = filter === 'wrong' ? result.rows.filter((r) => !r.ok) : result.rows;
  const group = GROUPS.find((g) => g.value === settings.group);

  return (
    <div className="rv">
      <PageTitle eyebrow={`${group.label} · ${settings.retry ? 'Wrong answers' : settings.mode === 'practice' ? 'Practice' : 'Test'}`} title="Your results" />

      <div className="card rv-score">
        <div className="rv-score-num"><strong>{result.correct}/{result.total}</strong><span>{result.pct}%</span></div>
        <p>
          {newBest ? <><Icon name="award" size={15} /> New best score for {group.label}.</>
            : result.pct >= 70 ? 'Well done.' : 'Look at the topics below to see what to revise.'}
        </p>
      </div>

      <section className="card rv-section">
        <h2>Score by topic</h2>
        <ul className="rv-topicrows">
          {result.byTopic.map((t) => {
            const weak = t.pct < 0.7;
            return (
              <li key={t.key} className={weak ? 'is-weak' : ''}>
                <span className="rv-topicname">{t.name}</span>
                <span className="rv-topicscore">
                  <Bar value={t.pct * 100} />
                  <strong>{t.correct}/{t.total}</strong>
                  {weak
                    ? <span className="rv-tag is-weak"><Icon name="xCircle" size={13} /> Revise</span>
                    : <span className="rv-tag is-ok"><Icon name="checkCircle" size={13} /> Good</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {result.weak.length > 0 && (
        <section className="card rv-section">
          <h2>What to revise</h2>
          <div className="rv-tips">
            {result.weak.map((t) => (
              <div key={t.key} className="rv-tip">
                <strong><Icon name="lightbulb" size={15} /> {t.name}</strong>
                <p>{t.tip}</p>
                {settings.group === 'junior' && t.uz && <p className="rv-uz" lang="uz">{t.uz}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="hub-actions">
        <button type="button" className="btn btn-primary" disabled={!result.wrongIds.length} onClick={onRetryWrong}>
          <Icon name="refresh" size={15} /> Retry wrong answers only{result.wrongIds.length ? ` (${result.wrongIds.length})` : ''}
        </button>
        <button type="button" className="btn" onClick={onRestart}>New quiz</button>
      </div>

      <section className="rv-section rv-review">
        <div className="hub-section-head">
          <h2>Review</h2>
          <Seg label="Show" value={filter} onChange={setFilter} options={[
            { value: 'wrong', label: `Wrong (${result.wrongIds.length})` },
            { value: 'all', label: `All (${result.total})` },
          ]} />
        </div>
        {!rows.length && <p className="rv-hint">No wrong answers. Nothing to review.</p>}
        <ol className="rv-reviewlist">
          {rows.map(({ q, given, ok }) => (
            <li key={q.id} className={`card rv-rrow ${ok ? 'is-right' : 'is-wrong'}`}>
              <div className="rv-rrow-head">
                <Verdict ok={ok} given={given} />
                <span className="rv-topic">{bank.topics[q.topic].name}</span>
              </div>
              {q.type === 'fix' && <p className="rv-ask">Which sentence is correct? <span className="rv-muted">({q.prompt})</span></p>}
              {q.type !== 'fix' && <Prompt text={q.prompt} />}
              {q.passage && <p className="rv-muted">Passage: {bank.passages[q.passage].title}</p>}
              <dl className="rv-answers">
                <dt>Your answer</dt><dd className={ok ? 'is-right' : 'is-wrong'}>{given || '—'}</dd>
                {!ok && <><dt>Correct answer</dt><dd className="is-right">{answerText(q)}</dd></>}
              </dl>
              <p className="rv-explain">{q.explain}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function RevisionQuiz() {
  const { user, preview } = useHub();
  const uid = user?.id;
  const [stage, setStage] = useState('start');
  const [settings, setSettings] = useState({ group: 'junior', mode: 'practice' });
  const [run, setRun] = useState(null);
  const [result, setResult] = useState(null);
  const [newBest, setNewBest] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const begin = (s, ids = null) => {
    setSettings(s);
    setRun(buildRun(bank, { group: s.group, topics: ids ? null : s.topics, ids }));
    setResult(null);
    setNewBest(false);
    setRunKey((k) => k + 1);
    setStage('quiz');
    window.scrollTo(0, 0);
  };

  const finish = useCallback((answers) => {
    const r = score(bank, run, answers);
    setResult(r);
    // Only a full run of the group counts as a best score (not a topic subset or a retry).
    setNewBest(settings.full && !settings.retry && !preview ? saveBest(QUIZ_ID, uid, settings.group, r) : false);
    setStage('results');
    window.scrollTo(0, 0);
  }, [run, settings, preview, uid]);

  if (stage === 'quiz' && run) {
    return <Run key={runKey} settings={settings} run={run} onFinish={finish} onQuit={() => setStage('start')} />;
  }
  if (stage === 'results' && result) {
    return (
      <Results settings={settings} result={result} newBest={newBest}
        onRetryWrong={() => begin({ ...settings, retry: true, full: false }, result.wrongIds)}
        onRestart={() => setStage('start')} />
    );
  }
  return <Start uid={uid} initial={settings} onStart={(s) => begin(s)} />;
}
