import React from 'react';
import ReadingTestPlayer from '../../features/test-player/ReadingTestPlayer';
import { findReadingTestById } from '../../data/tests/manifest';

// Full-screen route that resolves a manifest test by id and runs the player.
// Tests not yet migrated to a committed spec aren't linked here (the catalogue
// falls back to their standalone HTML), so a miss is an unexpected/typed URL.
export default function ReadingTestRoute({ testId, review, onExit }) {
  const test = findReadingTestById(testId);
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
