import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import './player.css';
import { useHighlighter } from './useHighlighter';
import PassagePane from './components/PassagePane';
import QuestionGroup from './components/QuestionGroup';
import ResultsScreen from './components/ResultsScreen';
import { buildLabelResolver } from './components/review';
import { gradeTest } from './grading';
import { recordAttempt, loadLastSubmission, loadLastSubmissionCloud } from './recording';
import { downloadResultImage } from './resultImage';
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
  const [inContext, setInContext] = useState(false);
  const [banner, setBanner] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState((spec.duration_minutes || 60) * 60);

  const setAnswer = useCallback((q, v) => {
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light');
  const [textSize, setTextSize] = useState('default');
  const passageRef = useRef(null);
  const [highlightOn, setHighlightOn] = useState(true);
  const { tip: hlTip, apply: applyHighlight } = useHighlighter(passageRef, highlightOn && !readOnly);

  // Draggable split divider — resizes the passage/questions panes.
  const containerRef = useRef(null);
  const [splitPct, setSplitPct] = useState(50);
  const draggingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setSplitPct(Math.min(75, Math.max(25, ((e.clientX - r.left) / r.width) * 100)));
    };
    const onUp = () => { draggingRef.current = false; try { document.body.style.cursor = ''; } catch { /* noop */ } };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const doSubmit = useCallback(() => {
    const g = gradeTest(spec, answers);
    recordAttempt({ kind, id, answers, correct: g.correct, total: g.total, replaying: review });
    setGrade(g);
    setShowConfirm(false);
    try { window.scrollTo(0, 0); } catch { /* jsdom / unsupported */ }
  }, [spec, answers, kind, id, review]);

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
      const el = document.querySelector(`#questionsPane [data-qnum="${qn}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  };
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    } catch { /* unsupported */ }
  };

  // Results summary
  if (grade && !inContext) {
    return (
      <div className="rtp-root" data-theme={theme} data-text-size={textSize} style={{ height: '100vh', overflowY: 'auto' }}>
        <ResultsScreen
          grade={grade}
          spec={spec}
          banner={banner}
          onReviewInContext={() => setInContext(true)}
          onDownloadImage={() => downloadResultImage({ spec, grade, solverName })}
          onRetake={onExit}
        />
      </div>
    );
  }

  const panes = (
    <div className="split-container" id="splitContainer" ref={containerRef}>
      <div className="pane passage-pane" id="passagePane" ref={passageRef} style={{ flex: `0 0 ${splitPct}%` }}>
        <PassagePane spec={spec} mhByPart={mhByPart} place={place} answers={answers} readOnly={readOnly} activePart={activePart} />
      </div>
      <div
        className="divider"
        id="divider"
        onMouseDown={() => { draggingRef.current = true; try { document.body.style.cursor = 'col-resize'; } catch { /* noop */ } }}
      />
      <div className="pane questions-pane" id="questionsPane" style={{ flex: '1 1 0%' }}>
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
                results={readOnly ? resultsByQ : null}
                resolver={readOnly ? resolver : null}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rtp-root" data-theme={theme} data-text-size={textSize} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            <button className="submit-btn" onClick={() => setInContext(false)}>Back to results</button>
          ) : (
            <button className="submit-btn" id="submitBtn" onClick={() => setShowConfirm(true)}>Submit</button>
          )}
        </div>
      </header>

      <div className="part-banner" id="partBanner">
        <h2>Reading Part {activePart}</h2>
        <p>{readOnly ? 'Reviewing your answers — switch parts below.' : `Read the passage and answer questions ${activeRange}.`}</p>
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
                  return (
                    <button
                      key={e.primary}
                      className={`q-btn${isAns ? ' answered' : ''}`}
                      data-q={e.primary}
                      onClick={(ev) => { ev.stopPropagation(); setActivePart(part.part_number); scrollToQ(e.primary); }}
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
          <button className="nav-arrow" onClick={() => setActivePart((p) => Math.max(1, p - 1))} title="Previous passage" aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className="nav-arrow" onClick={() => setActivePart((p) => Math.min(spec.parts.length, p + 1))} title="Next passage" aria-label="Next">
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
            <h3>Exam Settings
              <button className="modal-close" onClick={() => setSettingsOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </h3>
            <div className="settings-section">
              <div className="settings-label">Theme</div>
              <div className="settings-options">
                {['light', 'dark', 'system'].map((t) => (
                  <button key={t} className={`settings-option${theme === t ? ' active' : ''}`} onClick={() => setTheme(t)}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-label">Text Size</div>
              <div className="settings-options">
                {[['default', 'Default'], ['large', 'Large'], ['xl', 'Extra Large']].map(([v, l]) => (
                  <button key={v} className={`settings-option${textSize === v ? ' active' : ''}`} onClick={() => setTextSize(v)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-label">Highlighter</div>
              <div className="settings-options">
                <button className={`settings-option${highlightOn ? ' active' : ''}`} onClick={() => setHighlightOn((h) => !h)}>
                  Highlighter: {highlightOn ? 'On' : 'Off'}
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
            <div className="review-summary">You have answered {answeredCount} of {totalQuestions} questions.</div>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Continue test</button>
              <button className="btn-primary" id="confirmSubmit" onClick={doSubmit}>Submit test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
