import React from 'react';
import Icon from './icons';
import { prefetchPage } from '../../lib/prefetch';

// Shared bits for test cards (used by the full-test / Cambridge catalogues).
// The .test-actions / .icon-label classes let the buttons collapse to
// icon-only when cramped (see index.css).

export const CompletedPill = () => (
  <span className="pill pill-success" style={{ padding: '2px 10px' }}>
    <Icon name="checkCircle" size={12} /> Completed
  </span>
);

const scoreColor = (correct, total) => {
  if (!total) return 'var(--text-tertiary)';
  const pct = (correct / total) * 100;
  if (pct >= 70) return 'var(--correct-text)';
  if (pct >= 50) return 'var(--amber-400)';
  return 'var(--incorrect-text)';
};

export const ScoreBadge = ({ correct, total }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'baseline', gap: 'var(--space-1)',
    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700,
    color: scoreColor(correct, total),
    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
  }}>
    Last <span style={{ fontSize: 'var(--text-sm)' }}>{correct}/{total}</span>
  </span>
);

export const ReviewRetake = ({ href, onAuthRequired, canReview }) => (
  <span className="test-actions" style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
    {canReview && (
      <a
        className="btn btn-secondary btn-sm"
        href={`${href}?review=1`}
        onClick={onAuthRequired}
        onMouseEnter={() => prefetchPage(href)}
        style={{ gap: 'var(--space-1)', padding: '0 var(--space-3)' }}
        title="Open this test with your previous answers and score visible"
      >
        <Icon name="bookOpen" size={13} /> <span className="icon-label">Review</span>
      </a>
    )}
    <a
      className="btn btn-primary btn-sm"
      href={href}
      onClick={onAuthRequired}
      onMouseEnter={() => prefetchPage(href)}
      style={{ gap: 'var(--space-1)', padding: '0 var(--space-3)' }}
      title="Start this test over with a blank slate"
    >
      <Icon name="refresh" size={13} /> <span className="icon-label">Retake</span>
    </a>
  </span>
);

export const StartLink = ({ href, onAuthRequired, label = 'Start' }) => (
  <span className="test-actions" style={{ display: 'inline-flex' }}>
    <a
      className="btn btn-primary btn-sm"
      href={href}
      onClick={onAuthRequired}
      onMouseEnter={() => prefetchPage(href)}
      style={{ gap: 'var(--space-1)', padding: '0 var(--space-4)' }}
    >
      <span className="icon-label">{label}</span> <Icon name="arrowRight" size={13} />
    </a>
  </span>
);
