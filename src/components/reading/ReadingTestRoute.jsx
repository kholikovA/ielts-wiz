import React from 'react';
import ReadingTestPlayer from '../../features/test-player/ReadingTestPlayer';
import { findReadingTestBySlug } from '../../data/tests/manifest';

// Full-screen route that resolves a manifest test by its opaque URL slug and
// runs the player. Old guessable id-based URLs no longer resolve (slug miss),
// nor do typed/stale URLs — both land on the friendly "not available" screen.
export default function ReadingTestRoute({ slug, review, onExit }) {
  const test = findReadingTestBySlug(slug);
  if (!test) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p className="body">That test isn’t available yet.</p>
        <button className="btn btn-primary" onClick={onExit}>Back to reading</button>
      </div>
    );
  }
  return <ReadingTestPlayer test={test} review={review} onExit={onExit} />;
}
