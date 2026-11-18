import React, { useState, useEffect } from 'react';
import Icon from '../components/ui/icons';
import { pronunciation, play, firstAccent } from './pronounce';

// Shared building blocks for the flashcard study screens (SrsSession,
// FlashcardStudy) and word games. Styles live under "Flashcards" in hub.css (.fcx-*).

/** The word's recordings/IPA, or null while loading. */
function usePron(word) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    setData(null);
    if (word) pronunciation(word).then((d) => live && setData(d));
    return () => { live = false; };
  }, [word]);
  return data;
}

/** One speaker button: plays the UK recording (or US if that's all there is). Hidden when there's none. */
export function SpeakButton({ text, size = 'md' }) {
  const data = usePron(text);
  const acc = firstAccent(data);
  if (!acc) return null;
  return (
    <button type="button" className={`fcx-speak fcx-speak--${size}`} aria-label={`Listen: ${text}`} title="Listen"
      onClick={(e) => { e.stopPropagation(); play(text, acc); }}
      onPointerDown={(e) => e.stopPropagation()}>
      <Icon name="volume" size={size === 'sm' ? 16 : 20} />
    </button>
  );
}

/**
 * UK and US pronunciation, Cambridge-style: a play button with IPA for each
 * accent that has a human recording, IPA alone for one that doesn't.
 */
export function Pronounce({ word, compact = false }) {
  const data = usePron(word);
  const [playing, setPlaying] = useState(null);
  if (!word || !data) return null;
  const accents = ['uk', 'us'].filter((acc) => data[acc]?.audio || (!compact && data[acc]?.ipa));
  if (!accents.length) return null;
  const say = (e, acc) => {
    e.stopPropagation();
    setPlaying(acc);
    play(word, acc).finally(() => setTimeout(() => setPlaying((p) => (p === acc ? null : p)), 700));
  };
  return (
    <div className={`fcx-pron${compact ? ' fcx-pron--compact' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {accents.map((acc) => {
        const { audio, ipa } = data[acc];
        const label = <span className="fcx-pron-acc">{acc.toUpperCase()}</span>;
        const ipaText = !compact && ipa && <span className="fcx-pron-ipa">{ipa}</span>;
        return audio ? (
          <button key={acc} type="button" className={`fcx-pron-btn fcx-pron-btn--${acc}${playing === acc ? ' is-playing' : ''}`}
            onClick={(e) => say(e, acc)} aria-label={`Listen: ${acc === 'uk' ? 'British' : 'American'} pronunciation of ${word}`}>
            <span className="fcx-pron-icon"><Icon name="volume" size={compact ? 15 : 17} /></span>
            {label}{ipaText}
          </button>
        ) : (
          <span key={acc} className="fcx-pron-btn fcx-pron-btn--static" title="No recording yet">{label}{ipaText}</span>
        );
      })}
    </div>
  );
}

/** Close button · progress bar · whatever goes on the right (counts). */
export function SessionTop({ progress, onClose, children }) {
  const pct = Math.max(0, Math.min(1, progress || 0)) * 100;
  return (
    <div className="fcx-top">
      {onClose && (
        <button type="button" className="fcx-close" onClick={onClose} aria-label="End session" title="End session">
          <Icon name="close" size={20} />
        </button>
      )}
      <div className="fcx-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <span style={{ width: `${pct}%` }} />
      </div>
      {children}
    </div>
  );
}

/** A 3D flip card. Both faces share one grid cell so the card is as tall as its taller face. */
export function FlipCard({ flipped, front, back, className = '', style, label }) {
  return (
    <div className={`fcx-flip${flipped ? ' is-flipped' : ''} ${className}`} style={style}
      role="button" tabIndex={0} aria-pressed={flipped} aria-label={label || (flipped ? 'Answer side' : 'Flip card')}>
      <div className="fcx-flip-inner">
        <div className="fcx-face fcx-face--front" aria-hidden={flipped}>{front}</div>
        <div className="fcx-face fcx-face--back" aria-hidden={!flipped}>{back}</div>
      </div>
    </div>
  );
}

/** Keyboard shortcut legend shown under the card (hidden on touch screens). */
export function KeyHints({ items }) {
  return (
    <p className="fcx-keys" aria-hidden="true">
      {items.map(([k, label]) => <span key={label}><kbd>{k}</kbd>{label}</span>)}
    </p>
  );
}

/** End-of-session screen. tone: success | wait */
export function DoneScreen({ icon = 'checkCircle', tone = 'success', title, text, stats = [], children }) {
  return (
    <div className={`fcx-done fcx-done--${tone}`}>
      <div className="fcx-done-icon"><Icon name={icon} size={40} /></div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {stats.length > 0 && (
        <div className="fcx-done-stats">
          {stats.map((s) => (
            <div key={s.label} className={`fcx-done-stat${s.tone ? ` fcx-done-stat--${s.tone}` : ''}`}>
              <strong>{s.value}</strong>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
      )}
      <div className="fcx-done-actions">{children}</div>
    </div>
  );
}
