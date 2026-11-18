import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { preview, formatInterval, buildQueue, nextCard, endOfStudyDay, STATE } from './fsrs';
import { useHub, Spinner, ErrorNote, NoPaste } from './ui';
import { SessionTop, FlipCard, SpeakButton, KeyHints, DoneScreen } from './cardKit';
import { taskFor, markAnswer, ratingFor, BLANK } from './recall';

const RATINGS = [
  { g: 1, label: 'Again', key: '1', cls: 'fcx-rate--again' },
  { g: 2, label: 'Hard', key: '2', cls: 'fcx-rate--hard' },
  { g: 3, label: 'Good', key: '3', cls: 'fcx-rate--good' },
  { g: 4, label: 'Easy', key: '4', cls: 'fcx-rate--easy' },
];

const isLearning = (c) => c.state === STATE.LEARNING || c.state === STATE.RELEARNING;

// One study session over today's queue (optionally a single deck). Every rating
// is scheduled with FSRS and saved immediately, so closing the tab loses nothing.
// New words are met in context; after that students type answers (recall, gap,
// word form, collocation) and the result sets the rating (see recall.js).
// Long phrases stay as classic flip-and-rate cards.

const RESULT_TEXT = { correct: 'Correct!', almost: 'Almost — mind the spelling', wrong: 'Not quite' };
const RESULT_TONE = { correct: 'success', almost: 'warn', wrong: 'danger' };

// Show a sentence with the blank as a styled gap (or the answer filled in).
function Sentence({ text, fill }) {
  if (!text) return null;
  const [before, after] = text.split(BLANK);
  return (
    <p className="fcx-sentence">
      {before}
      {after !== undefined && (fill ? <mark className="fcx-mark">{fill}</mark> : <span className="fcx-blank" aria-label="blank">&nbsp;</span>)}
      {after}
    </p>
  );
}

