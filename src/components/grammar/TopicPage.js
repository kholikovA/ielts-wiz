import React, { useState } from 'react';
import Icon from '../ui/icons';
import { Exercise } from './exercises';
import MasteryTest from './MasteryTest';
import { isMastered } from '../../lib/grammarProgressStore';

const SECTIONS = [
  { id: 'notice',          label: '01 · Notice',         icon: 'compass' },
  { id: 'understand',      label: '02 · Understand',     icon: 'bookOpen' },
  { id: 'commonMistakes',  label: '03 · Common Mistakes', icon: 'xCircle' },
  { id: 'practise',        label: '04 · Practise',       icon: 'edit' },
  { id: 'produce',         label: '05 · Produce',        icon: 'layers' },
  { id: 'apply',           label: '06 · Apply',          icon: 'sparkle' },
  { id: 'mastery',         label: '07 · Mastery Test',   icon: 'award' },
];

const TopicPage = ({ topic, levelName, onBack }) => {
  const [active, setActive] = useState('notice');
  const [masteryOpen, setMasteryOpen] = useState(false);
  const isReady = topic.status === 'ready';
  const mastered = isMastered(topic.id);

  const s = topic.sections;

  const scrollTo = (id) => {
    setActive(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (masteryOpen) {
    return (
      <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
        <div className="page-section" style={{ maxWidth: '900px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setMasteryOpen(false)} style={{ marginBottom: 'var(--space-5)' }}>
            <Icon name="arrowLeft" size={16} /> Back to topic
          </button>
          <MasteryTest topic={topic} onExit={() => setMasteryOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--space-6)', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--space-8)' }} className="topic-layout">
        {/* Sticky side nav */}
        <aside className="topic-nav" style={{ position: 'sticky', top: '100px', alignSelf: 'start', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 'var(--space-4)' }}>
            <Icon name="arrowLeft" size={14} /> Hub
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map(sec => (
              <button
                key={sec.id}
                type="button"
                onClick={() => sec.id === 'mastery' ? setMasteryOpen(true) : scrollTo(sec.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  background: active === sec.id ? 'var(--purple-600-20)' : 'transparent',
                  color: active === sec.id ? 'var(--purple-400)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'var(--text-sm)',
                  textAlign: 'left',
                }}
              >
                <Icon name={sec.icon} size={14} />
                {sec.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--purple-400)', fontWeight: 700, letterSpacing: '0.06em' }}>
                {topic.id} · {levelName}
              </span>
              {mastered && (
                <span className="pill pill-success">
                  <Icon name="check" size={12} strokeWidth={3} /> Mastered
                </span>
              )}
              {!isReady && (
                <span className="pill pill-amber">Content pending</span>
              )}
              {(topic.tags || []).map(tag => (
                <span key={tag} style={{ padding: '2px 8px', borderRadius: 'var(--r-sm)', background: 'var(--tag-bg)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="h1" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              {topic.title}
            </h1>
            <p className="body-lg">{topic.blurb}</p>
          </div>

          {!isReady && (
            <div className="panel panel-info" style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <Icon name="edit" size={18} style={{ color: 'var(--purple-400)' }} />
                <strong style={{ color: 'var(--text-primary)' }}>Authored stub</strong>
              </div>
              <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
                The scope and shape of this topic are locked in — examples, rules, exercises, and the mastery test will be filled in as part of the content-authoring sprint. Open <code>src/data/grammar-curriculum.js</code> to populate it.
              </p>
            </div>
          )}

          {/* 01 NOTICE */}
          <section id="section-notice" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>01 · Notice</span>
              {s.notice.heading}
            </h2>
            {s.notice.examples.length === 0 ? (
              <p className="body">Examples pending.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {s.notice.examples.map((ex, i) => (
                  <div key={i} className="card">
                    <p style={{ fontSize: 'var(--text-reading)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)', lineHeight: 1.7 }}>
                      "{ex.text}"
                    </p>
                    {ex.note && (
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                        {ex.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 02 UNDERSTAND */}
          <section id="section-understand" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>02 · Understand</span>
              The rules, in brief
            </h2>
            {s.understand.rules.length === 0 ? (
              <p className="body">Rules pending.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                {s.understand.rules.map((r, i) => (
                  <div key={i} className="card" style={{ padding: 'var(--space-4)' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{r.rule}</p>
                    {r.examples && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {r.examples.map((ex, j) => (
                          <span key={j} style={{ padding: '4px 10px', borderRadius: 'var(--r-pill)', background: 'var(--answer-bg)', color: 'var(--purple-300)', fontSize: 'var(--text-sm)', border: '1px solid var(--purple-500-30)' }}>
                            {ex}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(s.understand.formBox || s.understand.useBox) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {[s.understand.formBox, s.understand.useBox].filter(Boolean).map((box, i) => (
                  <div key={i} className="card">
                    <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>{box.title}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                      <tbody>
                        {box.rows.map((row, ri) => (
                          <tr key={ri} style={{ borderTop: ri ? '1px solid var(--border-color)' : 'none' }}>
                            <td style={{ padding: 'var(--space-2) 0', color: 'var(--text-secondary)', verticalAlign: 'top' }}>{row[0]}</td>
                            <td style={{ padding: 'var(--space-2) 0 var(--space-2) var(--space-3)', color: 'var(--text-primary)', fontFamily: row[1].length < 30 ? 'var(--font-mono)' : 'inherit' }}>{row[1]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 03 COMMON MISTAKES */}
          <section id="section-commonMistakes" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>03 · Common Mistakes</span>
              What examiners actually flag
            </h2>
            {s.commonMistakes.length === 0 ? (
              <p className="body">Mistakes catalogue pending.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
                {s.commonMistakes.map((m, i) => (
                  <div key={i} className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.25)', padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <Icon name="xCircle" size={16} style={{ color: '#f87171', marginTop: 2 }} />
                      <span style={{ color: '#f87171', textDecoration: 'line-through', fontSize: 'var(--text-sm)' }}>{m.wrong}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                      <Icon name="checkCircle" size={16} style={{ color: '#34d399', marginTop: 2 }} />
                      <span style={{ color: '#34d399', fontWeight: 500, fontSize: 'var(--text-sm)' }}>{m.right}</span>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>{m.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 04 PRACTISE */}
          <section id="section-practise" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>04 · Practise</span>
              Controlled exercises
            </h2>
            {s.practise.length === 0 ? (
              <p className="body">Practise exercises pending.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {s.practise.map((ex, i) => (
                  <div key={i} className="panel" style={{ padding: 'var(--space-5)' }}>
                    <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>Exercise {i + 1}</div>
                    <Exercise exercise={ex} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 05 PRODUCE */}
          <section id="section-produce" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>05 · Produce</span>
              Semi-controlled production
            </h2>
            {s.produce.length === 0 ? (
              <p className="body">Production exercises pending.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {s.produce.map((ex, i) => (
                  <div key={i} className="panel" style={{ padding: 'var(--space-5)' }}>
                    <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>Exercise {i + 1}</div>
                    <Exercise exercise={ex} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 06 APPLY */}
          <section id="section-apply" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>06 · Apply</span>
              IELTS mini-tasks
            </h2>
            {s.apply.length === 0 ? (
              <p className="body">Mini-tasks pending.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {s.apply.map((ex, i) => (
                  <div key={i} className="panel" style={{ padding: 'var(--space-5)' }}>
                    <Exercise exercise={ex} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 07 MASTERY */}
          <section id="section-mastery" style={{ marginBottom: 'var(--space-12)' }}>
            <h2 className="h2" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>07 · Mastery Test</span>
              Certify the topic
            </h2>
            <div className="panel panel-info" style={{ padding: 'var(--space-6)' }}>
              <p className="body" style={{ marginBottom: 'var(--space-4)' }}>
                {s.masteryTest.questions.length > 0
                  ? `${s.masteryTest.questions.length} questions · ${Math.round((s.masteryTest.timeLimitSec || 720) / 60)} minutes · pass at ${Math.round((s.masteryTest.passingScore || 0.85) * 100)}%. No instant feedback during the test — score and breakdown at the end. Passing certifies mastery and adds the topic to your review queue.`
                  : 'Mastery test pending. The team will author 15 questions (mix of recognition + production) once the topic content is finalised.'}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => setMasteryOpen(true)}
                disabled={s.masteryTest.questions.length === 0}
              >
                <Icon name="award" size={16} /> Start mastery test
              </button>
            </div>
          </section>
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .topic-layout { grid-template-columns: 1fr !important; }
          .topic-nav { position: static !important; max-height: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TopicPage;
