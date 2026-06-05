import React, { useMemo, useState, useEffect, useCallback } from 'react';
import './player.css';
import PassagePane from './components/PassagePane';
import QuestionGroup from './components/QuestionGroup';
import ResultsScreen from './components/ResultsScreen';
import { gradeTest } from './grading';
import { recordAttempt } from './recording';

const keyOf = (g) => {
  const ns = g.questions.map((q) => q.number).sort((a, b) => a - b);
  return `${g.type}_${ns[0]}_${ns[ns.length - 1]}`;
};

// `test` is a manifest entry: { kind, id, spec, source, n }.
export default function ReadingTestPlayer({ test, onExit }) {
  const { spec, kind, id } = test;

  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null); // transient placement selection
  const [showConfirm, setShowConfirm] = useState(false);
  const [grade, setGrade] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState((spec.duration_minutes || 60) * 60);

  const setAnswer = useCallback((q, v) => {
    setAnswers((a) => {
      const n = { ...a };
      if (v === '' || v == null) delete n[q];
      else n[q] = v;
      return n;
    });
  }, []);

  // Placement groups (matching headings + sentence endings) and per-part heading maps.
  const { groupByKey, mhByPart } = useMemo(() => {
    const byKey = {};
    spec.parts.forEach((part) => {
      part.question_groups.forEach((g) => {
        if (g.type === 'matching_headings' || g.type === 'sentence_endings') {
          const labels = {};
          (g.heading_bank || g.ending_bank || []).forEach((it) => {
            labels[it.id ?? it.letter] = it.text;
          });
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
    placeAt: (key, qnum) => {
      setSelected((sel) => {
        if (sel && sel.key === key) setAnswer(qnum, sel.id);
        return null;
      });
    },
    clearAt: (qnum) => setAnswer(qnum, undefined),
    labelOf: (key, idv) => (groupByKey[key]?.labels[idv]) ?? idv,
    dropAt: (key, qnum, e) => {
      e.preventDefault();
      try {
        const d = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (d.key === key) setAnswer(qnum, d.id);
      } catch { /* not a placement drag */ }
    },
  }), [selected, answers, groupByKey, setAnswer]);

  const totalQuestions = useMemo(
    () => spec.parts.reduce((n, p) => n + p.question_groups.reduce((m, g) => m + g.questions.length, 0), 0),
    [spec]
  );
  const answeredCount = Object.keys(answers).length;

  const doSubmit = useCallback(() => {
    const g = gradeTest(spec, answers);
    recordAttempt({ kind, id, answers, correct: g.correct, total: g.total });
    setGrade(g);
    setShowConfirm(false);
    try { window.scrollTo(0, 0); } catch { /* jsdom / unsupported */ }
  }, [spec, answers, kind, id]);

  // Countdown — auto-submits at zero. (Display only; no enforcement beyond submit.)
  useEffect(() => {
    if (grade) return undefined;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(t); doSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [grade, doSubmit]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  if (grade) {
    return (
      <div className="rtp-root">
        <ResultsScreen grade={grade} title={spec.title} onRetake={onExit} />
      </div>
    );
  }

  return (
    <div className="rtp-root">
      <div className="rtp-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <strong style={{ fontSize: 14 }}>{spec.title}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="rtp-timer" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{mm}:{ss}</span>
          <button className="btn-primary" id="submitBtn" onClick={() => setShowConfirm(true)}>Submit</button>
        </div>
      </div>

      <div className="split-container" id="splitContainer">
        <div className="pane passage-pane" id="passagePane">
          <PassagePane spec={spec} mhByPart={mhByPart} place={place} answers={answers} />
        </div>
        <div className="divider" id="divider" />
        <div className="pane questions-pane" id="questionsPane">
          {spec.parts.map((part) => (
            <div className="questions-section" data-part={part.part_number} key={part.part_number}>
              {part.question_groups.map((g) => (
                <QuestionGroup key={keyOf(g)} group={g} answers={answers} onChange={setAnswer} place={place} />
              ))}
            </div>
          ))}
        </div>
      </div>

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
