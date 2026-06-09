import React, { useState } from 'react';

const Mark = ({ status }) => {
  if (status === 'correct') return <svg className="rv-mark correct" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
  if (status === 'wrong') return <svg className="rv-mark wrong" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
  return <svg className="rv-mark unanswered" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>;
};
const Chevron = () => <svg className="rv-explain-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
const primary = (v) => String(v == null ? '' : v).split(/\s*[/|]\s*/)[0];

// Per-question rows for the listening review: status, your/correct answer, and an
// "Explain" that reveals the transcript quote (click to jump) + the rationale.
export default function ListeningReviewQuestions({ part, resultsByQ, resolver, evidence, currentQ, onSelectQuestion }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (n) => setOpen((s) => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x; });

  const rows = [];
  part.question_groups.forEach((g) => g.questions.forEach((q) => {
    const r = resultsByQ[q.number] || {};
    rows.push({
      n: q.number,
      prompt: q.prompt || q.prompt_html || null,
      status: r.unanswered ? 'unanswered' : r.correct ? 'correct' : 'wrong',
      your: r.unanswered ? null : resolver(q.number, r.userAns),
      correct: primary(resolver(q.number, r.correctAns)),
    });
  }));
  rows.sort((a, b) => a.n - b.n);

  return (
    <div className="rv-qlist">
      {rows.map((row) => {
        const ev = evidence[row.n] || null;
        const hasExplain = !!(ev && (ev.rationale || ev.evidenceText));
        const isOpen = open.has(row.n);
        return (
          <div key={row.n} id={`rv-q${row.n}`} className={`rv-q ${row.status}${row.n === currentQ ? ' current' : ''}`}>
            <button type="button" className="rv-q-head" onClick={() => onSelectQuestion(row.n)}>
              <span className={`rv-q-num ${row.status}`}>{row.n}</span>
              {row.prompt
                ? <span className="rv-q-prompt" dangerouslySetInnerHTML={{ __html: row.prompt }} />
                : <span className="rv-q-prompt rv-blank">Question {row.n}</span>}
              <Mark status={row.status} />
            </button>

            <div className="rv-q-answers">
              {row.status === 'correct' ? (
                <span className="rv-ans"><span className="rv-ans-label">Your answer</span><span className="rv-your correct">{row.your}</span></span>
              ) : (
                <>
                  <span className="rv-ans"><span className="rv-ans-label">Your answer</span>{row.your ? <span className="rv-your wrong">{row.your}</span> : <em className="rv-blank">No answer</em>}</span>
                  <span className="rv-ans"><span className="rv-ans-label">Correct</span><span className="rv-correct">{row.correct}</span></span>
                </>
              )}
            </div>

            {hasExplain && (
              <button type="button" className={`rv-explain${isOpen ? ' open' : ''}`} onClick={() => toggle(row.n)}>
                <Chevron /> Explain
              </button>
            )}
            {hasExplain && isOpen && (
              <div className="rv-q-panel">
                {ev.evidenceText && (
                  <div className="rv-ev">
                    <div className="rv-ev-label">In the transcript{ev.located ? ' ↗' : ''}</div>
                    <blockquote className={`rv-ev-quote${ev.located ? ' jump' : ''}`} onClick={() => ev.located && onSelectQuestion(row.n)}>
                      “{ev.evidenceText}”
                    </blockquote>
                  </div>
                )}
                {ev.rationale && (
                  <div className="rv-why"><div className="rv-why-label">Why</div><p>{ev.rationale}</p></div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
