import React from 'react';

// Shown by a player in review mode when there's nothing to replay yet: while
// the cloud copy loads, when an old attempt was saved without its answers, or
// when the test was never submitted on this account.
export default function ReviewUnavailable({ state, title, theme, onRetake, onExit }) {
  const loading = state.status === 'loading';
  const missing = state.status === 'missing';
  const when = missing && state.ts ? new Date(state.ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  return (
    <div className="rtp-root" data-theme={theme} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        {title && <div style={{ fontSize: 13, opacity: 0.7 }}>{title}</div>}
        {loading && <p style={{ margin: 0 }}>Loading your previous attempt…</p>}
        {missing && (
          <>
            <h2 style={{ margin: 0, fontSize: 20 }}>
              Last score: {state.correct}/{state.total}{when ? ` · ${when}` : ''}
            </h2>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              This attempt was recorded before answers were saved, so there is nothing to replay.
              Your next attempt will be reviewable here.
            </p>
          </>
        )}
        {state.status === 'none' && (
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            No submitted attempt found for this test on your account. Take the test to create one.
          </p>
        )}
        {!loading && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" className="rbtn" onClick={onExit}>Back</button>
            <button type="button" className="rbtn rbtn-review" onClick={onRetake}>
              {state.status === 'none' ? 'Start test' : 'Retake test'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
