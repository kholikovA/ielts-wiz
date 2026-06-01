import React from 'react';
import Icon from './icons';

// Single test entry on a skill page. Renders as either a grid tile or a list
// row, with a score badge + Review/Retake buttons when the user has a prior
// attempt on this test.
//
// Props:
//   test           — { id, title, subtitle? }
//   href           — full URL to the standalone test HTML
//   viewMode       — 'list' | 'grid'
//   isCompleted    — bool, shows green check ring
//   latestAttempt  — { correct, total } | null
//   meta           — short line under the title in grid mode (e.g. "10 questions")
//   onAuthRequired — click handler that bounces signed-out users to /login
//   accent         — color used for the id chip in list/reading-grid (defaults to brand purple)

const scoreColor = (correct, total) => {
  if (!total) return 'var(--text-tertiary)';
  const pct = (correct / total) * 100;
  if (pct >= 70) return 'var(--correct-text)';
  if (pct >= 50) return 'var(--amber-400)';
  return 'var(--incorrect-text)';
};

const ScoreBadge = ({ correct, total }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'baseline', gap: 'var(--space-1)',
    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700,
    color: scoreColor(correct, total),
    textTransform: 'uppercase', letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  }}>
    Last <span style={{ fontSize: 'var(--text-sm)' }}>{correct}/{total}</span>
  </span>
);

const Actions = ({ href, onAuthRequired, canReview, compact = false }) => {
  const size = compact ? 12 : 13;
  return (
    <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
      {canReview && (
        <a
          className="btn btn-secondary btn-sm"
          href={`${href}?review=1`}
          onClick={onAuthRequired}
          style={{ gap: 'var(--space-1)', padding: '0 var(--space-3)' }}
          title="Open this test with your previous answers and score visible"
        >
          <Icon name="bookOpen" size={size} /> Review
        </a>
      )}
      <a
        className="btn btn-primary btn-sm"
        href={href}
        onClick={onAuthRequired}
        style={{ gap: 'var(--space-1)', padding: '0 var(--space-3)' }}
        title="Start this test over with a blank slate"
      >
        <Icon name="refresh" size={size} /> Retake
      </a>
    </span>
  );
};

const StartButton = ({ href, onAuthRequired }) => (
  <a
    className="btn btn-primary btn-sm"
    href={href}
    onClick={onAuthRequired}
    style={{ gap: 'var(--space-1)', padding: '0 var(--space-4)' }}
  >
    Start <Icon name="arrowRight" size={13} />
  </a>
);

export default function TestCard({
  test, href, viewMode, isCompleted, latestAttempt, canReview = false,
  meta, onAuthRequired, accent = 'var(--purple-600)',
}) {
  const hasAttempt = !!latestAttempt;

  if (viewMode === 'list') {
    return (
      <div
        className="card"
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          padding: 'var(--space-4) var(--space-5)',
          borderColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : undefined,
        }}
      >
        <div style={{
          flexShrink: 0,
          width: '44px', height: '44px', borderRadius: 'var(--r-md)',
          background: `linear-gradient(135deg, ${accent}, var(--purple-700))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: 'white', fontSize: 'var(--text-md)',
        }}>
          {test.id}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            color: 'var(--text-primary)', fontWeight: 600,
            fontSize: 'var(--text-base)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isCompleted && (
              <Icon name="checkCircle" size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {test.title}
            </span>
          </div>
          {(test.subtitle || meta) && (
            <div style={{
              fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
              marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {test.subtitle || meta}
            </div>
          )}
        </div>
        {hasAttempt && (
          <div style={{ flexShrink: 0 }}>
            <ScoreBadge correct={latestAttempt.correct} total={latestAttempt.total} />
          </div>
        )}
        <div style={{ flexShrink: 0 }}>
          {hasAttempt
            ? <Actions href={href} onAuthRequired={onAuthRequired} canReview={canReview} />
            : <StartButton href={href} onAuthRequired={onAuthRequired} />}
        </div>
      </div>
    );
  }

  // Grid mode — preserves the existing card visual but appends a footer with
  // the score badge + Review/Retake when the user has an attempt.
  return (
    <div
      className="card card-interactive"
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        padding: 'var(--space-5)',
        borderColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : undefined,
        minHeight: 0,
      }}
    >
      {!hasAttempt ? (
        <a href={href} onClick={onAuthRequired} style={{
          display: 'block', color: 'inherit', textDecoration: 'none',
        }}>
          <GridBody test={test} meta={meta} accent={accent} isCompleted={isCompleted} />
        </a>
      ) : (
        <>
          <GridBody test={test} meta={meta} accent={accent} isCompleted={isCompleted} />
          <div style={{
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 'var(--space-2)', flexWrap: 'wrap',
          }}>
            <ScoreBadge correct={latestAttempt.correct} total={latestAttempt.total} />
            <Actions href={href} onAuthRequired={onAuthRequired} canReview={canReview} compact />
          </div>
        </>
      )}
    </div>
  );
}

const GridBody = ({ test, meta, accent, isCompleted }) => (
  <>
    {isCompleted && (
      <div style={{
        position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)',
        width: '20px', height: '20px', borderRadius: '50%',
        background: 'var(--success)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white',
      }}>
        <Icon name="check" size={12} strokeWidth={3} />
      </div>
    )}
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: 'var(--r-md)',
        background: `linear-gradient(135deg, ${accent}, var(--purple-700))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--space-3)',
        fontSize: 'var(--text-md)', fontFamily: 'var(--font-mono)',
        fontWeight: 700, color: 'white',
      }}>
        {test.id}
      </div>
      <p style={{
        fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
        lineHeight: 1.4, fontWeight: 500, marginBottom: 'var(--space-2)',
      }}>
        {test.title && test.title.length > 28 ? `${test.title.slice(0, 28)}…` : test.title}
      </p>
      {(test.subtitle || meta) && (
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {test.subtitle || meta}
        </div>
      )}
    </div>
  </>
);
