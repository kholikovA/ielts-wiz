import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { preview, formatInterval, buildQueue, nextCard, endOfStudyDay, STATE } from './fsrs';
import { useHub, Spinner, ErrorNote } from './ui';

const RATINGS = [
  { g: 1, label: 'Again', key: '1', cls: 'fc-again' },
  { g: 2, label: 'Hard', key: '2', cls: 'fc-hard' },
  { g: 3, label: 'Good', key: '3', cls: 'fc-good' },
  { g: 4, label: 'Easy', key: '4', cls: 'fc-easy' },
];

const isLearning = (c) => c.state === STATE.LEARNING || c.state === STATE.RELEARNING;

// One study session over today's queue (optionally a single deck). Every rating
// is scheduled with FSRS and saved immediately, so closing the tab loses nothing.
export default function SrsSession({ deck, onExit }) {
  const { user } = useHub();
  const [pools, setPools] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [flipped, setFlipped] = useState(false);
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

  useEffect(() => { shownAt.current = Date.now(); setFlipped(false); }, [card?.id, card?.reps]);

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
    if (!card || !flipped) return;
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
        if (card.state === STATE.NEW && card.assignment_id) {
          dirtyDecks.current.add(card.assignment_id);
          if (dirtyDecks.current.size && (studied + 1) % 5 === 0) flushDecks();
        }
      })
      .catch((err) => setSaveError(err));
  }, [card, flipped, flushDecks, studied]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(true); return; }
      const r = RATINGS.find((x) => x.key === e.key);
      if (r) rate(r.g);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rate]);

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
      <button type="button" className={`fc-card${flipped ? ' is-flipped' : ''}`} onClick={() => setFlipped(true)} aria-label={flipped ? 'Answer shown' : 'Show answer'}>
        {card.state === STATE.NEW && <span className="fc-badge">New word</span>}
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
    </div>
  );
}
