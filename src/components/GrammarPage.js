import React, { useState } from 'react';
import { grammarLessons } from '../data/grammar-lessons';
import { vocabDefinitions } from '../data/vocab-definitions';
import Vocab from './Vocab';
import HighlightedAnswer from './HighlightedAnswer';

const GrammarPage = () => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswerSubmit = (lessonId, exerciseIndex, userAnswer) => {
    const key = `${lessonId}-${exerciseIndex}`;
    setUserAnswers(prev => ({ ...prev, [key]: userAnswer }));
    setShowResults(prev => ({ ...prev, [key]: true }));
  };

  const isCorrect = (lessonId, exerciseIndex, lesson) => {
    const key = `${lessonId}-${exerciseIndex}`;
    const userAnswer = userAnswers[key];
    const exercise = lesson.content.exercises[exerciseIndex];
    
    if (exercise.type === 'identify' || exercise.type === 'reorder') {
      return userAnswer === exercise.answer;
    }
    
    if (!userAnswer) return false;
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedAnswer = exercise.answer.toLowerCase().trim();
    
    // Check for multiple acceptable answers (separated by /)
    const acceptableAnswers = normalizedAnswer.split('/').map(a => a.trim());
    return acceptableAnswers.some(a => normalizedUser.includes(a) || a.includes(normalizedUser));
  };

  const resetLesson = (lessonId) => {
    const lesson = grammarLessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.content.exercises.forEach((_, i) => {
        const key = `${lessonId}-${i}`;
        setUserAnswers(prev => { const n = {...prev}; delete n[key]; return n; });
        setShowResults(prev => { const n = {...prev}; delete n[key]; return n; });
      });
    }
    setCurrentExercise(0);
    setShowExplanation(false);
  };

  const selectedLessonData = grammarLessons.find(l => l.id === selectedLesson);

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Advanced <span style={{ color: 'var(--purple-400)' }}>Grammar</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Master the structures that will elevate your Writing and Speaking scores
          </p>
        </div>

        {!selectedLesson ? (
          // Lesson Grid
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {grammarLessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="animate-fadeInUp"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animationDelay: `${index * 0.05}s`,
                }}
                onClick={() => { setSelectedLesson(lesson.id); setShowExplanation(false); setCurrentExercise(0); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '6px',
                    background: lesson.category === 'Advanced' ? 'var(--purple-600-20)' : 'var(--cyan-600-20)',
                    fontSize: '0.75rem',
                    color: lesson.category === 'Advanced' ? 'var(--purple-300)' : 'var(--cyan-300)',
                  }}>
                    {lesson.category}
                  </span>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {lesson.skills.map(skill => (
                      <span key={skill} style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: 'var(--tag-bg)',
                        fontSize: '0.7rem',
                        color: 'var(--text-tertiary)',
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {lesson.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
                  {lesson.description}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {lesson.content.exercises.length} exercises
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Lesson Detail View
          <div>
            <button
              onClick={() => { setSelectedLesson(null); resetLesson(selectedLesson); }}
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
              ← Back to lessons
            </button>

            <div style={{
              padding: '2rem',
              borderRadius: '20px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '6px',
                    background: selectedLessonData.category === 'Advanced' ? 'var(--purple-600-20)' : 'var(--cyan-600-20)',
                    fontSize: '0.75rem',
                    color: selectedLessonData.category === 'Advanced' ? 'var(--purple-300)' : 'var(--cyan-300)',
                  }}>
                    {selectedLessonData.category}
                  </span>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.75rem', color: 'var(--text-primary)' }}>
                    {selectedLessonData.title}
                  </h2>
                </div>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: showExplanation ? 'var(--purple-600)' : 'var(--tag-bg)',
                    color: showExplanation ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {showExplanation ? 'Hide Theory' : 'Show Theory'}
                </button>
              </div>

              {showExplanation && (
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'var(--tag-bg)',
                  marginBottom: '1.5rem',
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    📚 Theory & Explanation
                  </h3>
                  <div style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                    {selectedLessonData.content.explanation.split('\n').map((line, i) => {
                      // Handle **bold** text
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return (
                        <div key={i} style={{ marginBottom: line.startsWith('•') ? '0.25rem' : '0.5rem' }}>
                          {parts.map((part, j) => 
                            j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Examples:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedLessonData.content.examples.map((ex, i) => (
                      <div key={i} style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--answer-bg)',
                        border: '1px solid var(--purple-500-30)',
                      }}>
                        {ex.simple && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Simple:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.simple}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Complex:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.complex}</div>
                          </>
                        )}
                        {ex.type && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{ex.type}:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.example}</div>
                          </>
                        )}
                        {ex.strong && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Too strong:</div>
                            <div style={{ color: '#f87171', marginBottom: '0.5rem', textDecoration: 'line-through' }}>{ex.strong}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Hedged:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.hedged}</div>
                          </>
                        )}
                        {ex.basic && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Basic:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.basic}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Advanced:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.advanced}</div>
                          </>
                        )}
                        {ex.active && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Active:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.active}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Passive:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.passive}</div>
                          </>
                        )}
                        {ex.verbal && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Verbal:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.verbal}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Nominalized:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.nominalized}</div>
                          </>
                        )}
                        {ex.neutral && (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Neutral:</div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{ex.neutral}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Cleft/Emphatic:</div>
                            <div style={{ color: 'var(--purple-300)', fontWeight: '500' }}>{ex.cleft || ex.emphatic}</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise Navigation */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {selectedLessonData.content.exercises.map((_, i) => {
                  const key = `${selectedLesson}-${i}`;
                  const answered = showResults[key];
                  const correct = answered && isCorrect(selectedLesson, i, selectedLessonData);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentExercise(i)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: currentExercise === i ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                        background: answered ? (correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)') : 'transparent',
                        color: currentExercise === i ? 'var(--purple-400)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Exercise */}
              {(() => {
                const exercise = selectedLessonData.content.exercises[currentExercise];
                const key = `${selectedLesson}-${currentExercise}`;
                const answered = showResults[key];
                const correct = answered && isCorrect(selectedLesson, currentExercise, selectedLessonData);

                return (
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    background: 'var(--tag-bg)',
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--purple-400)', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Exercise {currentExercise + 1} of {selectedLessonData.content.exercises.length}
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {exercise.instruction}
                    </p>

                    {exercise.sentences && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--card-bg)',
                        marginBottom: '1rem',
                        border: '1px solid var(--border-color)',
                      }}>
                        {exercise.sentences.map((s, i) => (
                          <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: i < exercise.sentences.length - 1 ? '0.5rem' : 0 }}>
                            {i + 1}. {s}
                          </div>
                        ))}
                      </div>
                    )}

                    {exercise.sentence && !exercise.options && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--card-bg)',
                        marginBottom: '1rem',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}>
                        {exercise.sentence}
                      </div>
                    )}

                    {exercise.paragraph && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--card-bg)',
                        marginBottom: '1rem',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                      }}>
                        {exercise.paragraph}
                      </div>
                    )}

                    {/* Input/Options based on exercise type */}
                    {(exercise.type === 'combine' || exercise.type === 'transform' || exercise.type === 'correct') && (
                      <div>
                        <textarea
                          placeholder="Type your answer here..."
                          value={userAnswers[key] || ''}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={answered}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            minHeight: '80px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                          }}
                        />
                        {exercise.hint && !answered && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            💡 Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {exercise.type === 'fill' && exercise.options && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {exercise.options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => !answered && setUserAnswers(prev => ({ ...prev, [key]: option }))}
                            disabled={answered}
                            style={{
                              padding: '0.625rem 1.25rem',
                              borderRadius: '8px',
                              border: userAnswers[key] === option ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                              background: userAnswers[key] === option ? 'var(--purple-600-20)' : 'transparent',
                              color: 'var(--text-primary)',
                              cursor: answered ? 'default' : 'pointer',
                              fontWeight: userAnswers[key] === option ? '600' : '400',
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {exercise.type === 'fill' && !exercise.options && (
                      <div>
                        <input
                          type="text"
                          placeholder="Type your answer..."
                          value={userAnswers[key] || ''}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={answered}
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                          }}
                        />
                        {exercise.hint && !answered && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            💡 Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {(exercise.type === 'identify' || exercise.type === 'reorder') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {exercise.options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => !answered && setUserAnswers(prev => ({ ...prev, [key]: i }))}
                            disabled={answered}
                            style={{
                              padding: '1rem',
                              borderRadius: '10px',
                              border: userAnswers[key] === i ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                              background: userAnswers[key] === i ? 'var(--purple-600-20)' : 'transparent',
                              color: 'var(--text-primary)',
                              cursor: answered ? 'default' : 'pointer',
                              textAlign: 'left',
                              fontWeight: userAnswers[key] === i ? '500' : '400',
                            }}
                          >
                            {String.fromCharCode(65 + i)}. {option}
                          </button>
                        ))}
                        {exercise.hint && !answered && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            💡 Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submit / Result */}
                    <div style={{ marginTop: '1.5rem' }}>
                      {!answered ? (
                        <button
                          onClick={() => handleAnswerSubmit(selectedLesson, currentExercise, userAnswers[key])}
                          disabled={!userAnswers[key] && userAnswers[key] !== 0}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: (!userAnswers[key] && userAnswers[key] !== 0) ? 'var(--tag-bg)' : 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                            color: (!userAnswers[key] && userAnswers[key] !== 0) ? 'var(--text-tertiary)' : 'white',
                            fontWeight: '600',
                            cursor: (!userAnswers[key] && userAnswers[key] !== 0) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Check Answer
                        </button>
                      ) : (
                        <div style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          background: correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
                          border: `1px solid ${correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>{correct ? '✅' : '❌'}</span>
                            <span style={{ fontWeight: '600', color: correct ? '#34d399' : '#f87171' }}>
                              {correct ? 'Correct!' : 'Not quite right'}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <strong>Model answer:</strong> {exercise.answer}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next Exercise Button */}
                    {answered && currentExercise < selectedLessonData.content.exercises.length - 1 && (
                      <button
                        onClick={() => setCurrentExercise(currentExercise + 1)}
                        style={{
                          marginTop: '1rem',
                          padding: '0.75rem 2rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Next Exercise →
                      </button>
                    )}

                    {answered && currentExercise === selectedLessonData.content.exercises.length - 1 && (
                      <div style={{ marginTop: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          🎉 You've completed all exercises in this lesson!
                        </p>
                        <button
                          onClick={() => resetLesson(selectedLesson)}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontWeight: '500',
                            cursor: 'pointer',
                            marginRight: '0.75rem',
                          }}
                        >
                          Try Again
                        </button>
                        <button
                          onClick={() => { setSelectedLesson(null); resetLesson(selectedLesson); }}
                          style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Back to Lessons
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



// ==================== LISTENING PAGE ====================

export default GrammarPage;
