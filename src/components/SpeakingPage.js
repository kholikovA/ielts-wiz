import React, { useState, useEffect, useRef } from 'react';
import { speakingPart2Data } from '../data/speaking-part2';
import { speakingPart3Data } from '../data/speaking-part3';
import { speakingQuestions } from '../data/speaking-questions';
import HighlightedAnswer from './HighlightedAnswer';
import { vocabDefinitions } from '../data/vocab-definitions';

const SpeakingPage = ({ subPage, setSubPage }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showAnswers, setShowAnswers] = useState({});
  const [selectedPart2Topic, setSelectedPart2Topic] = useState(null);
  const [selectedPart3Topic, setSelectedPart3Topic] = useState(null);

  const toggleAnswer = (topicId, qIndex) => {
    const key = `${topicId}-${qIndex}`;
    setShowAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Sub-navigation for speaking
  const speakingSubNav = [
    { id: 'overview', label: 'Overview' },
    { id: 'part1-2026', label: 'Part 1' },
    { id: 'part2-2026', label: 'Part 2' },
    { id: 'part3-2026', label: 'Part 3' },
  ];

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Speaking <span style={{ color: 'var(--purple-400)' }}>Practice</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Real IELTS questions with natural Band 9 answers</p>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {speakingSubNav.map(item => (
            <button
              key={item.id}
              onClick={() => { setSubPage(item.id); setSelectedTopic(null); setSelectedPart2Topic(null); setSelectedPart3Topic(null); }}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '10px',
                border: (subPage || 'overview') === item.id ? 'none' : '1px solid var(--border-color)',
                background: (subPage || 'overview') === item.id ? 'linear-gradient(135deg, var(--purple-600), var(--purple-700))' : 'transparent',
                color: (subPage || 'overview') === item.id ? 'white' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Overview Page */}
        {(subPage || 'overview') === 'overview' && (
          <div>
            {/* About IELTS Speaking */}
            <div style={{ padding: '2rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>About IELTS Speaking</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                The IELTS Speaking test is a face-to-face interview lasting 11-14 minutes, designed to assess your ability to communicate effectively in English. It evaluates you across four key criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                The test consists of three parts. Part 1 involves personal questions about familiar topics like home, work, and interests (4-5 minutes). Part 2 requires you to speak for 1-2 minutes on a given topic after one minute of preparation – this is known as the "long turn." Part 3 features a two-way discussion with the examiner on more abstract themes related to Part 2 (4-5 minutes).
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                Success in the Speaking test comes from natural delivery, varied vocabulary, accurate grammar, and clear pronunciation. Our practice materials include authentic questions from recent exams and Band 9 model answers to help you understand what examiners are looking for.
              </p>
              <a 
                href="https://www.ielts.org/for-test-takers/how-ielts-is-scored" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: 'var(--purple-400)', 
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                📚 View Official IELTS Speaking Resources →
              </a>
            </div>

            {/* Part Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div onClick={() => setSubPage('part1-2026')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎤</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Part 1: Introduction</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>Personal questions about familiar topics. 4-5 minutes. 16 topics available.</p>
              </div>
              <div onClick={() => setSubPage('part2-2026')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Part 2: Long Turn</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>Speak for 1-2 minutes on a given topic with preparation time. 27 cue cards.</p>
              </div>
              <div onClick={() => setSubPage('part3-2026')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Part 3: Discussion</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>Abstract questions related to Part 2 topics. 4-5 minutes. 27 discussion topics.</p>
              </div>
            </div>
          </div>
        )}

        {/* Part 1 Jan-Aug 2026 Questions */}
        {subPage === 'part1-2026' && (
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
        {subPage === 'part2-2026' && (
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
        {subPage === 'part3-2026' && (
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
      </div>
    </div>
  );
};

// ==================== GRAMMAR PAGE ====================

export default SpeakingPage;
