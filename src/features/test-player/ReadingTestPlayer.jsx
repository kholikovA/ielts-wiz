import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import './player.css';
import { useHighlighter } from './useHighlighter';
import PassagePane from './components/PassagePane';
import QuestionGroup from './components/QuestionGroup';
import ResultsScreen from './components/ResultsScreen';
import { buildLabelResolver } from './components/review';
import { gradeTest } from './grading';
import { recordAttempt, loadLastSubmission, loadLastSubmissionCloud } from './recording';
import { downloadResultImage, shareResultImage } from './resultImage';
import { useAuth } from '../../contexts/AuthContext';

const keyOf = (g) => {
  const ns = g.questions.map((q) => q.number).sort((a, b) => a - b);
  return `${g.type}_${ns[0]}_${ns[ns.length - 1]}`;
};

// All question numbers in a part (sorted, deduped).
const partQnums = (part) => {
  const ns = [];
  part.question_groups.forEach((g) => g.questions.forEach((q) => ns.push(q.number)));
  return [...new Set(ns)].sort((a, b) => a - b);
};

// Footer palette entries — mcq_multi groups collapse to one range button, the
// rest are individual question buttons. Mirrors build_test.py's render_footer.
const paletteEntries = (part) => {
  const used = new Set();
  const entries = [];
  part.question_groups.forEach((g) => {
    if (g.type === 'mcq_multi') {
      const gn = [...new Set(g.questions.map((q) => q.number))].sort((a, b) => a - b);
      if (gn.length) {
        entries.push({ label: gn.length > 1 ? `${gn[0]}–${gn[gn.length - 1]}` : `${gn[0]}`, primary: gn[0], qnums: gn });
        gn.forEach((n) => used.add(n));
      }
    }
  });
  partQnums(part).forEach((q) => { if (!used.has(q)) entries.push({ label: `${q}`, primary: q, qnums: [q] }); });
  return entries.sort((a, b) => a.primary - b.primary);
};

