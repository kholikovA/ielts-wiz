import React, { useMemo, useState, useRef, useEffect } from 'react';
import './review.css';
import ReviewPassagePane from './ReviewPassagePane';
import ReviewQuestionList from './ReviewQuestionList';
import VocabularyTab from './VocabularyTab';
import { buildEvidenceIndex } from './evidence';

// IELTSX-style review: passage (left) with evidence highlights + badges, a
// per-question list (right) with inline Explain More, a Vocabulary tab, and a
// per-part switcher. Clicking a question scrolls the passage to its evidence.
export default function ReviewView({ spec, grade, resolver, onExit }) {
  const parts = spec.parts;
  const [activePart, setActivePart] = useState(parts[0]?.part_number ?? 1);
  const [tab, setTab] = useState('questions');
  const [currentQ, setCurrentQ] = useState(null);
  const passageRef = useRef(null);
  const rightRef = useRef(null);

  const { byParagraph, byQuestion } = useMemo(() => buildEvidenceIndex(spec), [spec]);
  const resultsByQ = useMemo(() => {
    const m = {};
    (grade?.results || []).forEach((r) => { m[r.q] = r; });
    return m;
  }, [grade]);

  const partMeta = useMemo(() => parts.map((p) => {
    const qnums = [];
    p.question_groups.forEach((g) => g.questions.forEach((q) => qnums.push(q.number)));
    const correct = qnums.filter((n) => resultsByQ[n]?.correct).length;
    return { part: p, qnums: qnums.sort((a, b) => a - b), correct, total: qnums.length };
  }), [parts, resultsByQ]);

  const partOfQnum = useMemo(() => {
    const m = {};
    partMeta.forEach((pm) => pm.qnums.forEach((n) => { m[n] = pm.part.part_number; }));
    return m;
  }, [partMeta]);

  const selectQuestion = (qnum) => {
    const pn = partOfQnum[qnum];
    if (pn && pn !== activePart) setActivePart(pn);
    if (tab !== 'questions') setTab('questions');
    setCurrentQ(qnum);
  };

  // Scroll the passage to (and flash) the evidence; nudge the right-pane row in.
  useEffect(() => {
    if (currentQ == null) return;
    const ev = passageRef.current?.querySelector(`#ev-q${currentQ}`);
    if (ev) {
      ev.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ev.classList.remove('flash'); void ev.offsetWidth; ev.classList.add('flash');
    }
    const row = rightRef.current?.querySelector(`#rv-q${currentQ}`);
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentQ, activePart]);

  const active = partMeta.find((pm) => pm.part.part_number === activePart) || partMeta[0];
  const vocab = spec.vocabulary || [];
  const hasVocab = vocab.length > 0;

  return (
    <div className="rv-root">
      <header className="rv-top">
        <button type="button" className="rv-back" onClick={onExit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Results
        </button>
        <h2 className="rv-title">Reading Passage {active.part.part_number} · Review</h2>
        <div className="rv-tabs">
          <button type="button" className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}>Questions</button>
          {hasVocab && (
            <button type="button" className={tab === 'vocab' ? 'active' : ''} onClick={() => setTab('vocab')}>Vocabulary ({vocab.length})</button>
          )}
        </div>
      </header>

      <div className="rv-body">
        <div className="rv-passage" ref={passageRef}>
          <ReviewPassagePane part={active.part} byParagraph={byParagraph} currentQ={currentQ} onSelectQuestion={selectQuestion} />
        </div>
        <div className="rv-right" ref={rightRef}>
          {tab === 'vocab'
            ? <VocabularyTab vocabulary={vocab} activePart={activePart} />
            : <ReviewQuestionList
                part={active.part}
                resultsByQ={resultsByQ}
                resolver={resolver}
                evidence={byQuestion}
                answerKey={spec.answer_key}
                currentQ={currentQ}
                onSelectQuestion={selectQuestion}
              />}
        </div>
      </div>

      <footer className="rv-foot">
        <div className="rv-parts">
          {partMeta.map((pm) => (
            <button
              key={pm.part.part_number}
              type="button"
              className={`rv-part${pm.part.part_number === activePart ? ' active' : ''}`}
              onClick={() => { setActivePart(pm.part.part_number); setCurrentQ(null); }}
            >
              Passage {pm.part.part_number}
              <span className="rv-part-score">{pm.correct}/{pm.total}</span>
            </button>
          ))}
        </div>
        <div className="rv-qchips">
          {active.qnums.map((n) => {
            const r = resultsByQ[n] || {};
            const st = r.unanswered ? 'unanswered' : r.correct ? 'correct' : 'wrong';
            return (
              <button
                key={n}
                type="button"
                className={`rv-chip ${st}${n === currentQ ? ' current' : ''}`}
                onClick={() => selectQuestion(n)}
              >{n}</button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
