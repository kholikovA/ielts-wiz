import React, { useState, useEffect, useRef } from 'react';
import Icon from '../ui/icons';
import { Exercise } from './exercises';
import { recordMastery, recordAttempt } from '../../lib/grammarProgressStore';

const formatTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.max(0, sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const MasteryTest = ({ topic, onExit }) => {
  const questions = topic.sections.masteryTest.questions || [];
  const passing = topic.sections.masteryTest.passingScore || 0.85;
  const timeLimit = topic.sections.masteryTest.timeLimitSec || 12 * 60;

  const [phase, setPhase] = useState('intro'); // intro | running | done
  const [results, setResults] = useState([]);   // [{correct, userAnswer}]
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remaining, setRemaining] = useState(timeLimit);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase !== 'running') return;
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = () => {
    setPhase('running');
    setRemaining(timeLimit);
    setResults([]);
    setCurrentIdx(0);
  };

  const handleResult = (r) => {
    setResults(prev => {
      const next = [...prev];
      next[currentIdx] = r;
      return next;
    });
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(i => i + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    clearInterval(timerRef.current);
    const correctCount = results.filter(r => r?.correct).length;
    const score = questions.length > 0 ? correctCount / questions.length : 0;
    if (score >= passing) {
      recordMastery(topic.id, score);
    } else {
      recordAttempt(topic.id, score);
    }
    setPhase('done');
  };

  if (questions.length === 0) {
    return (
      <div className="panel panel-info">
        <p className="body" style={{ margin: 0 }}>
          The mastery test for this topic hasn't been authored yet. Once the team adds questions, you'll be able to certify the topic here.
        </p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <Icon name="award" size={32} style={{ color: 'var(--purple-400)', marginBottom: 'var(--space-3)' }} />
        <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          Mastery test — {topic.title}
        </h3>
        <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
          {questions.length} questions · {Math.round(timeLimit / 60)} minutes · pass at {Math.round(passing * 100)}%
        </p>
        <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
          No instant feedback during the test. You'll get a full breakdown at the end.
        </p>
        <button type="button" className="btn btn-primary btn-lg" onClick={start}>
          Start test <Icon name="arrowRight" size={16} />
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const correctCount = results.filter(r => r?.correct).length;
    const score = questions.length > 0 ? correctCount / questions.length : 0;
    const passed = score >= passing;
    return (
      <div>
        <div className={`panel ${passed ? 'panel-success' : 'panel-error'}`} style={{ textAlign: 'center', padding: 'var(--space-8)', marginBottom: 'var(--space-5)' }}>
          <Icon name={passed ? 'award' : 'refresh'} size={32} style={{ color: passed ? 'var(--success)' : 'var(--error)', marginBottom: 'var(--space-3)' }} />
          <h3 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            {correctCount} / {questions.length} ({Math.round(score * 100)}%)
          </h3>
          <p className="body" style={{ marginBottom: 'var(--space-4)' }}>
            {passed
              ? 'Topic mastered. This will resurface for review at expanding intervals (1d, 3d, 7d, 21d, 60d) to lock it in.'
              : `You need at least ${Math.round(passing * 100)}% to certify mastery. Revisit the weak sub-rules and try again.`}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={onExit}>
              Back to topic
            </button>
            {!passed && (
              <button type="button" className="btn btn-primary" onClick={start}>
                Retake test
              </button>
            )}
          </div>
        </div>
        {/* Per-question breakdown */}
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 'var(--space-2)' }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                aspectRatio: '1',
                borderRadius: 'var(--r-md)',
                background: results[i]?.correct ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
                border: `1px solid ${results[i]?.correct ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 600,
                color: results[i]?.correct ? '#34d399' : '#f87171',
              }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Running
  const q = questions[currentIdx];
  const answered = !!results[currentIdx];

  return (
    <div>
      {/* Timer + progress */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div className="eyebrow">Question {currentIdx + 1} of {questions.length}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-mono)', color: remaining < 60 ? 'var(--error)' : 'var(--text-primary)' }}>
            <Icon name="clock" size={16} />
            {formatTime(remaining)}
          </div>
        </div>
        <div style={{ height: 4, borderRadius: 'var(--r-pill)', background: 'var(--tag-bg)', overflow: 'hidden' }}>
          <div style={{
            width: `${((currentIdx + (answered ? 1 : 0)) / questions.length) * 100}%`,
            height: '100%',
            background: 'var(--purple-500)',
            transition: 'width var(--dur-base) var(--ease)',
          }} />
        </div>
      </div>

      <div className="panel" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
        <Exercise
          key={currentIdx}
          exercise={q}
          onResult={handleResult}
          hideFeedback={true}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <button type="button" className="btn btn-ghost" onClick={finish}>
          End test
        </button>
        <button type="button" className="btn btn-primary" onClick={handleNext} disabled={!answered}>
          {currentIdx + 1 < questions.length ? 'Next' : 'Finish'} <Icon name="arrowRight" size={16} />
        </button>
      </div>
    </div>
  );
};

export default MasteryTest;
