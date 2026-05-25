import React, { useState } from 'react';
import { grammarLessons } from '../data/grammar-lessons';
import PageHeader from './ui/PageHeader';
import Icon from './ui/icons';

const exampleRows = (ex) => {
  // Each example object uses one of several shapes. Pick the pair to display.
  if (ex.simple) return [['Simple', ex.simple], ['Complex', ex.complex]];
  if (ex.basic) return [['Basic', ex.basic], ['Advanced', ex.advanced]];
  if (ex.strong) return [['Too strong', ex.strong, true], ['Hedged', ex.hedged]];
  if (ex.active) return [['Active', ex.active], ['Passive', ex.passive]];
  if (ex.verbal) return [['Verbal', ex.verbal], ['Nominalized', ex.nominalized]];
  if (ex.neutral) return [['Neutral', ex.neutral], ['Cleft / Emphatic', ex.cleft || ex.emphatic]];
  if (ex.type) return [[ex.type, ex.example]];
  return [];
};

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
    const acceptableAnswers = normalizedAnswer.split('/').map(a => a.trim());
    return acceptableAnswers.some(a => normalizedUser.includes(a) || a.includes(normalizedUser));
  };

  const resetLesson = (lessonId) => {
    const lesson = grammarLessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.content.exercises.forEach((_, i) => {
        const key = `${lessonId}-${i}`;
        setUserAnswers(prev => { const n = { ...prev }; delete n[key]; return n; });
        setShowResults(prev => { const n = { ...prev }; delete n[key]; return n; });
      });
    }
    setCurrentExercise(0);
    setShowExplanation(false);
  };

  const selectedLessonData = grammarLessons.find(l => l.id === selectedLesson);

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="page-section" style={{ maxWidth: '1000px' }}>
        {!selectedLesson ? (
          <>
            <PageHeader
              eyebrow="Grammar"
              title={<>Master the structures <span className="gradient-text">examiners reward.</span></>}
              lead="Targeted lessons on the high-leverage grammar that moves your Writing and Speaking scores."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
              {grammarLessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  type="button"
                  className="card card-interactive animate-fadeInUp"
                  style={{ textAlign: 'left', cursor: 'pointer', animationDelay: `${index * 0.05}s` }}
                  onClick={() => { setSelectedLesson(lesson.id); setShowExplanation(false); setCurrentExercise(0); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span className={`pill ${lesson.category === 'Advanced' ? '' : ''}`}>
                      {lesson.category}
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      {lesson.skills.map(skill => (
                        <span key={skill} style={{
                          padding: '2px var(--space-2)',
                          borderRadius: 'var(--r-sm)',
                          background: 'var(--tag-bg)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.04em',
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                    {lesson.title}
                  </h3>
                  <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                    {lesson.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <span>{lesson.content.exercises.length} exercises</span>
                    <Icon name="arrowRight" size={14} />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSelectedLesson(null); resetLesson(selectedLesson); }}
              style={{ marginBottom: 'var(--space-5)' }}
            >
              <Icon name="arrowLeft" size={16} /> Back to lessons
            </button>

            <div className="card" style={{ padding: 'var(--space-8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <span className="pill" style={{ marginBottom: 'var(--space-3)' }}>
                    {selectedLessonData.category}
                  </span>
                  <h2 className="h2" style={{ marginTop: 'var(--space-3)', color: 'var(--text-primary)' }}>
                    {selectedLessonData.title}
                  </h2>
                </div>
                <button
                  type="button"
                  className={showExplanation ? 'btn btn-primary' : 'btn btn-secondary'}
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  <Icon name="bookOpen" size={16} /> {showExplanation ? 'Hide theory' : 'Show theory'}
                </button>
              </div>

              {showExplanation && (
                <div className="panel" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  <h3 className="h3" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
                    <Icon name="bookOpen" size={18} style={{ color: 'var(--purple-400)' }} />
                    Theory & explanation
                  </h3>
                  <div style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-base)' }}>
                    {selectedLessonData.content.explanation.split('\n').map((line, i) => {
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return (
                        <div key={i} style={{ marginBottom: line.startsWith('•') ? '2px' : 'var(--space-2)' }}>
                          {parts.map((part, j) =>
                            j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                    Examples
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {selectedLessonData.content.examples.map((ex, i) => {
                      const rows = exampleRows(ex);
                      return (
                        <div key={i} style={{
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--r-md)',
                          background: 'var(--answer-bg)',
                          border: '1px solid var(--purple-500-30)',
                        }}>
                          {rows.map(([label, text, strike], rIdx) => (
                            <div key={rIdx} style={{ marginBottom: rIdx < rows.length - 1 ? 'var(--space-3)' : 0 }}>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {label}
                              </div>
                              <div style={{
                                color: rows.length === 1 || rIdx === rows.length - 1 ? 'var(--purple-300)' : 'var(--text-secondary)',
                                fontWeight: rows.length === 1 || rIdx === rows.length - 1 ? 500 : 400,
                                textDecoration: strike ? 'line-through' : 'none',
                              }}>
                                {text}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Exercise nav strip */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
                {selectedLessonData.content.exercises.map((_, i) => {
                  const key = `${selectedLesson}-${i}`;
                  const answered = showResults[key];
                  const correct = answered && isCorrect(selectedLesson, i, selectedLessonData);
                  const isCurrent = currentExercise === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentExercise(i)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--r-md)',
                        border: isCurrent ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                        background: answered ? (correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)') : 'transparent',
                        color: isCurrent ? 'var(--purple-400)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current exercise */}
              {(() => {
                const exercise = selectedLessonData.content.exercises[currentExercise];
                const key = `${selectedLesson}-${currentExercise}`;
                const answered = showResults[key];
                const correct = answered && isCorrect(selectedLesson, currentExercise, selectedLessonData);

                return (
                  <div className="panel" style={{ padding: 'var(--space-6)' }}>
                    <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
                      Exercise {currentExercise + 1} of {selectedLessonData.content.exercises.length}
                    </div>
                    <p style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
                      {exercise.instruction}
                    </p>

                    {exercise.sentences && (
                      <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--r-md)', background: 'var(--card-bg)', marginBottom: 'var(--space-4)', border: '1px solid var(--border-color)' }}>
                        {exercise.sentences.map((s, i) => (
                          <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: i < exercise.sentences.length - 1 ? 'var(--space-2)' : 0 }}>
                            <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginRight: 'var(--space-2)' }}>{i + 1}.</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}

                    {exercise.sentence && !exercise.options && (
                      <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--r-md)', background: 'var(--card-bg)', marginBottom: 'var(--space-4)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        {exercise.sentence}
                      </div>
                    )}

                    {exercise.paragraph && (
                      <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--r-md)', background: 'var(--card-bg)', marginBottom: 'var(--space-4)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {exercise.paragraph}
                      </div>
                    )}

                    {(exercise.type === 'combine' || exercise.type === 'transform' || exercise.type === 'correct') && (
                      <div>
                        <textarea
                          className="form-textarea"
                          placeholder="Type your answer here…"
                          value={userAnswers[key] || ''}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={answered}
                        />
                        {exercise.hint && !answered && (
                          <p className="form-help" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Icon name="lightbulb" size={14} style={{ color: 'var(--amber-400)' }} />
                            Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {exercise.type === 'fill' && exercise.options && (
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {exercise.options.map((option, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => !answered && setUserAnswers(prev => ({ ...prev, [key]: option }))}
                            disabled={answered}
                            className={`chip ${userAnswers[key] === option ? 'is-selected' : ''}`}
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
                          className="form-input"
                          placeholder="Type your answer…"
                          value={userAnswers[key] || ''}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                          disabled={answered}
                        />
                        {exercise.hint && !answered && (
                          <p className="form-help" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Icon name="lightbulb" size={14} style={{ color: 'var(--amber-400)' }} />
                            Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {(exercise.type === 'identify' || exercise.type === 'reorder') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {exercise.options.map((option, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => !answered && setUserAnswers(prev => ({ ...prev, [key]: i }))}
                            disabled={answered}
                            style={{
                              padding: 'var(--space-4)',
                              borderRadius: 'var(--r-md)',
                              border: userAnswers[key] === i ? '2px solid var(--purple-500)' : '1px solid var(--border-color)',
                              background: userAnswers[key] === i ? 'var(--purple-600-20)' : 'transparent',
                              color: 'var(--text-primary)',
                              cursor: answered ? 'default' : 'pointer',
                              textAlign: 'left',
                              fontWeight: userAnswers[key] === i ? 500 : 400,
                              fontFamily: 'inherit',
                              fontSize: 'var(--text-md)',
                            }}
                          >
                            {option}
                          </button>
                        ))}
                        {exercise.hint && !answered && (
                          <p className="form-help" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Icon name="lightbulb" size={14} style={{ color: 'var(--amber-400)' }} />
                            Hint: {exercise.hint}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submit / Result */}
                    <div style={{ marginTop: 'var(--space-6)' }}>
                      {!answered ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleAnswerSubmit(selectedLesson, currentExercise, userAnswers[key])}
                          disabled={!userAnswers[key] && userAnswers[key] !== 0}
                        >
                          Check answer
                        </button>
                      ) : (
                        <div className={`panel ${correct ? 'panel-success' : 'panel-error'}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <Icon name={correct ? 'checkCircle' : 'xCircle'} size={18} style={{ color: correct ? '#34d399' : '#f87171' }} />
                            <span style={{ fontWeight: 600, color: correct ? '#34d399' : '#f87171' }}>
                              {correct ? 'Correct!' : 'Not quite right'}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Model answer:</strong> {exercise.answer}
                          </div>
                        </div>
                      )}
                    </div>

                    {answered && currentExercise < selectedLessonData.content.exercises.length - 1 && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setCurrentExercise(currentExercise + 1)}
                        style={{ marginTop: 'var(--space-4)' }}
                      >
                        Next exercise <Icon name="arrowRight" size={16} />
                      </button>
                    )}

                    {answered && currentExercise === selectedLessonData.content.exercises.length - 1 && (
                      <div style={{ marginTop: 'var(--space-5)' }}>
                        <div className="panel panel-info" style={{ marginBottom: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <Icon name="award" size={18} style={{ color: 'var(--purple-400)' }} />
                            <strong style={{ color: 'var(--text-primary)' }}>Lesson complete</strong>
                          </div>
                          <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
                            You've worked through every exercise in this lesson.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                          <button type="button" className="btn btn-secondary" onClick={() => resetLesson(selectedLesson)}>
                            <Icon name="refresh" size={16} /> Try again
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => { setSelectedLesson(null); resetLesson(selectedLesson); }}
                          >
                            Back to lessons
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GrammarPage;
