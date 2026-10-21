import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../components/ui/icons';

// Flip-card study session. Cards marked "Again" go to the back of the queue;
// the session ends once every card has been marked "Got it".
//   cards: [{ f, b }]   onFinish({ total, reviews })
export default function FlashcardStudy({ cards, onFinish, onExit }) {
  const [queue, setQueue] = useState(() => cards.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [reviews, setReviews] = useState(0);

  const current = queue[0];
  const known = cards.length - queue.length;

  const answer = useCallback((gotIt) => {
    if (current === undefined) return;
    setReviews((r) => r + 1);
    setFlipped(false);
    setQueue((q) => (gotIt ? q.slice(1) : [...q.slice(1), q[0]]));
  }, [current]);

  useEffect(() => {
    if (cards.length && queue.length === 0) onFinish?.({ total: cards.length, reviews });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && (e.key === 'ArrowRight' || e.key === '2')) answer(true);
      else if (flipped && (e.key === 'ArrowLeft' || e.key === '1')) answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, answer]);

  if (!cards.length) return <p className="body">This deck has no cards.</p>;

  if (current === undefined) {
    return (
      <div className="card hub-empty">
        <div className="coming-soon-icon"><Icon name="checkCircle" size={28} /></div>
        <h2>Deck complete</h2>
        <p>You went through all {cards.length} cards in {reviews} reviews.</p>
        <div className="hub-actions">
          <button type="button" className="btn btn-secondary" onClick={() => { setQueue(cards.map((_, i) => i)); setReviews(0); }}>
            <Icon name="refresh" size={16} /> Study again
          </button>
          {onExit && <button type="button" className="btn btn-primary" onClick={onExit}>Done</button>}
        </div>
      </div>
    );
  }

  const card = cards[current];
  return (
    <div className="fc">
      <div className="fc-meta">
        <span>{known} / {cards.length} known</span>
        <span className="hub-bar"><span style={{ width: `${(known / cards.length) * 100}%` }} /></span>
      </div>
      <button type="button" className={`fc-card${flipped ? ' is-flipped' : ''}`} onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Show front' : 'Show answer'}>
        <span className="fc-side">{flipped ? 'Answer' : 'Front'}</span>
        <span className="fc-text">{flipped ? card.b : card.f}</span>
        {!flipped && <span className="fc-hint">Tap or press Space to flip</span>}
      </button>
      <div className="fc-actions">
        <button type="button" className="btn btn-secondary" disabled={!flipped} onClick={() => answer(false)}>Again</button>
        <button type="button" className="btn btn-primary" disabled={!flipped} onClick={() => answer(true)}>Got it</button>
      </div>
    </div>
  );
}
