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

  // Results summary
  if (grade && !inContext) {
    return (
      <div className="rtp-root" style={{ height: '100vh', overflowY: 'auto' }}>
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
    <div className="rtp-root" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="rtp-topbar" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <strong style={{ fontSize: 14 }}>{spec.title}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {readOnly ? (
            <button className="btn-secondary" onClick={() => setInContext(false)}>Back to results</button>
          ) : (
            <>
              {!review && <span className="rtp-timer" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{mm}:{ss}</span>}
              <button className="btn-secondary" onClick={() => setHighlightOn((h) => !h)} title="Toggle highlighter">
                Highlighter: {highlightOn ? 'On' : 'Off'}
              </button>
              <button className="btn-primary" id="submitBtn" onClick={() => setShowConfirm(true)}>Submit</button>
            </>
          )}
        </div>
      </div>

      {banner && !readOnly && (
        <div className="review-banner" style={{ padding: '8px 16px', background: 'var(--bg-banner)', fontSize: 13 }}>{banner}</div>
      )}

      {panes}

      <div className="rtp-footer" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
        {spec.parts.map((p) => (
          <button
            key={p.part_number}
            onClick={() => setActivePart(p.part_number)}
            className={p.part_number === activePart ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: 13 }}
          >
            Passage {p.part_number}
          </button>
        ))}
        {!readOnly && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{answeredCount} / {totalQuestions} answered</span>
        )}
      </div>

      {hlTip && (
        <button
          onMouseDown={(e) => { e.preventDefault(); applyHighlight(); }}
          style={{ position: 'fixed', left: hlTip.x, top: hlTip.y, transform: 'translate(-50%, -100%)', zIndex: 50, background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          Highlight
        </button>
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