// The example sentence with the word itself highlighted.
function Highlight({ text, word }) {
  if (!text) return null;
  const i = word ? text.toLowerCase().indexOf(word.toLowerCase()) : -1;
  if (i < 0) return <p className="fcx-sentence">{text}</p>;
  return <p className="fcx-sentence">{text.slice(0, i)}<mark className="fcx-mark">{text.slice(i, i + word.length)}</mark>{text.slice(i + word.length)}</p>;
}
export default function SrsSession({ deck, onExit }) {
  const { user } = useHub();
  const [pools, setPools] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null); // { result, rating } after a typed answer
  const inputRef = useRef(null);
  const [studied, setStudied] = useState(0);
  const [remembered, setRemembered] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const shownAt = useRef(Date.now());
  const dirtyDecks = useRef(new Set());

  useEffect(() => {
    let live = true;
    api.srsDueCards(user.id, endOfStudyDay(), deck)
      .then((cards) => live && setPools(buildQueue(cards)))
      .catch((err) => live && setLoadError(err));
    return () => { live = false; };
  }, [user.id, deck]);

  // Tick so learning cards come back when their step elapses.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const flushDecks = useCallback(() => {
    const ids = [...dirtyDecks.current];
    dirtyDecks.current.clear();
    ids.forEach((id) => api.syncDeckProgress(id, user.id).catch(() => {}));
  }, [user.id]);
  useEffect(() => () => flushDecks(), [flushDecks]);

  const card = pools ? nextCard(pools, now) : null;
  const options = useMemo(() => (card ? preview(card, new Date()) : null), [card]);

  const task = useMemo(() => (card ? taskFor(card) : null), [card]);
  useEffect(() => {
    shownAt.current = Date.now();
    setFlipped(false); setTyped(''); setResult(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [card?.id, card?.reps, card?.state]);

  // Queue empty (or only waiting on learning steps): record deck progress now.
  const idle = Boolean(pools) && !card;
  useEffect(() => {
    if (!idle) return;
    flushDecks();
    // Whole queue done (nothing waiting on a learning step): claim the bonus; the server re-checks.
    if (studied > 0 && !pools.learning.length && !deck) api.claimQueueCleared().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idle, flushDecks]);

  const rate = useCallback((g) => {
    if (!card) return;
    const reviewedAt = new Date();
    const next = preview(card, reviewedAt)[g];
    const duration = Date.now() - shownAt.current;
    setPools((p) => {
      const without = (list) => list.filter((c) => c.id !== card.id);
      const learning = without(p.learning);
      if (isLearning(next) && new Date(next.due) <= endOfStudyDay(reviewedAt)) {
        learning.push(next);
        learning.sort((a, b) => a.due.localeCompare(b.due));
      }
      return { fresh: without(p.fresh), reviews: without(p.reviews), learning };
    });
    setStudied((n) => n + 1);
    if (g > 1) setRemembered((n) => n + 1);
    setNow(reviewedAt);
    api.saveReview(card, next, g, duration)
      .then(() => {
        // A new word was learned: update the homework straight away, so closing
        // the tab mid-session can't leave a finished deck marked as not done.
        if (card.state === STATE.NEW && card.assignment_id) {
          api.syncDeckProgress(card.assignment_id, user.id).catch(() => dirtyDecks.current.add(card.assignment_id));
        }
      })
      .catch((err) => setSaveError(err));
  }, [card, user.id]);

  const check = useCallback((giveUp = false) => {
    if (!card || !task?.answers || result) return;
    const r = giveUp ? 'wrong' : markAnswer(typed, task.answers);
    setResult({ result: r, rating: ratingFor(r, Date.now() - shownAt.current, card), gaveUp: giveUp });
  }, [card, task, typed, result]);

  const typedMode = task && ['recall', 'gap', 'form', 'coll'].includes(task.mode);
  useEffect(() => {
    const onKey = (e) => {
      if (typedMode) {
        if (result && e.key === 'Enter') { e.preventDefault(); rate(result.rating); }
        return; // typing goes to the input; Enter there checks
      }
      if (e.target.closest('input, textarea, select')) return;
      if (task?.mode === 'meet') {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); rate(3); }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(true); return; }
      const r = RATINGS.find((x) => x.key === e.key);
      if (r && flipped) rate(r.g);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rate, typedMode, result, task, flipped]);

  if (loadError) return <ErrorNote error={loadError} />;
  if (!pools) return <Spinner />;

  const counts = { fresh: pools.fresh.length, learning: pools.learning.length, reviews: pools.reviews.length };
  const left = counts.fresh + counts.learning + counts.reviews;
  const finish = () => { flushDecks(); onExit?.(); };

  if (!card) {
    const later = pools.learning[0];
    const stats = studied ? [
      { label: 'Cards reviewed', value: studied },
      { label: 'Remembered', value: `${Math.round((remembered / studied) * 100)}%`, tone: 'success' },
    ] : [];
    return later ? (
      <DoneScreen icon="clock" tone="wait" title="Almost there"
        text={`${counts.learning} card${counts.learning > 1 ? 's' : ''} coming back in ${formatInterval(new Date(later.due) - now)}. Keep this page open, or come back later.`}
        stats={stats}>
        {onExit && <button type="button" className="fcx-btn fcx-btn--neutral" onClick={finish}>Back to flashcards</button>}
      </DoneScreen>
    ) : (
      <DoneScreen icon={studied ? 'award' : 'checkCircle'} title={studied ? 'Done for today!' : 'Nothing due'}
        text={studied ? 'Great work. Come back tomorrow to keep your streak going.' : 'New words and due reviews will show up here.'}
        stats={stats}>
        {onExit && <button type="button" className="fcx-btn fcx-btn--primary" onClick={finish}>Back to flashcards</button>}
      </DoneScreen>
    );
  }

  const tone = result ? RESULT_TONE[result.result] : 'primary';
  const stageKey = `${card.id}-${card.reps}-${card.state}`;

  return (
    <NoPaste>
    <div className="fcx">
      <SessionTop progress={studied / (studied + left)} onClose={onExit && finish}>
        <span className="fcx-counts" aria-label={`${counts.fresh} new, ${counts.learning} learning, ${counts.reviews} to review`}>
          <span className="fcx-count fcx-count--new" title="New">{counts.fresh}</span>
          <span className="fcx-count fcx-count--learn" title="Learning">{counts.learning}</span>
          <span className="fcx-count fcx-count--review" title="To review">{counts.reviews}</span>
        </span>
      </SessionTop>
      {saveError && <ErrorNote error={{ message: `Couldn't save a review: ${saveError.message}. Check your connection.` }} />}

      {task.mode === 'meet' && (
        <div className="fcx-stage" key={stageKey}>
          <div className="fcx-card">
            <div className="fcx-card-head">
              <span className="fcx-badge fcx-badge--new"><Icon name="sparkle" size={14} /> New word</span>
              <SpeakButton text={card.front} />
            </div>
            <div className="fcx-card-body">
              <span className="fcx-word">{card.front}</span>
              <span className="fcx-meaning">{card.back}</span>
              {task.reveal.sentence && <div className="fcx-example"><Highlight text={task.reveal.sentence} word={card.front} /></div>}
            </div>
          </div>
          <div className="fcx-actions">
            <button type="button" className="fcx-btn fcx-btn--neutral" onClick={() => rate(4)}>I know it already</button>
            <button type="button" className="fcx-btn fcx-btn--primary" onClick={() => rate(3)} autoFocus>Got it</button>
          </div>
          <KeyHints items={[['Enter', 'Got it']]} />
        </div>
      )}

      {typedMode && (
        <form className="fcx-stage" key={stageKey} onSubmit={(e) => { e.preventDefault(); if (result) rate(result.rating); else check(); }}>
          <div className={`fcx-card${result ? ` is-${result.result}` : ''}`}>
            <div className="fcx-card-head">
              <span className="fcx-badge">{task.label}</span>
              {result && <SpeakButton text={task.reveal.word || card.front} />}
            </div>
            <div className="fcx-card-body">
              {task.prompt && <span className="fcx-prompt">{task.prompt}</span>}
              {result ? <Sentence text={task.sentence} fill={task.answers[0]} /> : <Sentence text={task.sentence} />}
              <input ref={inputRef} className={`fcx-input${result ? ` is-${result.result}` : ''}`} value={typed}
                onChange={(e) => setTyped(e.target.value)} readOnly={Boolean(result)} placeholder="Type your answer"
                aria-label="Your answer" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
            </div>
          </div>
          {!result ? (
            <>
              <div className="fcx-actions">
                <button type="button" className="fcx-btn fcx-btn--neutral" onClick={() => check(true)}>I don't know</button>
                <button type="submit" className="fcx-btn fcx-btn--primary" disabled={!typed.trim()}>Check</button>
              </div>
              <KeyHints items={[['Enter', 'Check']]} />
            </>
          ) : (
            <div className={`fcx-feedback fcx-feedback--${tone}`} role="status">
              <div className="fcx-feedback-head">
                <span className="fcx-feedback-icon">
                  <Icon name={result.result === 'correct' ? 'check' : result.result === 'almost' ? 'edit' : 'close'} size={22} />
                </span>
                <div>
                  <strong>{result.gaveUp ? "Here's the answer" : RESULT_TEXT[result.result]}</strong>
                  <span className="fcx-feedback-answer">
                    {result.result === 'correct' ? 'Answer: ' : 'Correct answer: '}<b>{task.answers[0]}</b>
                    {task.answers.length > 1 && task.mode === 'coll' && <small> · also {task.answers.slice(1).join(', ')}</small>}
                  </span>
                </div>
              </div>
              <p className="fcx-feedback-meaning"><b>{card.front}</b> — {card.back}</p>
              {task.mode === 'recall' && task.reveal.sentence && !task.sentence && (
                <div className="fcx-feedback-example"><Highlight text={task.reveal.sentence} word={card.front} /></div>
              )}
              <div className="fcx-feedback-actions">
                {result.result !== 'correct' && (
                  <button type="button" className="fcx-link" onClick={() => rate(3)}>I was right</button>
                )}
                <button type="submit" className={`fcx-btn fcx-btn--${tone}`} autoFocus>
                  Continue <small className="fcx-next">next in {formatInterval(options[result.rating].scheduled_ms)}</small>
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {task.mode === 'flip' && (
        <div className="fcx-stage" key={stageKey}>
          <div className="fcx-flip-wrap" onClick={() => setFlipped(true)}>
            <FlipCard flipped={flipped} label={flipped ? 'Answer shown' : 'Show answer'}
              front={(
                <>
                  <div className="fcx-card-head"><span className="fcx-badge">Review</span><SpeakButton text={card.front} /></div>
                  <div className="fcx-card-body">
                    <span className="fcx-word">{card.front}</span>
                    <span className="fcx-tap"><Icon name="refresh" size={14} /> Tap to reveal</span>
                  </div>
                </>
              )}
              back={(
                <>
                  <div className="fcx-card-head"><span className="fcx-badge">Answer</span><SpeakButton text={card.front} /></div>
                  <div className="fcx-card-body">
                    <span className="fcx-word fcx-word--sm">{card.front}</span>
                    <span className="fcx-rule" />
                    <span className="fcx-meaning fcx-meaning--lg">{card.back}</span>
                    {task.reveal.sentence && <div className="fcx-example"><Highlight text={task.reveal.sentence} word={card.front} /></div>}
                  </div>
                </>
              )} />
          </div>
          {flipped ? (
            <div className="fcx-ratings">
              {RATINGS.map((r) => (
                <button key={r.g} type="button" className={`fcx-rate ${r.cls}`} onClick={() => rate(r.g)}>
                  <span className="fcx-rate-label">{r.label}</span>
                  <span className="fcx-rate-time">{formatInterval(options[r.g].scheduled_ms)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="fcx-actions fcx-actions--one">
              <button type="button" className="fcx-btn fcx-btn--primary" onClick={() => setFlipped(true)}>Show answer</button>
            </div>
          )}
          <KeyHints items={flipped ? [['1', 'Again'], ['2', 'Hard'], ['3', 'Good'], ['4', 'Easy']] : [['Space', 'Show answer']]} />
        </div>
      )}
    </div>
    </NoPaste>
  );
}
