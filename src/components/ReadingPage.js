import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { readingPassage1Tests } from '../data/reading-passage1';
import { readingPassage2Tests } from '../data/reading-passage2';
import { readingPassage3Tests } from '../data/reading-passage3';

const ReadingPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(20 * 60);
  const [timerMode, setTimerMode] = useState('countdown');
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [panelWidth, setPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [completedTests, setCompletedTests] = useState(() => {
    const key = `completedReading_${subPage || 'passage1'}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    const key = `completedReading_${subPage || 'passage1'}`;
    const saved = localStorage.getItem(key);
    setCompletedTests(saved ? JSON.parse(saved) : []);
  }, [subPage]);
  const [highlightPopup, setHighlightPopup] = useState({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
  const timerRef = useRef(null);
  const passageRef = useRef(null);
  const questionsRef = useRef(null);
  const containerRef = useRef(null);

  // Inject CSS for timer blink animation and input placeholder styling
  useEffect(() => {
    const styleId = 'timer-blink-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html {
          overflow-y: scroll;
        }
        @keyframes timerBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .completion-input::placeholder {
          font-family: inherit;
          text-align: center;
          color: var(--text-muted);
          opacity: 0.6;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Get the correct test array based on subPage
  const getTestArray = () => {
    if (subPage === 'passage3') return readingPassage3Tests;
    if (subPage === 'passage2') return readingPassage2Tests;
    return readingPassage1Tests;
  };

  const selectedTest = selectedTestId ? getTestArray().find(t => t.id === selectedTestId) : null;

  // Parse URL on mount and on popstate (back/forward)
  useEffect(() => {
    const syncFromUrl = () => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'reading' && pathParts[1] && pathParts[2]) {
        const testId = parseInt(pathParts[2]);
        const passage = pathParts[1];
        const tests = passage === 'passage3' ? readingPassage3Tests : passage === 'passage2' ? readingPassage2Tests : readingPassage1Tests;
        if (tests.find(t => t.id === testId)) {
          setSelectedTestId(testId);
          setSubPage(passage);
          return;
        }
      }
      // No test ID in URL - clear selection
      setSelectedTestId(null);
      setUserAnswers({});
      setShowResults(false);
      setShowResultsModal(false);
      setTimerRunning(false);
      clearInterval(timerRef.current);
      if (pathParts[0] === 'reading' && pathParts[1]) {
        setSubPage(pathParts[1]);
      }
    };
    syncFromUrl();
    const handleReadingPopState = () => syncFromUrl();
    window.addEventListener('popstate', handleReadingPopState);
    return () => window.removeEventListener('popstate', handleReadingPopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer logic
  useEffect(() => {
    if (selectedTest && timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerMode === 'countdown') {
            return prev <= 0 ? 0 : prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [selectedTest, timerRunning, timerMode]);

  // Handle dragging for panel resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth >= 25 && newWidth <= 75) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Highlight popup on text selection
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Small delay to let selection complete
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          const range = selection.getRangeAt(0);
          const passageEl = passageRef.current;
          const questionsEl = questionsRef.current;
          
          // Check if selection is within our content areas
          if ((passageEl && passageEl.contains(range.commonAncestorContainer)) ||
              (questionsEl && questionsEl.contains(range.commonAncestorContainer))) {
            
            // Check if selection is inside an existing highlight
            let parent = range.commonAncestorContainer;
            while (parent && parent !== document.body) {
              if (parent.classList && parent.classList.contains('user-highlight')) {
                setHighlightPopup({
                  show: true,
                  x: e.clientX,
                  y: e.clientY - 50,
                  range: null,
                  isHighlighted: true,
                  highlightEl: parent
                });
                return;
              }
              parent = parent.parentNode;
            }
            
            setHighlightPopup({
              show: true,
              x: e.clientX,
              y: e.clientY - 50,
              range: range.cloneRange(),
              isHighlighted: false,
              highlightEl: null
            });
          }
        }
      }, 10);
    };

    const handleMouseDown = (e) => {
      // Hide popup if clicking outside
      if (!e.target.closest('.highlight-popup')) {
        setHighlightPopup({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
      }
    };

    if (selectedTest) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousedown', handleMouseDown);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [selectedTest]);

  const applyHighlight = () => {
    if (highlightPopup.range) {
      try {
        const span = document.createElement('span');
        span.style.backgroundColor = 'rgba(255, 235, 59, 0.6)';
        span.style.borderRadius = '2px';
        span.style.padding = '0 2px';
        span.className = 'user-highlight';
        highlightPopup.range.surroundContents(span);
        window.getSelection().removeAllRanges();
      } catch (e) {
        // Cross-element selection - ignore
      }
    }
    setHighlightPopup({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
  };

  const removeHighlight = () => {
    if (highlightPopup.highlightEl) {
      const parent = highlightPopup.highlightEl.parentNode;
      const text = document.createTextNode(highlightPopup.highlightEl.textContent);
      parent.replaceChild(text, highlightPopup.highlightEl);
      parent.normalize();
    }
    window.getSelection().removeAllRanges();
    setHighlightPopup({ show: false, x: 0, y: 0, range: null, isHighlighted: false });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = (testId) => {
    if (!user) {
      setCurrentPage('login');
      return;
    }
    setSelectedTestId(testId);
    setUserAnswers({});
    setShowResults(false);
    setShowResultsModal(false);
    setTimerSeconds(timerMode === 'countdown' ? 20 * 60 : 0);
    setTimerRunning(true);
    window.history.pushState({}, '', `/reading/${subPage}/${testId}`);
  };

  const exitTest = () => {
    setSelectedTestId(null);
    setUserAnswers({});
    setShowResults(false);
    setShowResultsModal(false);
    setTimerRunning(false);
    clearInterval(timerRef.current);
    // Remove highlights
    document.querySelectorAll('.user-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    window.history.pushState({}, '', `/reading/${subPage}`);
  };

  const handleAnswerChange = (questionNum, value) => {
    if (!showResults) {
      setUserAnswers(prev => ({ ...prev, [questionNum]: value }));
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    setShowResultsModal(true);
    setTimerRunning(false);
    // Mark test as completed
    if (!completedTests.includes(selectedTestId)) {
      const newCompleted = [...completedTests, selectedTestId];
      setCompletedTests(newCompleted);
      localStorage.setItem(`completedReading_${subPage || 'passage1'}`, JSON.stringify(newCompleted));
    }
  };

  const calculateScore = () => {
    if (!selectedTest) return { correct: 0, total: 0 };
    let correct = 0;
    let total = 0;
    selectedTest.questions.forEach(section => {
      section.items.forEach(item => {
        total++;
        const userAns = (userAnswers[item.num] || '').toLowerCase().trim();
        const correctAns = item.answer.toLowerCase().trim();
        if (userAns === correctAns) correct++;
      });
    });
    return { correct, total };
  };

  const getBandScore = (correct, total) => {
    const pct = (correct / total) * 100;
    if (pct >= 90) return 9;
    if (pct >= 80) return 8;
    if (pct >= 70) return 7;
    if (pct >= 60) return 6;
    if (pct >= 50) return 5;
    if (pct >= 40) return 4;
    if (pct >= 30) return 3;
    return 2;
  };

  const scrollToQuestion = (num) => {
    const el = document.getElementById(`question-${num}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ========== Overview Page ==========
  if (subPage === 'overview') {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            📖 Reading Section
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Practice with authentic IELTS reading passages and questions
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div 
              onClick={() => { setSubPage('passage1'); window.history.pushState({}, '', '/reading/passage1'); }}
              style={{ 
                padding: '2rem', borderRadius: '16px', 
                background: 'linear-gradient(135deg, var(--purple-600-10), var(--purple-700-5))', 
                border: '1px solid var(--purple-500-30)', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '1rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1', height: 'fit-content' }>40 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 1 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>13 questions • T/F/NG, completion, matching, MCQ</p>
            </div>

            <div 
              onClick={() => { setSubPage('passage2'); window.history.pushState({}, '', '/reading/passage2'); }}
              style={{ 
                padding: '2rem', borderRadius: '16px', 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))', 
                border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '1rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1', height: 'fit-content' }>20 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 2 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>13 questions • Matching headings, MCQ, T/F/NG, completion</p>
            </div>

            <div 
              onClick={() => { setSubPage('passage3'); window.history.pushState({}, '', '/reading/passage3'); }}
              style={{ 
                padding: '2rem', borderRadius: '16px', background: 'var(--card-bg)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '1rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1', height: 'fit-content' }>9 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 3 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>14 questions • Advanced difficulty • Matching, MCQ, T/F/NG</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== Passage 1 Test List ==========
  if (subPage === 'passage1' && !selectedTestId) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <button
            onClick={() => { setSubPage('overview'); window.history.pushState({}, '', '/reading'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ← Back to Overview
          </button>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Passage 1 Practice Tests
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            12–13 questions per test • 20 minutes recommended
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {readingPassage1Tests.map((test) => {
              const isCompleted = completedTests.includes(test.id);
              return (
                <div
                  key={test.id}
                  onClick={() => startTest(test.id)}
                  style={{
                    padding: '1.5rem', borderRadius: '12px', background: 'var(--card-bg)',
                    border: `1px solid ${isCompleted ? '#22c55e' : 'var(--border-color)'}`, 
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  {isCompleted && (
                    <div style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '1rem' }}>✓</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--purple-400)' }}>TEST {test.id}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', paddingRight: isCompleted ? '2rem' : 0 }}>{test.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{test.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== Passage 2 Test List ==========
  if (subPage === 'passage2' && !selectedTestId) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <button
            onClick={() => { setSubPage('overview'); window.history.pushState({}, '', '/reading'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ← Back to Overview
          </button>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Passage 2 Practice Tests
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            13 questions per test • 20 minutes recommended
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {readingPassage2Tests.map((test) => {
              const isCompleted = completedTests.includes(test.id);
              return (
                <div
                  key={test.id}
                  onClick={() => startTest(test.id)}
                  style={{
                    padding: '1.5rem', borderRadius: '12px', background: 'var(--card-bg)',
                    border: `1px solid ${isCompleted ? '#22c55e' : 'var(--border-color)'}`, 
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  {isCompleted && (
                    <div style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '1rem' }}>✓</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#60a5fa' }}>TEST {test.id}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', paddingRight: isCompleted ? '2rem' : 0 }}>{test.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{test.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== Passage 3 Test List ==========
  if (subPage === 'passage3' && !selectedTestId) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <button
            onClick={() => { setSubPage('overview'); window.history.pushState({}, '', '/reading'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ← Back to Overview
          </button>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Passage 3 Practice Tests
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            14 questions per test • 20 minutes recommended • Advanced difficulty
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {readingPassage3Tests.map((test) => {
              const isCompleted = completedTests.includes(test.id);
              return (
                <div
                  key={test.id}
                  onClick={() => startTest(test.id)}
                  style={{
                    padding: '1.5rem', borderRadius: '12px', background: 'var(--card-bg)',
                    border: `1px solid ${isCompleted ? '#22c55e' : 'var(--border-color)'}`, 
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  {isCompleted && (
                    <div style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '1rem' }}>✓</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10b981' }}>TEST {test.id}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', paddingRight: isCompleted ? '2rem' : 0 }}>{test.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{test.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== Active Test View (Full Screen - covers navbar) ==========
  if (selectedTest) {
    const { correct, total } = calculateScore();
    const bandScore = getBandScore(correct, total);
    const allQuestionNums = selectedTest.questions.flatMap(s => s.items.map(i => i.num));

    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', 
        zIndex: 1000, overflow: 'hidden'
      }}>
        {/* Highlight Popup */}
        {highlightPopup.show && (
          <div 
            className="highlight-popup"
            style={{
              position: 'fixed',
              left: Math.min(highlightPopup.x, window.innerWidth - 160),
              top: Math.max(highlightPopup.y, 10),
              background: isDark ? '#2a2a3d' : 'white',
              borderRadius: '12px',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.12)',
              padding: '0.35rem',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '150px',
              zIndex: 2000,
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <button
              onClick={highlightPopup.isHighlighted ? removeHighlight : applyHighlight}
              style={{
                padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none',
                background: 'transparent', color: isDark ? 'var(--text-primary)' : '#333', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '0.6rem',
                textAlign: 'left', width: '100%'
              }}
              onMouseEnter={e => e.target.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
              onMouseLeave={e => e.target.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              Highlight
            </button>
            {highlightPopup.isHighlighted && (
              <button
                onClick={removeHighlight}
                style={{
                  padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none',
                  background: 'transparent', color: isDark ? 'var(--text-primary)' : '#333', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  textAlign: 'left', width: '100%'
                }}
                onMouseEnter={e => e.target.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
                Clear
              </button>
            )}
            {!highlightPopup.isHighlighted && (
              <button
                onClick={() => setHighlightPopup({ show: false, x: 0, y: 0, range: null, isHighlighted: false })}
                style={{
                  padding: '0.55rem 0.75rem', borderRadius: '8px', border: 'none',
                  background: 'transparent', color: isDark ? 'var(--text-primary)' : '#333', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '400', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  textAlign: 'left', width: '100%'
                }}
                onMouseEnter={e => e.target.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
                Clear
              </button>
            )}
          </div>
        )}

        {/* ===== FIXED HEADER ===== */}
        <header style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
          padding: '0.75rem 1.5rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)',
          flexShrink: 0, zIndex: 100
        }}>
          {/* Left: logo + test name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--purple-500)' }}>IELTS</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Test {selectedTest.id}</span>
          </div>

          {/* Center: Timer - always centered */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '36px' }}>
            {/* Hide/Show button */}
            <button onClick={() => setShowTimer(!showTimer)} title={showTimer ? 'Hide timer' : 'Show timer'}
              style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              {showTimer ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
            
            {/* Timer display - use visibility instead of conditional render to keep size stable */}
            <div 
              onClick={() => setTimerRunning(!timerRunning)}
              title={timerRunning ? 'Click to pause' : 'Click to resume'}
              style={{
                display: 'flex', alignItems: 'center', padding: '0.35rem 0.75rem',
                background: !showTimer ? 'transparent' : (timerMode === 'countdown' && timerSeconds <= 120) || (timerMode === 'stopwatch' && timerSeconds >= 1080) ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)', 
                borderRadius: '8px', border: showTimer ? '1px solid var(--border-color)' : '1px solid transparent',
                cursor: showTimer ? 'pointer' : 'default',
                animation: !timerRunning && showTimer ? 'timerBlink 1s ease-in-out infinite' : 'none',
                visibility: showTimer ? 'visible' : 'hidden'
              }}>
              <span style={{ 
                fontSize: '1.1rem', fontWeight: '600', 
                color: (timerMode === 'countdown' && timerSeconds <= 120) || (timerMode === 'stopwatch' && timerSeconds >= 1080) ? '#ef4444' : 'var(--text-primary)', 
                fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums'
              }}>
                {formatTime(timerSeconds)}
              </span>
            </div>
            
            {/* Mode toggle button */}
            <button onClick={() => { setTimerMode(m => m === 'countdown' ? 'stopwatch' : 'countdown'); setTimerSeconds(timerMode === 'countdown' ? 0 : 20*60); }} title={timerMode === 'countdown' ? 'Switch to stopwatch' : 'Switch to countdown'}
              style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              {timerMode === 'countdown' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="8"/>
                  <path d="M12 9v4l2 2"/>
                  <path d="M5 3L2 6"/>
                  <path d="M22 6l-3-3"/>
                  <path d="M9 1h6"/>
                  <path d="M12 1v3"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              )}
            </button>
          </div>

          {/* Right: theme toggle + exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <button onClick={exitTest}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}>
              Exit
            </button>
          </div>
        </header>

        {/* ===== INSTRUCTION BAR ===== */}
        <div style={{ padding: '0.75rem 1.5rem', background: isDark ? '#1e293b' : '#f1f5f9', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Read the text and answer questions 1-13</p>
        </div>

        {/* ===== MAIN CONTENT AREA ===== */}
        <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* LEFT PANEL - Passage */}
          <div 
            ref={passageRef}
            style={{ 
              width: `${panelWidth}%`, 
              overflowY: 'auto', 
              padding: '1.5rem',
              borderRight: '1px solid var(--border-color)',
              background: 'var(--bg-primary)'
            }}
          >
            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', color: 'var(--purple-500)', marginBottom: '0.5rem' }}>
              {selectedTest.title}
            </h2>
            {selectedTest.subtitle && selectedTest.subtitleInPassage && <p style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>
              {selectedTest.subtitle}
            </p>}
            <div 
              className="passage-content"
              style={{ color: 'var(--text-primary)', lineHeight: '1.9', fontSize: '1.05rem' }}
              dangerouslySetInnerHTML={{ __html: selectedTest.passage.replace(/<\/p>/g, '</p><br/>') }}
            />
          </div>

          {/* DRAGGABLE DIVIDER */}
          <div
            onMouseDown={() => setIsDragging(true)}
            style={{
              width: '6px', cursor: 'col-resize', background: isDragging ? 'var(--purple-500)' : 'var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.2s'
            }}
          >
            <div style={{ width: '2px', height: '40px', background: isDragging ? 'white' : 'var(--text-muted)', borderRadius: '2px' }} />
          </div>

          {/* RIGHT PANEL - Questions */}
          <div 
            ref={questionsRef}
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '1.5rem',
              background: 'var(--bg-primary)'
            }}
          >
            {selectedTest.questions.map((section, sIdx) => (
              <div key={sIdx} style={{ marginBottom: '2rem' }}>
                {/* Question rubric */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{section.rubric}</h4>
                  <p 
                    style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ 
                      __html: section.instruction
                        .replace(/(NO MORE THAN [A-Z\s]+WORDS?)/gi, '<strong style="color: var(--text-primary)">$1</strong>')
                        .replace(/(ONE WORD ONLY)/gi, '<strong style="color: var(--text-primary)">$1</strong>')
                        .replace(/(ONE WORD AND\/OR A NUMBER)/gi, '<strong style="color: var(--text-primary)">$1</strong>')
                    }}
                  />
                </div>

                {/* Section title (for completion type) */}
                {section.title && (
                  <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--purple-500)', paddingBottom: '0.5rem' }}>
                    {section.title}
                  </h3>
                )}

                {/* T/F/NG & Y/N/NG Questions */}
                {(section.type === 'tfng' || section.type === 'ynng') && section.items.map((item) => {
                  const userAns = userAnswers[item.num] || '';
                  const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                  const isWrong = showResults && userAns && !isCorrect;

                  return (
                    <div 
                      key={item.num} 
                      id={`question-${item.num}`}
                      style={{ marginBottom: '1.5rem' }}
                    >
                      <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
                        <strong style={{ color: 'var(--purple-400)' }}>{item.num}.</strong> {item.text}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(section.type === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map(opt => (
                          <label key={opt} style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem',
                            borderRadius: '8px', cursor: showResults ? 'default' : 'pointer',
                            border: `1px solid ${showResults && item.answer.toUpperCase() === opt ? '#22c55e' : 'var(--border-color)'}`,
                            background: showResults 
                              ? (item.answer.toUpperCase() === opt ? 'rgba(34, 197, 94, 0.1)' : (userAns === opt && !isCorrect ? 'rgba(239, 68, 68, 0.1)' : 'transparent'))
                              : (userAns === opt ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)') : 'transparent')
                          }}>
                            <input type="radio" name={`q${item.num}`} value={opt} checked={userAns === opt}
                              onChange={() => handleAnswerChange(item.num, opt)} disabled={showResults}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--purple-500)' }} />
                            <span style={{ color: 'var(--text-primary)' }}>{opt}</span>
                            {showResults && item.answer.toUpperCase() === opt && <span style={{ marginLeft: 'auto', color: '#22c55e' }}>✓</span>}
                            {showResults && userAns === opt && !isCorrect && <span style={{ marginLeft: 'auto', color: '#ef4444' }}>✗</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* MCQ Questions */}
                {section.type === 'mcq' && section.items.map((item) => {
                  const userAns = userAnswers[item.num] || '';
                  const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();

                  return (
                    <div 
                      key={item.num} 
                      id={`question-${item.num}`}
                      style={{ marginBottom: '1.5rem' }}
                    >
                      <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>
                        <strong style={{ color: 'var(--purple-400)' }}>{item.num}.</strong> {item.question || item.text}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {item.options.map(opt => {
                          // Extract letter and text - handle formats like "A) text" or "A. text" or just "A text"
                          const letterMatch = opt.match(/^([A-D])[\).\s]+(.+)$/);
                          const optLetter = letterMatch ? letterMatch[1] : opt.charAt(0);
                          const optText = letterMatch ? letterMatch[2] : opt.substring(2).trim();
                          const isCorrectOpt = showResults && item.answer.toUpperCase() === optLetter;
                          const isUserChoice = userAns.toUpperCase() === optLetter;
                          
                          return (
                            <label key={opt} style={{ 
                              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem',
                              borderRadius: '8px', cursor: showResults ? 'default' : 'pointer',
                              border: `1px solid ${isCorrectOpt ? '#22c55e' : 'var(--border-color)'}`,
                              background: showResults 
                                ? (isCorrectOpt ? 'rgba(34, 197, 94, 0.1)' : (isUserChoice && !isCorrect ? 'rgba(239, 68, 68, 0.1)' : 'transparent'))
                                : (isUserChoice ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)') : 'transparent')
                            }}>
                              <input type="radio" name={`q${item.num}`} value={optLetter} checked={isUserChoice}
                                onChange={() => handleAnswerChange(item.num, optLetter)} disabled={showResults}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--purple-500)' }} />
                              <span style={{ color: 'var(--text-primary)' }}>{optText}</span>
                              {isCorrectOpt && <span style={{ marginLeft: 'auto', color: '#22c55e' }}>✓</span>}
                              {showResults && isUserChoice && !isCorrect && <span style={{ marginLeft: 'auto', color: '#ef4444' }}>✗</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Matching Questions */}
                {section.type === 'matching' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {section.items.map((item) => {
                      const userAns = userAnswers[item.num] || '';
                      const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                      const isWrong = showResults && userAns && !isCorrect;

                      return (
                        <div 
                          key={item.num} 
                          id={`question-${item.num}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                        >
                          <strong style={{ color: 'var(--purple-400)', minWidth: '30px' }}>{item.num}.</strong>
                          <span style={{ color: 'var(--text-primary)', flex: 1, minWidth: '200px', fontSize: '1.05rem' }}>{item.text}</span>
                          <input 
                            type="text" 
                            value={userAns} 
                            onChange={(e) => handleAnswerChange(item.num, e.target.value.toUpperCase())}
                            disabled={showResults} 
                            maxLength={1} 
                            placeholder="_"
                            style={{ 
                              width: '45px', padding: '0.5rem', textAlign: 'center', borderRadius: '6px', 
                              border: `2px solid ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`,
                              background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)',
                              color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: '600', fontSize: '1rem'
                            }} 
                          />
                          {showResults && isWrong && (
                            <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>✗ {item.answer}</span>
                          )}
                          {showResults && isCorrect && (
                            <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Completion Questions */}
                {section.type === 'completion' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {section.noteLines ? (
                      /* Note completion: structured with headings, context bullets, and question bullets */
                      section.noteLines.map((line, lIdx) => {
                        if (line.lineType === 'heading') {
                          return <p key={lIdx} style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: lIdx > 0 ? '1rem' : '0', marginBottom: '0.25rem' }}>{line.text}</p>;
                        }
                        if (line.lineType === 'context') {
                          return <p key={lIdx} style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: '1.6', paddingLeft: '1rem' }}>• {line.text}</p>;
                        }
                        if (line.lineType === 'question') {
                          const item = section.items.find(it => it.num === line.num);
                          if (!item) return null;
                          const userAns = userAnswers[line.num] || '';
                          const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                          const isWrong = showResults && userAns && !isCorrect;
                          return (
                            <div key={lIdx} id={`question-${line.num}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: '1.8', paddingLeft: '1rem' }}>
                              <span>• {line.beforeText}</span>
                              <input type="text" value={userAns} onChange={(e) => handleAnswerChange(line.num, e.target.value)} disabled={showResults} placeholder={String(line.num)} className="completion-input"
                                style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', minWidth: '140px', maxWidth: '200px', border: `2px dashed ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`, background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1.05rem', fontFamily: 'inherit', textAlign: 'center' }} />
                              {line.afterText && <span>{line.afterText}</span>}
                              {showResults && (
                                <span style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                  {isCorrect ? '✓' : `✗ Correct: ${item.answer}`}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })
                    ) : (
                      /* Sentence/Summary completion: each sentence with inline input */
                      section.items.map((item) => {
                        const userAns = userAnswers[item.num] || '';
                        const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                        const isWrong = showResults && userAns && !isCorrect;
                        return (
                          <div key={item.num} id={`question-${item.num}`} style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: '2.2', marginBottom: '0.75rem' }}>
                            {item.beforeText && <span>{item.beforeText} </span>}
                            <input type="text" value={userAns} onChange={(e) => handleAnswerChange(item.num, e.target.value)} disabled={showResults} placeholder={String(item.num)} className="completion-input"
                              style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', minWidth: '140px', maxWidth: '200px', border: `2px dashed ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`, background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1.05rem', fontFamily: 'inherit', textAlign: 'center', verticalAlign: 'middle' }} />
                            {item.afterText && <span> {item.afterText}</span>}
                            {showResults && (
                              <span style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                {isCorrect ? '✓' : `✗ ${item.answer}`}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Short Answer Questions */}
                {section.type === 'short-answer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {section.items.map((item) => {
                      const userAns = userAnswers[item.num] || '';
                      const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                      const isWrong = showResults && userAns && !isCorrect;
                      return (
                        <div key={item.num} id={`question-${item.num}`} style={{ marginBottom: '0.5rem' }}>
                          <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
                            <strong style={{ color: 'var(--purple-400)' }}>{item.num}.</strong> {item.text}
                          </p>
                          <input type="text" value={userAns} onChange={(e) => handleAnswerChange(item.num, e.target.value)} disabled={showResults} placeholder="Type your answer..."
                            style={{ width: '100%', maxWidth: '400px', padding: '0.6rem 1rem', borderRadius: '6px', border: `2px solid ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`, background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1.05rem', fontFamily: 'inherit' }} />
                          {showResults && (
                            <span style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontSize: '0.85rem', marginLeft: '0.75rem' }}>
                              {isCorrect ? '✓' : `✗ Correct: ${item.answer}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Matching Headings Questions */}
                {section.type === 'matching-headings' && (
                  <div>
                    {/* List of headings */}
                    <div style={{ 
                      background: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      marginBottom: '1.5rem',
                      border: '1px solid var(--purple-500-30)'
                    }}>
                      <p style={{ fontWeight: '600', color: 'var(--purple-400)', marginBottom: '0.75rem' }}>List of Headings</p>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {section.headings.map((heading, idx) => (
                          <p key={idx} style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{heading}</p>
                        ))}
                      </div>
                    </div>
                    {/* Questions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {section.items.map((item) => {
                        const userAns = userAnswers[item.num] || '';
                        const isCorrect = showResults && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
                        const isWrong = showResults && userAns && !isCorrect;

                        return (
                          <div 
                            key={item.num} 
                            id={`question-${item.num}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                          >
                            <strong style={{ color: 'var(--purple-400)', minWidth: '30px' }}>{item.num}.</strong>
                            <span style={{ color: 'var(--text-primary)', minWidth: '100px', fontSize: '1.05rem' }}>Paragraph {item.paragraph}</span>
                            <input 
                              type="text" 
                              value={userAns} 
                              onChange={(e) => handleAnswerChange(item.num, e.target.value.toLowerCase())}
                              disabled={showResults} 
                              maxLength={4} 
                              placeholder="___"
                              style={{ 
                                width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '6px', 
                                border: `2px solid ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`,
                                background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)',
                                color: 'var(--text-primary)', fontWeight: '600', fontSize: '1rem'
                              }} 
                            />
                            {showResults && isWrong && (
                              <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>✗ {item.answer}</span>
                            )}
                            {showResults && isCorrect && (
                              <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Matching Information Questions */}
                {section.type === 'matching-info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                      NB: You may use any letter more than once.
                    </p>
                    {section.items.map((item) => {
                      const userAns = userAnswers[item.num] || '';
                      const isCorrect = showResults && userAns.toUpperCase().trim() === item.answer.toUpperCase().trim();
                      const isWrong = showResults && userAns && !isCorrect;
                      // Determine dropdown options based on paragraphRange or default to A-I
                      const paragraphRange = section.paragraphRange || 'A-I';
                      const rangeMatch = paragraphRange.match(/([A-Z])-([A-Z])/);
                      const startChar = rangeMatch ? rangeMatch[1].charCodeAt(0) : 65;
                      const endChar = rangeMatch ? rangeMatch[2].charCodeAt(0) : 73;
                      const options = [];
                      for (let i = startChar; i <= endChar; i++) {
                        options.push(String.fromCharCode(i));
                      }

                      return (
                        <div 
                          key={item.num} 
                          id={`question-${item.num}`}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}
                        >
                          <strong style={{ color: 'var(--purple-400)', minWidth: '30px', paddingTop: '0.25rem' }}>{item.num}.</strong>
                          <span style={{ color: 'var(--text-primary)', flex: 1, minWidth: '200px', lineHeight: '1.6', fontSize: '1.05rem' }}>{item.text}</span>
                          <select 
                            value={userAns} 
                            onChange={(e) => handleAnswerChange(item.num, e.target.value.toUpperCase())}
                            disabled={showResults} 
                            style={{ 
                              width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '6px', 
                              border: `2px solid ${showResults ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border-color)') : 'var(--border-color)'}`,
                              background: showResults ? (isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'var(--input-bg)') : 'var(--input-bg)',
                              color: 'var(--text-primary)', textTransform: 'uppercase', fontWeight: '600', fontSize: '1rem',
                              cursor: showResults ? 'not-allowed' : 'pointer'
                            }} 
                          >
                            <option value="">--</option>
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          {showResults && isWrong && (
                            <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>✗ {item.answer}</span>
                          )}
                          {showResults && isCorrect && (
                            <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== FIXED FOOTER ===== */}
        <footer style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.5rem', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)',
          flexShrink: 0, zIndex: 100
        }}>
          {/* Question numbers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: 'white', marginRight: '0.5rem', padding: '0.4rem 0.75rem', background: 'var(--purple-600)', borderRadius: '6px', fontSize: '0.85rem' }}>Part 1</span>
            {allQuestionNums.map(num => {
              const answered = !!userAnswers[num];
              const userAns = userAnswers[num] || '';
              const item = selectedTest.questions.flatMap(s => s.items).find(i => i.num === num);
              const isCorrect = showResults && item && userAns.toLowerCase().trim() === item.answer.toLowerCase().trim();
              const isWrong = showResults && answered && !isCorrect;
              
              return (
                <button
                  key={num}
                  onClick={() => scrollToQuestion(num)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                    background: showResults 
                      ? (isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--bg-secondary)')
                      : (answered ? 'var(--purple-600)' : 'var(--bg-secondary)'),
                    color: (showResults ? (isCorrect || isWrong) : answered) ? 'white' : 'var(--text-secondary)',
                    fontWeight: '500', fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              );
            })}
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {Object.keys(userAnswers).length} of {allQuestionNums.length}
            </span>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={showResults}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
              background: showResults ? '#22c55e' : 'var(--purple-600)',
              color: 'white', fontWeight: '600', cursor: showResults ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {showResults ? `✓ Score: ${correct}/${total} (Band ${bandScore})` : '✓ Submit'}
          </button>
        </footer>

        {/* Results Modal */}
        {showResultsModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
          }} onClick={() => setShowResultsModal(false)}>
            <div style={{
              background: 'var(--card-bg)', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.5rem' }}>Test Results</h2>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'var(--purple-400)' }}>{correct}/{total}</div>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Band Score: {bandScore}</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Time taken: {formatTime(timerMode === 'countdown' ? (20*60 - timerSeconds) : timerSeconds)}
              </p>
              <button
                onClick={() => setShowResultsModal(false)}
                style={{ padding: '0.75rem 2rem', borderRadius: '10px', border: 'none', background: 'var(--purple-600)', color: 'white', fontWeight: '600', cursor: 'pointer' }}
              >
                Review Answers
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};


export default ReadingPage;
