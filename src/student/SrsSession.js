import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { preview, formatInterval, buildQueue, nextCard, endOfStudyDay, STATE } from './fsrs';
import { useHub, Spinner, ErrorNote, NoPaste } from './ui';
import { taskFor, markAnswer, ratingFor, BLANK } from './recall';

const RATINGS = [
  { g: 1, label: 'Again', key: '1', cls: 'fc-again' },
  { g: 2, label: 'Hard', key: '2', cls: 'fc-hard' },
  { g: 3, label: 'Good', key: '3', cls: 'fc-good' },
  { g: 4, label: 'Easy', key: '4', cls: 'fc-easy' },
];

const isLearning = (c) => c.state === STATE.LEARNING || c.state === STATE.RELEARNING;

// One study session over today's queue (optionally a single deck). Every rating
// is scheduled with FSRS and saved immediately, so closing the tab loses nothing.
// New words are met in context; after that students type answers (recall, gap,
// word form, collocation) and the result sets the rating (see recall.js).
// Long phrases stay as classic flip-and-rate cards.

const RESULT_TEXT = { correct: 'Correct', almost: 'Almost', wrong: 'Not quite' };

// Show a sentence with the blank as a styled gap (or the answer filled in).
function Sentence({ text, fill }) {
  if (!text) return null;
  const [before, after] = text.split(BLANK);
  return (
    <p className="rc-sentence">
      {before}
      {after !== undefined && (fill ? <mark className="rc-fill">{fill}</mark> : <span className="rc-blank" aria-label="blank">&nbsp;</span>)}
      {after}
    </p>
  );
}

// The example sentence with the word itself highlighted.
function Highlight({ text, word }) {
  if (!text) return null;
  const i = word ? text.toLowerCase().indexOf(word.toLowerCase()) : -1;
  if (i < 0) return <p className="rc-sentence">{text}</p>;
  return <p className="rc-sentence">{text.slice(0, i)}<mark className="rc-fill">{text.slice(i, i + word.length)}</mark>{text.slice(i + word.length)}</p>;
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

  if (!card) {
    const later = pools.learning[0];
    const finish = () => { flushDecks(); onExit?.(); };
    return (
      <div className="card hub-empty">
        <div className="coming-soon-icon"><Icon name={later ? 'clock' : 'checkCircle'} size={28} /></div>
        {later ? (
          <>
            <h2>Almost there</h2>
            <p>{counts.learning} card{counts.learning > 1 ? 's' : ''} coming back in {formatInterval(new Date(later.due) - now)}. Keep this page open, or come back later.</p>
          </>
        ) : (
          <>
            <h2>{studied ? 'Done for today' : 'Nothing due'}</h2>
            <p>{studied ? `You reviewed ${studied} card${studied > 1 ? 's' : ''}. ` : ''}New words and due reviews will show up here.</p>
          </>
        )}
        {onExit && <button type="button" className="btn btn-primary" onClick={finish}>Back to flashcards</button>}
      </div>
    );
  }

  return (
    <NoPaste>
    <div className="fc">
      <div className="fc-meta">
        <span className="fc-counts" aria-label="Cards left">
          <span className="fc-count fc-count--new" title="New">{counts.fresh}</span>
          <span className="fc-count fc-count--learn" title="Learning">{counts.learning}</span>
          <span className="fc-count fc-count--review" title="To review">{counts.reviews}</span>
        </span>
        <span>{studied} studied</span>
      </div>
      {saveError && <ErrorNote error={{ message: `Couldn't save a review: ${saveError.message}. Check your connection.` }} />}
      {task.mode === 'meet' && (
        <div className="fc-card rc-card">
          <span className="fc-badge">New word</span>
          <span className="fc-text fc-front">{card.front}</span>
          <span className="rc-meaning">{card.back}</span>
          <Highlight text={task.reveal.sentence} word={card.front} />
          <div className="rc-actions">
            <button type="button" className="btn btn-secondary" onClick={() => rate(4)}>I know it already</button>
            <button type="button" className="btn btn-primary" onClick={() => rate(3)} autoFocus>Got it <kbd>Enter</kbd></button>
          </div>
        </div>
      )}

      {typedMode && (
        <form className={`fc-card rc-card${result ? ` is-${result.result}` : ''}`} onSubmit={(e) => { e.preventDefault(); if (result) rate(result.rating); else check(); }}>
          <span className="fc-badge">{task.label}</span>
          {task.prompt && <span className="rc-prompt">{task.prompt}</span>}
          {result
            ? <Sentence text={task.sentence} fill={task.answers[0]} />
            : <Sentence text={task.sentence} />}
          <input ref={inputRef} className={`form-input rc-input${result ? ` is-${result.result}` : ''}`} value={typed}
            onChange={(e) => setTyped(e.target.value)} readOnly={Boolean(result)} placeholder="Type your answer"
            aria-label="Your answer" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
          {!result ? (
            <div className="rc-actions">
              <button type="button" className="btn btn-ghost" onClick={() => check(true)}>I don't know</button>
              <button type="submit" className="btn btn-primary" disabled={!typed.trim()}>Check <kbd>Enter</kbd></button>
            </div>
          ) : (
            <>
              <div className={`rc-result rc-result--${result.result}`} role="status">
                <Icon name={result.result === 'correct' ? 'checkCircle' : result.result === 'almost' ? 'edit' : 'xCircle'} size={16} />
                <strong>{result.gaveUp ? 'Answer' : RESULT_TEXT[result.result]}</strong>
                <span className="rc-answer">{task.answers[0]}</span>
                {task.answers.length > 1 && task.mode === 'coll' && <small>also: {task.answers.slice(1).join(', ')}</small>}
              </div>
              <div className="rc-reveal">
                <span><strong>{card.front}</strong> · {card.back}</span>
                {task.mode !== 'gap' && task.reveal.sentence && task.mode !== 'form' && task.mode !== 'coll' && <Highlight text={task.reveal.sentence} word={card.front} />}
              </div>
              <div className="rc-actions">
                {result.result !== 'correct' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => rate(3)}>I was right</button>
                )}
                <button type="submit" className="btn btn-primary" autoFocus>
                  Continue <small className="rc-next">{formatInterval(options[result.rating].scheduled_ms)}</small>
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {task.mode === 'flip' && (
        <>
          <button type="button" className={`fc-card${flipped ? ' is-flipped' : ''}`} onClick={() => setFlipped(true)} aria-label={flipped ? 'Answer shown' : 'Show answer'}>
            <span className="fc-text fc-front">{card.front}</span>
            {flipped
              ? <><span className="fc-divider" /><span className="fc-text fc-back">{card.back}</span></>
              : <span className="fc-hint">Tap or press Space to show the answer</span>}
          </button>
          {flipped ? (
            <div className="fc-ratings">
              {RATINGS.map((r) => (
                <button key={r.g} type="button" className={`btn fc-rate ${r.cls}`} onClick={() => rate(r.g)}>
                  <small>{formatInterval(options[r.g].scheduled_ms)}</small>
                  {r.label}
                </button>
              ))}
            </div>
          ) : (
            <button type="button" className="btn btn-primary fc-show" onClick={() => setFlipped(true)}>Show answer</button>
          )}
        </>
      )}
    </div>
    </NoPaste>
  );
}
