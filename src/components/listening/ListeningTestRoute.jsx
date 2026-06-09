import React from 'react';
import ListeningTestPlayer from '../../features/test-player/ListeningTestPlayer';
import { findListeningTestBySlug } from '../../data/tests/manifest';

// Full-screen route that resolves a listening test by its opaque URL slug and runs
// the player. Stale/guessed slugs land on the friendly "not available" screen.
export default function ListeningTestRoute({ slug, review, onExit }) {
  const test = findListeningTestBySlug(slug);
  if (!test) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p className="body">That test isn’t available yet.</p>
        <button className="btn btn-primary" onClick={onExit}>Back to listening</button>
      </div>
    );
  }
  return <ListeningTestPlayer test={test} review={review} onExit={onExit} />;
}
