import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import CollapsibleAbout from '../ui/CollapsibleAbout';
import { grammarCurriculum } from '../../data/grammar-curriculum';
import { getProgress, getDueReviews, getMastery } from '../../lib/grammarProgressStore';

// Mapping level → tint colour, used by the level card accent.
const LEVEL_TINT = {
  L1: { soft: 'rgba(168, 85, 247, 0.12)', hard: 'var(--purple-500)' },
  L2: { soft: 'rgba(59, 130, 246, 0.12)',  hard: '#3b82f6' },
  L3: { soft: 'rgba(16, 185, 129, 0.12)',  hard: '#10b981' },
  L4: { soft: 'rgba(245, 158, 11, 0.12)',  hard: 'var(--amber-500)' },
};

const GrammarHub = ({ setSubPage, setCurrentPage }) => {
  const dueCount = getDueReviews().length;
  const mastery = getMastery();
  const allTopics = grammarCurriculum.levels.flatMap(l => l.topics);
  const masteredCount = allTopics.filter(t => mastery[t.id]?.masteredAt).length;

  const goTopic = (topicId) => { if (setSubPage) setSubPage(topicId); };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <PageHeader
            eyebrow="Grammar · 32 Topics + 4 Tracks"
            title={<>Master the structures <span className="gradient-text">examiners reward.</span></>}
            lead="Four levels of IELTS-targeted grammar plus four task tracks — each topic built around the Notice → Understand → Practise → Produce → Apply → Master cycle."
          />
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            {dueCount > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => goTopic('reviews')}
                aria-label={`${dueCount} reviews due`}
              >
                <Icon name="refresh" size={16} />
                <span>Reviews</span>
                <span className="pill" style={{ marginLeft: 4 }}>{dueCount}</span>
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => goTopic('placement')}>
              <Icon name="compass" size={16} /> Placement quiz
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-5)' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Topics Mastered</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {masteredCount}<span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-lg)', fontWeight: 500 }}> / {allTopics.length}</span>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Reviews Due</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: dueCount > 0 ? 'var(--amber-400)' : 'var(--text-tertiary)', lineHeight: 1 }}>
                {dueCount}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Levels</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>4</div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Task Tracks</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>4</div>
            </div>
          </div>
        </div>

        {/* Level cards */}
        <h2 className="h2" style={{ marginBottom: 'var(--space-5)', color: 'var(--text-primary)' }}>
          The four levels
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-12)' }}>
          {grammarCurriculum.levels.map((level) => {
            const progress = getProgress(level);
            const tint = LEVEL_TINT[level.id];
            const firstTopicId = level.topics[0]?.id;
            const hasStarted = progress.mastered > 0;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => firstTopicId && goTopic(firstTopicId)}
                className="card card-interactive animate-fadeInUp"
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <span style={{
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--r-sm)',
                    background: tint.soft,
                    color: tint.hard,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}>
                    {level.id}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    ~{level.estimatedHours}h
                  </span>
                </div>
                <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                  {level.name}
                </h3>
                <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                  {level.tagline}
                </p>
                {/* Mini progress bar */}
                <div style={{ height: 6, borderRadius: 'var(--r-pill)', background: 'var(--tag-bg)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
                  <div style={{
                    width: `${progress.pct}%`,
                    height: '100%',
                    background: tint.hard,
                    borderRadius: 'var(--r-pill)',
                    transition: 'width var(--dur-slow) var(--ease)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span>{progress.mastered} / {progress.total} mastered</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: tint.hard, fontWeight: 600 }}>
                    {hasStarted ? 'Continue' : 'Start'} <Icon name="arrowRight" size={12} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Topic list by level (compact accordion-less list, lets people jump in directly) */}
        {grammarCurriculum.levels.map((level) => (
          <details key={level.id} open={level.id === 'L1'} style={{ marginBottom: 'var(--space-5)' }}>
            <summary style={{
              cursor: 'pointer',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              listStyle: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>{level.id} · {level.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {level.topics.length} topics
              </span>
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
              {level.topics.map((topic) => {
                const isMastered = Boolean(mastery[topic.id]?.masteredAt);
                const isReady = topic.status === 'ready';
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => goTopic(topic.id)}
                    className="card card-interactive"
                    style={{ textAlign: 'left', cursor: 'pointer', padding: 'var(--space-4)', position: 'relative' }}
                  >
                    {isMastered && (
                      <div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', width: 22, height: 22, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Icon name="check" size={12} strokeWidth={3} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--purple-400)', fontWeight: 700, letterSpacing: '0.06em' }}>
                        {topic.id}
                      </span>
                      {!isReady && (
                        <span className="pill" style={{ fontSize: 10, padding: '1px 6px' }}>Coming soon</span>
                      )}
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-1)', paddingRight: isMastered ? 'var(--space-6)' : 0 }}>
                      {topic.title}
                    </h4>
                    <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
                      {topic.blurb}
                    </p>
                  </button>
                );
              })}
            </div>
          </details>
        ))}

        {/* Task tracks */}
        <h2 className="h2" style={{ margin: 'var(--space-12) 0 var(--space-5)', color: 'var(--text-primary)' }}>
          Task-specific tracks
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {grammarCurriculum.taskTracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => goTopic(track.id)}
              className="card card-interactive"
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 'var(--r-md)',
                background: 'var(--badge-bg)',
                color: 'var(--purple-300)',
                marginBottom: 'var(--space-3)',
              }}>
                <Icon name={track.iconName} size={20} />
              </div>
              <h4 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                {track.name}
              </h4>
              <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                {track.tagline}
              </p>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {track.modules.length} modules
              </div>
            </button>
          ))}
        </div>

        <CollapsibleAbout title="How this curriculum works">
          <p style={{ marginBottom: 'var(--space-3)' }}>
            <strong>The cycle:</strong> Every topic walks through six phases — <em>Notice</em> (real examples first), <em>Understand</em> (concise rules), <em>Practise</em> (controlled exercises), <em>Produce</em> (semi-controlled), <em>Apply</em> (IELTS mini-tasks), and <em>Master</em> (15-question test).
          </p>
          <p style={{ marginBottom: 'var(--space-3)' }}>
            <strong>Mastery:</strong> Score ≥ 85% on the mastery test to mark a topic mastered. The topic then enters your spaced-repetition queue and resurfaces at expanding intervals (1d → 3d → 7d → 21d → 60d).
          </p>
          <p style={{ margin: 0 }}>
            <strong>Levels vs. tracks:</strong> Levels 1–4 are sequential — accuracy first, sophistication last. Task tracks are recombinations of those skills aimed at one IELTS section (Writing Task 1, Writing Task 2, Speaking, Listening/Reading).
          </p>
        </CollapsibleAbout>
      </div>
    </div>
  );
};

export default GrammarHub;
