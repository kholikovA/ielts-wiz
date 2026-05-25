import React from 'react';
import GrammarHub from './grammar/GrammarHub';
import TopicPage from './grammar/TopicPage';
import TaskTrackPage from './grammar/TaskTrackPage';
import { grammarCurriculum, TOPIC_INDEX } from '../data/grammar-curriculum';

// Grammar section router.
//   subPage = null / 'hub'  → hub landing
//   subPage = 'L1-01' …    → topic page (from TOPIC_INDEX)
//   subPage = 'TT-W1' …    → task track page
//   subPage = 'placement'  → placement quiz (TODO — phase 7)
//   subPage = 'reviews'    → review queue (TODO — phase 6)

const GrammarPage = ({ subPage, setSubPage }) => {
  const sub = subPage || 'hub';

  // Topic?
  if (TOPIC_INDEX[sub]) {
    const { topic, levelName } = TOPIC_INDEX[sub];
    return (
      <TopicPage
        topic={topic}
        levelName={levelName}
        onBack={() => setSubPage && setSubPage('hub')}
      />
    );
  }

  // Task track?
  const track = grammarCurriculum.taskTracks.find(t => t.id === sub);
  if (track) {
    return <TaskTrackPage track={track} onBack={() => setSubPage && setSubPage('hub')} />;
  }

  // Placeholder pages for placement / reviews (Phase 6 + 7 of the roadmap).
  if (sub === 'placement' || sub === 'reviews') {
    const isPlacement = sub === 'placement';
    return (
      <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
        <div className="page-section" style={{ maxWidth: '720px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setSubPage && setSubPage('hub')} style={{ marginBottom: 'var(--space-5)' }}>
            ← Hub
          </button>
          <div className="panel panel-info" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <h1 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              {isPlacement ? 'Placement quiz' : 'Review queue'}
            </h1>
            <p className="body">
              {isPlacement
                ? "The diagnostic placement quiz lives in Phase 7 of the rollout. Once authored, it'll route you to the right level based on what you actually need to fix — not what feels comfortable."
                : "The spaced-repetition review queue lives in Phase 6 of the rollout. Once active, mastered topics will resurface here at 1d, 3d, 7d, 21d, 60d intervals to lock them in."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default: hub
  return <GrammarHub setSubPage={setSubPage} />;
};

export default GrammarPage;
