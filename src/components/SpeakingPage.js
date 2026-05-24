import React, { useState } from 'react';
import { speakingQuestionsJanAug2026 } from '../data/speaking-part1';
import { speakingPart2Data } from '../data/speaking-part2';
import { speakingPart3Data } from '../data/speaking-part3';
import { vocabDefinitions } from '../data/vocab-definitions';
import HighlightedAnswer from './HighlightedAnswer';
import SubNav from './ui/SubNav';
import PageHeader from './ui/PageHeader';
import CollapsibleAbout from './ui/CollapsibleAbout';

const PARTS = [
  { id: 'part1-2026', label: 'Part 1', desc: 'Personal questions on familiar topics — home, work, interests. 4–5 minutes.' },
  { id: 'part2-2026', label: 'Part 2', desc: 'The long turn — speak for 1–2 minutes on a cue card after 1 minute of preparation.' },
  { id: 'part3-2026', label: 'Part 3', desc: 'Abstract discussion related to your Part 2 topic — extended answers, 4–5 minutes.' },
];

const SpeakingPage = ({ subPage, setSubPage }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showAnswers, setShowAnswers] = useState({});
  const [selectedPart2Topic, setSelectedPart2Topic] = useState(null);
  const [selectedPart3Topic, setSelectedPart3Topic] = useState(null);

  const toggleAnswer = (topicId, qIndex) => {
    const key = `${topicId}-${qIndex}`;
    setShowAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Default to Part 1 — drops the marketing "Overview" landing.
  const active = PARTS.find(p => p.id === subPage)?.id || 'part1-2026';
  const activePart = PARTS.find(p => p.id === active);

  const onChange = (id) => {
    setSubPage(id);
    setSelectedTopic(null);
    setSelectedPart2Topic(null);
    setSelectedPart3Topic(null);
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="page-section" style={{ maxWidth: '900px' }}>
        <PageHeader
          eyebrow="Speaking · Band 9 Answers"
          title={<>Sound natural, <span className="gradient-text">say more.</span></>}
          lead="Real exam questions across all three parts with Band 9 sample answers, cue cards, and a built-in vocabulary explainer."
        />

        <SubNav
          items={PARTS.map(p => ({ id: p.id, label: p.label }))}
          value={active}
          onChange={onChange}
        />

        <p className="body" style={{ marginTop: '-1rem', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          {activePart.desc}
        </p>


        {/* Part 1 Jan-Aug 2026 Questions */}
        {active === 'part1-2026' && (
          <div>
            <div style={{ padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--tag-bg)', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                💡 <strong>Tip:</strong> Hover over <span style={{ color: 'var(--purple-400)', borderBottom: '2px dotted var(--purple-400)' }}>highlighted words</span> to see meanings
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {speakingQuestionsJanAug2026.map((topic, index) => (
                <div key={topic.id} className="animate-fadeInUp" style={{ borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', animationDelay: `${index * 0.03}s` }}>
                  <div onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)} style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--purple-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{index + 1}</span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{topic.topic}</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '44px' }}>{topic.questions.length} questions • Part 1</p>
                    </div>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', transform: selectedTopic === topic.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>▼</span>
                  </div>

                  {selectedTopic === topic.id && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      {topic.questions.map((item, qIndex) => (
                        <div key={qIndex} style={{ padding: '1.25rem 0', borderBottom: qIndex < topic.questions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{item.q}</p>
                          
                          <button onClick={() => toggleAnswer(topic.id, qIndex)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--purple-500)', background: showAnswers[`${topic.id}-${qIndex}`] ? 'var(--purple-600)' : 'transparent', color: showAnswers[`${topic.id}-${qIndex}`] ? 'white' : 'var(--purple-400)', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                            {showAnswers[`${topic.id}-${qIndex}`] ? 'Hide Answer' : 'Show Band 9 Answer'}
                          </button>

                          {showAnswers[`${topic.id}-${qIndex}`] && (
                            <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '12px', background: 'var(--answer-bg)', border: '1px solid var(--purple-500-30)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', fontSize: '0.7rem', fontWeight: '700', color: '#1a1a1a' }}>BAND 9</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sample Answer</span>
                              </div>
                              <p style={{ fontSize: '0.95rem', lineHeight: '1.9', color: 'var(--text-primary)' }}>{item.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Part 2 Questions */}
        {active === 'part2-2026' && (
          <div>
            <div style={{ padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--tag-bg)', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                📝 <strong>Part 2 Format:</strong> You'll receive a cue card with a topic and points to cover. You have 1 minute to prepare, then speak for 1-2 minutes.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {speakingPart2Data.map((topic, index) => (
                <div key={topic.id} className="animate-fadeInUp" style={{ borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', animationDelay: `${index * 0.02}s` }}>
                  <div onClick={() => setSelectedPart2Topic(selectedPart2Topic === topic.id ? null : topic.id)} style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{index + 1}</span>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{topic.topic}</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '44px' }}>Related Part 3: {topic.cueCard.relatedPart3}</p>
                    </div>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', transform: selectedPart2Topic === topic.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>▼</span>
                  </div>

                  {selectedPart2Topic === topic.id && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      {/* Cue Card */}
                      <div style={{ margin: '1.25rem 0', padding: '1.5rem', borderRadius: '12px', background: 'var(--tag-bg)', border: '2px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--purple-400)', marginBottom: '1rem' }}>📋 Cue Card</h4>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>{topic.cueCard.title}</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>You should say:</p>
                        <ul style={{ paddingLeft: '1.25rem', marginBottom: '0', listStyle: 'none' }}>
                          {topic.cueCard.points.map((point, i) => (
                            <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{point}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Sample Answer */}
                      <button 
                        onClick={() => toggleAnswer(`p2-${topic.id}`, 0)} 
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--purple-500)', background: showAnswers[`p2-${topic.id}-0`] ? 'var(--purple-600)' : 'transparent', color: showAnswers[`p2-${topic.id}-0`] ? 'white' : 'var(--purple-400)', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', marginBottom: '1rem' }}
                      >
                        {showAnswers[`p2-${topic.id}-0`] ? 'Hide Sample Answer' : 'Show Band 9 Sample Answer'}
                      </button>

                      {showAnswers[`p2-${topic.id}-0`] && (
                        <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--answer-bg)', border: '1px solid var(--purple-500-30)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', fontSize: '0.7rem', fontWeight: '700', color: '#1a1a1a' }}>BAND 9</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sample Answer (1-2 minutes) • Hover highlighted words for definitions</span>
                          </div>
                          {/* Split answer into paragraphs matching bullet points */}
                          {topic.answer.split('\n\n').map((paragraph, pIndex) => (
                            <div key={pIndex} style={{ marginBottom: pIndex < topic.answer.split('\n\n').length - 1 ? '1rem' : 0 }}>
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <span style={{ 
                                  minWidth: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  background: 'var(--purple-600)', 
                                  color: 'white', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: '0.75rem', 
                                  fontWeight: '600',
                                  flexShrink: 0,
                                  marginTop: '2px'
                                }}>
                                  {pIndex + 1}
                                </span>
                                <div>
                                  {topic.cueCard.points[pIndex] && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--purple-400)', marginBottom: '0.35rem', fontWeight: '500', textTransform: 'capitalize' }}>
                                      {topic.cueCard.points[pIndex].replace('and explain ', '')}
                                    </p>
                                  )}
                                  <p style={{ fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                                    <HighlightedAnswer text={paragraph} vocabList={topic.keyVocab} />
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Link to Part 3 */}
                      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--tag-bg)' }}>
                        <button 
                          onClick={() => { setSubPage('part3-2026'); setSelectedPart3Topic(topic.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--purple-400)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          💬 View Related Part 3 Questions: {topic.cueCard.relatedPart3} →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Part 3 Questions */}
        {active === 'part3-2026' && (
          <div>
            <div style={{ padding: '1rem 1.5rem', borderRadius: '12px', background: 'var(--tag-bg)', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                💬 <strong>Part 3 Format:</strong> The examiner asks abstract questions related to Part 2. Give extended answers (20-30 seconds each) with explanations and examples.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {speakingPart3Data.map((topic, index) => (
                <div key={topic.id} className="animate-fadeInUp" style={{ borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', animationDelay: `${index * 0.02}s` }}>
                  <div onClick={() => setSelectedPart3Topic(selectedPart3Topic === topic.id ? null : topic.id)} style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{index + 1}</span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{topic.topic}</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '44px' }}>{topic.questions.length} questions • Part 3</p>
                    </div>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', transform: selectedPart3Topic === topic.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>▼</span>
                  </div>

                  {selectedPart3Topic === topic.id && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      {topic.questions.map((item, qIndex) => (
                        <div key={qIndex} style={{ padding: '1.25rem 0', borderBottom: qIndex < topic.questions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{item.q}</p>
                          
                          <button onClick={() => toggleAnswer(`p3-${topic.id}`, qIndex)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--purple-500)', background: showAnswers[`p3-${topic.id}-${qIndex}`] ? 'var(--purple-600)' : 'transparent', color: showAnswers[`p3-${topic.id}-${qIndex}`] ? 'white' : 'var(--purple-400)', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                            {showAnswers[`p3-${topic.id}-${qIndex}`] ? 'Hide Answer' : 'Show Band 9 Answer'}
                          </button>

                          {showAnswers[`p3-${topic.id}-${qIndex}`] && (
                            <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '12px', background: 'var(--answer-bg)', border: '1px solid var(--purple-500-30)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', fontSize: '0.7rem', fontWeight: '700', color: '#1a1a1a' }}>BAND 9</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sample Answer (20-30 seconds) • Hover highlighted words for definitions</span>
                              </div>
                              <p style={{ fontSize: '0.95rem', lineHeight: '1.9', color: 'var(--text-primary)' }}>
                                <HighlightedAnswer text={item.answer} vocabList={Object.keys(vocabDefinitions)} />
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Link back to Part 2 */}
                      <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--tag-bg)' }}>
                        <button 
                          onClick={() => { setSubPage('part2-2026'); setSelectedPart2Topic(topic.relatedPart2); }}
                          style={{ background: 'none', border: 'none', color: 'var(--purple-400)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          📝 View Related Part 2 Cue Card →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <CollapsibleAbout
          title="About IELTS Speaking"
          resourceHref="https://www.ielts.org/for-test-takers/how-ielts-is-scored"
          resourceLabel="View official IELTS Speaking resources"
        >
          <p style={{ marginBottom: 'var(--space-4)' }}>
            The IELTS Speaking test is a face-to-face interview lasting 11–14 minutes. It assesses you across four criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.
          </p>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            The test has three parts. Part 1: personal questions about familiar topics (4–5 min). Part 2: the "long turn" — 1–2 min on a cue card after 1 min of preparation. Part 3: a discussion of more abstract themes related to Part 2 (4–5 min).
          </p>
          <p style={{ margin: 0 }}>
            Success comes from natural delivery, varied vocabulary, accurate grammar, and clear pronunciation. Our materials include authentic questions from recent exams and Band 9 sample answers — hover any highlighted phrase to see why it works.
          </p>
        </CollapsibleAbout>
      </div>
    </div>
  );
};

export default SpeakingPage;