// `test` is a manifest entry { kind, id, spec, source, n }. `review` replays the
// user's last saved submission read-only instead of starting a fresh attempt.
export default function ReadingTestPlayer({ test, review = false, onExit }) {
  const { spec, kind, id } = test;
  const { user } = useAuth();
  const solverName = (user
    && (user.user_metadata?.full_name || user.user_metadata?.name || user.email)) || '';

  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [grade, setGrade] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [inContext, setInContext] = useState(false);
  const [banner, setBanner] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState((spec.duration_minutes || 60) * 60);
  const [elapsedSec, setElapsedSec] = useState(null);

  const setAnswer = useCallback((q, v) => {
    setCurrentQ(q);
    setAnswers((a) => {
      const n = { ...a };
      if (v === '' || v == null) delete n[q];
      else n[q] = v;
      return n;
    });
  }, []);

  // Review mode: load the saved submission (local first, cloud fallback for
  // cross-device), replay its answers read-only, and show the result.
  useEffect(() => {
    if (!review) return undefined;
    const apply = (saved) => {
      setAnswers(saved.answers);
      setGrade(gradeTest(spec, saved.answers));
      setSubmittedAt(saved.ts ? new Date(saved.ts) : new Date());
      setElapsedSec(saved.elapsedSec ?? null);
      setBanner('You are viewing your previous attempt. Answers are read-only.');
    };
    const local = loadLastSubmission(kind, id);
    if (local && local.answers && Object.keys(local.answers).length) { apply(local); return undefined; }
    let cancelled = false;
    setBanner('Loading your previous attempt…');
    Promise.resolve(loadLastSubmissionCloud(kind, id)).then((remote) => {
      if (cancelled) return;
      if (remote && remote.answers && Object.keys(remote.answers).length) apply(remote);
      else setBanner('No saved attempt found — start the test to create one.');
    }).catch(() => { if (!cancelled) setBanner('No saved attempt found — start the test to create one.'); });
    return () => { cancelled = true; };
  }, [review, kind, id, spec]);

  const { groupByKey, mhByPart } = useMemo(() => {
    const byKey = {};
    spec.parts.forEach((part) => {
      part.question_groups.forEach((g) => {
        if (g.type === 'matching_headings' || g.type === 'sentence_endings') {
          const labels = {};
          (g.heading_bank || g.ending_bank || []).forEach((it) => { labels[it.id ?? it.letter] = it.text; });
          byKey[keyOf(g)] = { qnums: g.questions.map((q) => q.number), labels };
        } else if (g.type === 'summary_completion' && g.layout?.word_bank) {
          // word-bank summary is drag-and-drop: words dragged into prose gaps
          const labels = {};
          g.layout.word_bank.forEach((it) => { labels[it.letter] = it.text; });
          byKey[keyOf(g)] = { qnums: g.questions.map((q) => q.number), labels };
        }
      });
    });
    const mh = spec.parts.map((part) => {
      const g = part.question_groups.find((q) => q.type === 'matching_headings');
      if (!g) return null;
      const letterToQnum = {};
      g.questions.forEach((q) => { letterToQnum[q.paragraph] = q.number; });
      return { key: keyOf(g), letterToQnum };
    });
    return { groupByKey: byKey, mhByPart: mh };
  }, [spec]);

  const place = useMemo(() => ({
    selected,
    select: (key, idv) => setSelected((s) => (s && s.key === key && s.id === idv ? null : { key, id: idv })),
    placedIds: (key) => {
      const g = groupByKey[key];
      const s = new Set();
      if (g) g.qnums.forEach((qn) => { if (answers[qn]) s.add(answers[qn]); });
      return s;
    },
    placeAt: (key, qnum) => setSelected((sel) => { if (sel && sel.key === key) setAnswer(qnum, sel.id); return null; }),
    clearAt: (qnum) => setAnswer(qnum, undefined),
    labelOf: (key, idv) => (groupByKey[key]?.labels[idv]) ?? idv,
    dropAt: (key, qnum, e) => {
      e.preventDefault();
      try { const d = JSON.parse(e.dataTransfer.getData('text/plain')); if (d.key === key) setAnswer(qnum, d.id); } catch { /* not a placement */ }
    },
  }), [selected, answers, groupByKey, setAnswer]);

  const totalQuestions = useMemo(
    () => spec.parts.reduce((n, p) => n + p.question_groups.reduce((m, g) => m + g.questions.length, 0), 0),
    [spec]
  );
  const answeredCount = Object.keys(answers).length;
  const resolver = useMemo(() => buildLabelResolver(spec), [spec]);
  const resultsByQ = useMemo(() => {
    const m = {};
    (grade?.results || []).forEach((r) => { m[r.q] = r; });
    return m;
  }, [grade]);

  const readOnly = !!grade; // in-context review when graded
  const [activePart, setActivePart] = useState(1); // one part shown at a time
  const [currentQ, setCurrentQ] = useState(null); // highlighted/active question number
  const allQnums = useMemo(() => {
    const ns = [];
    spec.parts.forEach((p) => p.question_groups.forEach((g) => g.questions.forEach((q) => ns.push(q.number))));
    return [...new Set(ns)].sort((a, b) => a - b);
  }, [spec]);
  const partOfQnum = useMemo(() => {
    const m = {};
    spec.parts.forEach((p) => p.question_groups.forEach((g) => g.questions.forEach((q) => { m[q.number] = p.part_number; })));
    return m;
  }, [spec]);
  const scrollTimers = useRef({});
  const onPaneScroll = useCallback((e) => {
    const el = e.currentTarget;
    el.classList.add('scrolling');
    clearTimeout(scrollTimers.current[el.id]);
    scrollTimers.current[el.id] = setTimeout(() => el.classList.remove('scrolling'), 900);
  }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light');
  const [textSize, setTextSize] = useState('default');
  const passageRef = useRef(null);
  const [highlightOn, setHighlightOn] = useState(true);
  const { tip: hlTip, apply: applyHighlight } = useHighlighter(passageRef, highlightOn);

  // Draggable split divider — resizes the passage/questions panes. Listeners are
  // attached on mousedown and torn down on mouseup; preventDefault + user-select
  // none stop the drag from selecting passage text.
  const containerRef = useRef(null);
  const [splitPct, setSplitPct] = useState(50);
  const startDrag = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const onMove = (ev) => {
      const r = container.getBoundingClientRect();
      setSplitPct(Math.min(78, Math.max(22, ((ev.clientX - r.left) / r.width) * 100)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      try { document.body.style.cursor = ''; document.body.style.userSelect = ''; } catch { /* noop */ }
    };
    try { document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; } catch { /* noop */ }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const doSubmit = useCallback(() => {
    const g = gradeTest(spec, answers);
    const elapsed = (spec.duration_minutes || 60) * 60 - secondsLeft;
    recordAttempt({ kind, id, answers, correct: g.correct, total: g.total, elapsedSec: elapsed, replaying: review });
    setGrade(g);
    setSubmittedAt(new Date());
    setElapsedSec(elapsed);
    setShowConfirm(false);
    try { window.scrollTo(0, 0); } catch { /* jsdom / unsupported */ }
  }, [spec, answers, kind, id, review, secondsLeft]);

  useEffect(() => {
    if (grade || review) return undefined;
    const t = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { clearInterval(t); doSubmit(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [grade, review, doSubmit]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const minutesLeft = Math.max(0, Math.ceil(secondsLeft / 60));
  const activeRange = (() => {
    const qs = partQnums(spec.parts[activePart - 1] || spec.parts[0]);
    return qs.length ? `${qs[0]}–${qs[qs.length - 1]}` : '';
  })();
  const scrollToQ = (qn) => {
    setTimeout(() => {
      const el = document.querySelector(`#questionsPane .question[data-qnum="${qn}"]:not(.hidden), #questionsPane [data-qnum="${qn}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  };
  // Move to a specific question: switch to its part, mark it current, scroll to it.
  const goToQuestion = (qn) => {
    if (qn == null) return;
    setCurrentQ(qn);
    if (partOfQnum[qn]) setActivePart(partOfQnum[qn]);
    scrollToQ(qn);
  };
  const stepQuestion = (dir) => {
    const idx = currentQ == null ? -1 : allQnums.indexOf(currentQ);
    const next = idx < 0 ? (dir > 0 ? allQnums[0] : allQnums[allQnums.length - 1])
      : allQnums[Math.min(allQnums.length - 1, Math.max(0, idx + dir))];
    goToQuestion(next);
  };
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    } catch { /* unsupported */ }
  };
  const clearHighlights = () => {
    const pane = passageRef.current;
    if (!pane) return;
    pane.querySelectorAll('mark.iw-hl').forEach((m) => {
      const p = m.parentNode;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m);
      p.normalize();
    });
  };

  // Results summary
  if (grade && !inContext) {
    return (
      <div className="rtp-root test-locked" data-theme={theme} data-text-size={textSize} style={{ height: '100vh', overflowY: 'auto' }}>
        <ResultsScreen
          grade={grade}
          spec={spec}
          banner={banner}
          onReviewInContext={() => setInContext(true)}
          onShare={() => shareResultImage({ spec, grade, solverName, submittedAt })}
          onFinish={onExit}
          testKind={kind}
          testId={id}
          elapsedSec={elapsedSec}
          durationSec={(spec.duration_minutes || 60) * 60}
        />
      </div>
    );
  }

  const panes = (
    <div className="split-container" id="splitContainer" ref={containerRef}>
      <div className="pane passage-pane" id="passagePane" ref={passageRef} onScroll={onPaneScroll} style={{ flex: `0 0 ${splitPct}%` }}>
        <PassagePane spec={spec} mhByPart={mhByPart} place={place} answers={answers} readOnly={readOnly} activePart={activePart} />
      </div>
      <div
        className="divider"
        id="divider"
        onMouseDown={startDrag}
        style={{ height: '100%' }}
      >
        <div className="divider-handle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 8 3 12 7 16" /><polyline points="17 8 21 12 17 16" /><line x1="3" y1="12" x2="21" y2="12" /></svg>
        </div>
      </div>
      <div className="pane questions-pane" id="questionsPane" onScroll={onPaneScroll} style={{ flex: '1 1 0%' }}>
        {spec.parts.map((part) => (
          <div className={`questions-section${part.part_number === activePart ? ' active' : ''}`} data-part={part.part_number} key={part.part_number}>
            {part.question_groups.map((g) => (
              <QuestionGroup
                key={keyOf(g)}
                group={g}
                answers={answers}
                onChange={setAnswer}
                place={place}
                readOnly={readOnly}
                currentQ={currentQ}
                results={readOnly ? resultsByQ : null}
                resolver={readOnly ? resolver : null}
                explanations={readOnly ? spec.explanations : null}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`rtp-root${readOnly ? ' test-locked' : ''}`} data-theme={theme} data-text-size={textSize} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="topbar">
        <div className="brand-area">
          <a href="/" className="brand-link" aria-label="IELTS Wiz home" onClick={(e) => { e.preventDefault(); if (onExit) onExit(); }}>
            <img className="brand-logo brand-logo-light" src="/logo-light.svg" alt="IELTS Wiz" />
            <img className="brand-logo brand-logo-dark" src="/logo-dark.svg" alt="IELTS Wiz" />
          </a>
        </div>
        {!review && !readOnly ? (
          <div className="timer" id="timer">
            <span className="timer-mins">{minutesLeft} minutes left</span>
            <span className="timer-secs">{mm}:{ss} left</span>
          </div>
        ) : <div />}
        <div className="topbar-actions">
          <button className="icon-btn" onClick={toggleFullscreen} title="Toggle fullscreen" aria-label="Fullscreen">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" /></svg>
          </button>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings" aria-label="Settings">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          {readOnly ? (
            <>
              <button className="icon-btn" onClick={() => downloadResultImage({ spec, grade, solverName, submittedAt })} title="Download result image" aria-label="Download image" style={{ width: 'auto', padding: '0 10px', fontSize: 13 }}>Download image</button>
              <button className="submit-btn" onClick={() => setInContext(false)}>Score</button>
            </>
          ) : (
            <button className="submit-btn" id="submitBtn" onClick={() => setShowConfirm(true)}>Submit</button>
          )}
        </div>
      </header>

      <div className="part-banner" id="partBanner">
        <h2>Reading Part {activePart}</h2>
        <p>
          {readOnly
            ? `Reviewing your answers — ${grade.band != null ? `Band ${grade.band.toFixed(1)} · ` : ''}${grade.correct}/${grade.total} correct.`
            : `Read the passage and answer questions ${activeRange}.`}
        </p>
      </div>

      {banner && !readOnly && (
        <div className="review-banner" style={{ padding: '8px 16px', background: 'var(--bg-banner)', fontSize: 13, flex: '0 0 auto' }}>{banner}</div>
      )}

      {panes}

      <footer className="footer">
        <a className="back-link" href="/reading" aria-label="Back to tests" onClick={(e) => { e.preventDefault(); if (onExit) onExit(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </a>
        {spec.parts.map((part) => {
          const qns = partQnums(part);
          const answered = qns.filter((q) => answers[q] != null && answers[q] !== '').length;
          const isActive = part.part_number === activePart;
          return (
            <div
              key={part.part_number}
              className={`part-section${isActive ? ' active' : ''}`}
              data-part={part.part_number}
              onClick={() => { if (!isActive) setActivePart(part.part_number); }}
              style={isActive ? undefined : { cursor: 'pointer' }}
            >
              <span className="part-label">Part {part.part_number}</span>
              <span className="part-progress">{answered}/{qns.length}</span>
              <div className="q-palette">
                {paletteEntries(part).map((e) => {
                  const isAns = e.qnums.some((q) => answers[q] != null && answers[q] !== '');
                  const isCur = e.qnums.includes(currentQ);
                  return (
                    <button
                      key={e.primary}
                      className={`q-btn${isAns ? ' answered' : ''}${isCur ? ' current' : ''}`}
                      data-q={e.primary}
                      onClick={(ev) => { ev.stopPropagation(); goToQuestion(e.primary); }}
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="nav-arrows" id="navArrows">
          <button className="nav-arrow" onClick={() => stepQuestion(-1)} title="Previous question" aria-label="Previous question">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className="nav-arrow" onClick={() => stepQuestion(1)} title="Next question" aria-label="Next question">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </footer>

      {hlTip && (
        <button
          onMouseDown={(e) => { e.preventDefault(); applyHighlight(); }}
          style={{ position: 'fixed', left: hlTip.x, top: hlTip.y, transform: 'translate(-50%, -100%)', zIndex: 50, background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          Highlight
        </button>
      )}

      {settingsOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              Exam Settings
              <button className="modal-close" onClick={() => setSettingsOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </h3>
            <div className="settings-section">
              <div className="settings-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /></svg>
                Theme
              </div>
              <div className="settings-options">
                <button className={`settings-option${theme === 'light' ? ' selected' : ''}`} onClick={() => setTheme('light')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                  Light
                </button>
                <button className={`settings-option${theme === 'dark' ? ' selected' : ''}`} onClick={() => setTheme('dark')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                  Dark
                </button>
                <button className={`settings-option${theme === 'system' ? ' selected' : ''}`} onClick={() => setTheme('system')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                  System
                </button>
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
                Text Size
              </div>
              <div className="settings-options">
                <button className={`settings-option${textSize === 'default' ? ' selected' : ''}`} onClick={() => setTextSize('default')} style={{ fontSize: '16px' }}>Default</button>
                <button className={`settings-option${textSize === 'large' ? ' selected' : ''}`} onClick={() => setTextSize('large')} style={{ fontSize: '18px' }}>Large</button>
                <button className={`settings-option${textSize === 'xl' ? ' selected' : ''}`} onClick={() => setTextSize('xl')} style={{ fontSize: '20px' }}>Extra Large</button>
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                Highlighter
              </div>
              <div className="settings-options">
                <button className={`settings-option${highlightOn ? ' selected' : ''}`} onClick={() => setHighlightOn((h) => !h)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  Highlighter: {highlightOn ? 'On' : 'Off'}
                </button>
                <button className="settings-option" onClick={clearHighlights}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /></svg>
                  Clear all highlights
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal">
            <h3>Are you sure you want to submit?</h3>
            <div className="review-summary">You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.</div>
            <div className="confirm-actions confirm-actions-split">
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Continue test</button>
              <button className="btn-primary" id="confirmSubmit" onClick={doSubmit}>Submit test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
