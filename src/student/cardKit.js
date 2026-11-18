import React from 'react';
import Icon from '../components/ui/icons';

// Shared building blocks for the flashcard study screens (SrsSession,
// FlashcardStudy). Styles live under "Flashcards" in hub.css (.fcx-*).

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Read a word or phrase aloud with the browser's built-in voice. */
export function speak(text) {
  if (!canSpeak || !text) return;
  const u = new window.SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function SpeakButton({ text, size = 'md' }) {
  if (!canSpeak || !text) return null;
  return (
    <button type="button" className={`fcx-speak fcx-speak--${size}`} aria-label={`Listen: ${text}`} title="Listen"
      onClick={(e) => { e.stopPropagation(); speak(text); }}
      onPointerDown={(e) => e.stopPropagation()}>
      <Icon name="volume" size={size === 'sm' ? 16 : 20} />
    </button>
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
