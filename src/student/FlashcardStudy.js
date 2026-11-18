import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../components/ui/icons';
import { SessionTop, FlipCard, Pronounce, KeyHints, DoneScreen } from './cardKit';

// Flip-card study session. "Still learning" sends a card to the back of the
// queue; the session ends once every card has been marked "Know it".
// Swipe right = know it, swipe left = still learning.
//   cards: [{ f, b, ex? }]   onFinish({ total, reviews })

const SWIPE = 110; // px past which a drag counts as an answer
const order = (n, shuffle) => {
  const ids = Array.from({ length: n }, (_, i) => i);
  if (!shuffle) return ids;
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
};

function Highlight({ text, word }) {
  const i = word ? text.toLowerCase().indexOf(word.toLowerCase()) : -1;
  if (i < 0) return <p className="fcx-sentence">“{text}”</p>;
  return <p className="fcx-sentence">“{text.slice(0, i)}<mark className="fcx-mark">{text.slice(i, i + word.length)}</mark>{text.slice(i + word.length)}”</p>;
}

export default function FlashcardStudy({ cards, onFinish, onExit }) {
  const [shuffle, setShuffle] = useState(false);
  const [subset, setSubset] = useState(null); // indexes being studied (null = all)
  const [queue, setQueue] = useState(() => order(cards.length, false));
  const [flipped, setFlipped] = useState(false);
  const [reviews, setReviews] = useState(0);
  const [missed, setMissed] = useState(() => new Set());
  const [dx, setDx] = useState(0);
  const drag = useRef(null);
  const moved = useRef(false);

  const pool = subset || cards.map((_, i) => i);
  const current = queue[0];
  const known = pool.length - queue.length;

  const answer = useCallback((gotIt) => {
    if (current === undefined) return;
    setReviews((r) => r + 1);
    setFlipped(false);
    if (!gotIt) setMissed((m) => new Set(m).add(current));
    setQueue((q) => (gotIt ? q.slice(1) : [...q.slice(1), q[0]]));
  }, [current]);

  const restart = (ids, shuf = shuffle) => {
    const picked = order(ids.length, shuf).map((i) => ids[i]);
    setSubset(ids.length === cards.length ? null : ids);
    setQueue(picked); setReviews(0); setMissed(new Set()); setFlipped(false);
  };

  useEffect(() => {
    if (cards.length && queue.length === 0) onFinish?.({ total: pool.length, reviews });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === 'ArrowRight' || e.key === '2') answer(true);
      else if (e.key === 'ArrowLeft' || e.key === '1') answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer]);

  if (!cards.length) {
    return <DoneScreen icon="layers" tone="wait" title="No cards yet" text="Save words while reading Articles and they'll appear here." />;
  }

  if (current === undefined) {
    const tricky = [...missed];
    return (
      <DoneScreen icon="award" title="Deck complete!"
        text={tricky.length ? `${tricky.length} word${tricky.length > 1 ? 's' : ''} took more than one try. Give them another round?` : 'You knew every word first time. Brilliant.'}
        stats={[
          { label: 'Words', value: pool.length },
          { label: 'First try', value: `${Math.round(((pool.length - tricky.length) / pool.length) * 100)}%`, tone: 'success' },
        ]}>
        {tricky.length > 0 && (
          <button type="button" className="fcx-btn fcx-btn--primary" onClick={() => restart(tricky)}>
            <Icon name="refresh" size={18} /> Practise {tricky.length} tricky word{tricky.length > 1 ? 's' : ''}
          </button>
        )}
        <button type="button" className={`fcx-btn ${tricky.length ? 'fcx-btn--neutral' : 'fcx-btn--primary'}`} onClick={() => restart(cards.map((_, i) => i))}>
          Study all again
        </button>
        {onExit && <button type="button" className="fcx-link" onClick={onExit}>Back to flashcards</button>}
      </DoneScreen>
    );
  }

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, id: e.pointerId };
    moved.current = false;
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const d = e.clientX - drag.current.x;
    if (!moved.current && Math.abs(d) > 8) {
      moved.current = true;
      e.currentTarget.setPointerCapture?.(drag.current.id);
    }
    if (moved.current) setDx(d);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    const d = dx;
    setDx(0);
    if (Math.abs(d) > SWIPE) answer(d > 0);
  };
  const onClick = () => {
    if (moved.current) { moved.current = false; return; }
    setFlipped((f) => !f);
  };

  const card = cards[current];
  const lean = dx > 40 ? 'know' : dx < -40 ? 'learn' : '';
  const dragStyle = dx ? { transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: 'none' } : undefined;

  return (
    <div className="fcx">
      <SessionTop progress={known / pool.length} onClose={onExit}>
        <span className="fcx-tally"><strong>{known}</strong> / {pool.length}</span>
      </SessionTop>

      <div className="fcx-stage" key={`${current}-${reviews}`}>
        <div className={`fcx-flip-wrap fcx-swipe${lean ? ` is-${lean}` : ''}`} style={dragStyle}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          onClick={onClick}>
          <span className="fcx-stamp fcx-stamp--know" aria-hidden="true">Know it</span>
          <span className="fcx-stamp fcx-stamp--learn" aria-hidden="true">Still learning</span>
          <FlipCard flipped={flipped}
            front={(
              <>
                <div className="fcx-card-head"><span className="fcx-badge">Term</span></div>
                <div className="fcx-card-body">
                  <span className="fcx-word">{card.f}</span>
                  <Pronounce word={card.f} compact />
                  <span className="fcx-tap"><Icon name="refresh" size={14} /> Tap to flip</span>
                </div>
              </>
            )}
            back={(
              <>
                <div className="fcx-card-head"><span className="fcx-badge">Definition</span></div>
                <div className="fcx-card-body">
                  <span className="fcx-word fcx-word--sm">{card.f}</span>
                  <Pronounce word={card.f} />
                  <span className="fcx-rule" />
                  <span className="fcx-meaning fcx-meaning--lg">{card.b || '—'}</span>
                  {card.ex && <div className="fcx-example"><Highlight text={card.ex} word={card.f} /></div>}
                </div>
              </>
            )} />
        </div>

        <div className="fcx-actions">
          <button type="button" className="fcx-btn fcx-btn--learn" onClick={() => answer(false)}>
            <Icon name="close" size={20} /> Still learning
          </button>
          <button type="button" className="fcx-btn fcx-btn--success" onClick={() => answer(true)}>
            <Icon name="check" size={20} /> Know it
          </button>
        </div>
        <div className="fcx-tools">
          <button type="button" className={`fcx-tool${shuffle ? ' is-on' : ''}`} aria-pressed={shuffle}
            onClick={() => {
              const next = !shuffle;
              setShuffle(next);
              setFlipped(false);
              // Reorder only what's left, so progress isn't lost.
              setQueue((q) => (next ? order(q.length, true).map((i) => q[i]) : [...q].sort((a, b) => a - b)));
            }}>
            <Icon name="shuffle" size={16} /> Shuffle{shuffle ? ' on' : ''}
          </button>
          <KeyHints items={[['Space', 'Flip'], ['←', 'Still learning'], ['→', 'Know it']]} />
        </div>
      </div>
    </div>
  );
}
