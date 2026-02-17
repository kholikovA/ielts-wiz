import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listeningTestsData } from '../data/listening-tests';
import AudioPlayer from './AudioPlayer';

const ListeningPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedPart, setSelectedPart] = useState('part1');
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerChange = (questionNum, value) => {
    setUserAnswers(prev => ({ ...prev, [questionNum]: value }));
  };

  const checkAnswers = () => {
    if (!selectedTest) return;
    let correct = 0;
    selectedTest.questions.forEach(q => {
      const userAns = (userAnswers[q.num] || '').toLowerCase().trim();
      const correctAns = (q.answer || '').toLowerCase().trim();
      if (correctAns && userAns === correctAns) {
        correct++;
      }
    });
    setScore(correct);
    setShowResults(true);
  };

  const resetTest = () => {
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const listeningSubNav = [
    { id: 'overview', label: 'Overview' },
    { id: '80-tests', label: '80 Listening Tests' },
  ];

  const partTabs = [
    { id: 'part1', label: 'Part 1 (Tests 1-20)', description: 'Section 1: Everyday social contexts' },
    { id: 'part2', label: 'Part 2 (Tests 21-40)', description: 'Section 2: Everyday social monologue' },
    { id: 'part3', label: 'Part 3 (Tests 41-60)', description: 'Section 3: Educational/training contexts' },
    { id: 'part4', label: 'Part 4 (Tests 61-80)', description: 'Section 4: Academic monologue' },
  ];

  const currentTests = listeningTestsData[selectedPart] || [];

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Listening <span style={{ color: 'var(--purple-400)' }}>Practice</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Train your ear with varied accents and question types</p>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {listeningSubNav.map(item => (
            <button
              key={item.id}
              onClick={() => { setSubPage(item.id); setSelectedTest(null); }}
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

        {/* Overview */}
        {(subPage || 'overview') === 'overview' && (
          <div>
            {/* About IELTS Listening */}
            <div style={{ padding: '2rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>About IELTS Listening</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                The IELTS Listening test takes approximately 30 minutes (plus 10 minutes transfer time) and consists of four recorded sections of increasing difficulty. You will hear each recording only once, so developing strong note-taking and prediction skills is essential for success.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
                Section 1 features a conversation between two speakers in an everyday social context, such as making a booking or asking for information. Section 2 presents a monologue on an everyday topic, like a local facilities guide. Section 3 involves a discussion between up to four people in an educational setting. Section 4 is an academic lecture or talk on a topic of general interest.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                Question types include multiple choice, matching, plan/map/diagram labelling, form/note/table/flowchart completion, and sentence completion. Our practice tests expose you to various British, American, Australian, and other accents you'll encounter in the real exam.
              </p>
              <a 
                href="https://www.ielts.org/for-test-takers/test-format" 
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
                📚 View Official IELTS Listening Resources →
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {[
                { icon: '🎧', title: 'Section 1', desc: 'Conversation between two people in everyday context' },
                { icon: '📢', title: 'Section 2', desc: 'Monologue in everyday social context' },
                { icon: '🎓', title: 'Section 3', desc: 'Conversation in educational/training context' },
                { icon: '📚', title: 'Section 4', desc: 'Academic lecture or talk' },
              ].map((item, i) => (
                <div key={i} onClick={() => setSubPage('80-tests')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div onClick={() => setSubPage('80-tests')} style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, var(--purple-600-10), var(--purple-700-5))', border: '1px solid var(--purple-500-30)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '1rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1', height: 'fit-content' }>80 TESTS</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>80 IELTS Listening Tests</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Complete practice tests covering all four sections with audio</p>
            </div>
          </div>
        )}

        {/* 80 Listening Tests */}
        {subPage === '80-tests' && !selectedTest && (
          <div>
            {/* Part Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {partTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPart(tab.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: selectedPart === tab.id ? 'none' : '1px solid var(--border-color)',
                    background: selectedPart === tab.id ? 'var(--purple-600)' : 'transparent',
                    color: selectedPart === tab.id ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {partTabs.find(t => t.id === selectedPart)?.description}
            </p>

            {/* Tests Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {currentTests.map((test, index) => (
                <div
                  key={test.id}
                  onClick={() => { if (!user) { setCurrentPage('login'); return; } setSelectedTest(test); }}
                  className="animate-fadeInUp"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    animationDelay: `${index * 0.02}s`,
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'var(--purple-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: 'white',
                  }}>
                    {test.id}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {test.title.length > 20 ? test.title.slice(0, 20) + '...' : test.title}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    10 questions
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Test View */}
        {subPage === '80-tests' && selectedTest && (
          <div>
            <button
              onClick={() => { setSelectedTest(null); resetTest(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginBottom: '1.5rem',
              }}
            >
              ← Back to tests
            </button>

            <div style={{
              padding: '2rem',
              borderRadius: '20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
            }}>
              {/* Test Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'white',
                }}>
                  {selectedTest.id}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Test {selectedTest.id}: {selectedTest.title}
                  </h2>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    Section {selectedTest.id <= 20 ? 1 : selectedTest.id <= 40 ? 2 : selectedTest.id <= 60 ? 3 : 4} • 10 Questions
                  </p>
                </div>
              </div>

              {/* Custom Audio Player */}
              <AudioPlayer testId={selectedTest.id} />

              {/* Score Display */}
              {showResults && (
                <div style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  background: score >= 7 ? 'rgba(34, 197, 94, 0.1)' : score >= 5 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${score >= 7 ? 'rgba(34, 197, 94, 0.3)' : score >= 5 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Your Score: {score}/10
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {score >= 8 ? 'Excellent!' : score >= 6 ? 'Good job!' : score >= 4 ? 'Keep practicing!' : 'Review the answers below'}
                    </p>
                  </div>
                  <button
                    onClick={resetTest}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* IELTS-Style Form/Note Layout */}
              <div style={{
                border: '2px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '1.5rem',
              }}>
                {/* Form Title Header */}
                <div style={{
                  background: 'var(--purple-600)',
                  padding: '1rem 1.5rem',
                  textAlign: 'center',
                }}>
                  <h3 style={{ 
                    color: 'white', 
                    fontSize: '1.1rem', 
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    {selectedTest.formTitle || selectedTest.title}
                  </h3>
                  {selectedTest.formSubtitle && (
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {selectedTest.formSubtitle}
                    </p>
                  )}
                </div>

                {/* Instruction */}
                <div style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--tag-bg)',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {selectedTest.instruction || 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.'}
                  </p>
                </div>

                {/* Questions as Form Fields */}
                <div style={{ padding: '1.5rem' }}>
                  {selectedTest.questions.map((q, i) => {
                    const userAns = userAnswers[q.num] || '';
                    const correctAns = q.answer || '';
                    const isCorrect = showResults && correctAns && userAns.toLowerCase().trim() === correctAns.toLowerCase().trim();
                    const isWrong = showResults && correctAns && userAns && !isCorrect;
                    
                    return (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.875rem 0',
                        borderBottom: i < selectedTest.questions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      }}>
                        {/* Question Number */}
                        <span style={{
                          minWidth: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: showResults 
                            ? (isCorrect ? 'rgba(34, 197, 94, 0.2)' : isWrong ? 'rgba(239, 68, 68, 0.2)' : 'var(--purple-600-20)')
                            : 'var(--purple-600-20)',
                          border: showResults
                            ? (isCorrect ? '2px solid #22c55e' : isWrong ? '2px solid #ef4444' : 'none')
                            : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: showResults 
                            ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--purple-400)')
                            : 'var(--purple-400)',
                          flexShrink: 0,
                        }}>
                          {showResults ? (isCorrect ? '✓' : isWrong ? '✗' : q.num) : q.num}
                        </span>

                        {/* Question Text with Inline Input */}
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            lineHeight: '1.8',
                          }}>
                            <span>{q.text}</span>
                            <input
                              type="text"
                              value={userAns}
                              onChange={(e) => handleAnswerChange(q.num, e.target.value)}
                              disabled={showResults}
                              placeholder="________"
                              style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '4px',
                                border: showResults 
                                  ? (isCorrect ? '2px solid #22c55e' : isWrong ? '2px solid #ef4444' : '1px solid var(--border-color)')
                                  : '1px solid var(--border-color)',
                                background: showResults
                                  ? (isCorrect ? 'rgba(34, 197, 94, 0.1)' : isWrong ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)')
                                  : 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                width: '140px',
                                textAlign: 'center',
                                fontWeight: '500',
                              }}
                            />
                          </div>
                          
                          {/* Show correct answer if wrong */}
                          {isWrong && correctAns && (
                            <p style={{ 
                              marginTop: '0.5rem', 
                              fontSize: '0.85rem', 
                              color: '#22c55e',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}>
                              <span style={{ fontWeight: '500' }}>Correct answer:</span> {correctAns}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Check Answers Button */}
              {!showResults ? (
                <button 
                  onClick={checkAnswers}
                  style={{
                    padding: '0.875rem 2rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '1rem',
                  }}
                >
                  Check Answers
                </button>
              ) : (
                <button 
                  onClick={resetTest}
                  style={{
                    padding: '0.875rem 2rem',
                    borderRadius: '10px',
                    border: '1px solid var(--purple-500)',
                    background: 'transparent',
                    color: 'var(--purple-400)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '1rem',
                  }}
                >
                  Reset & Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};




// ==================== READING PAGE COMPONENT ====================
// ==================== READING PAGE COMPONENT ====================
// ==================== READING PAGE COMPONENT ====================

export default ListeningPage;
