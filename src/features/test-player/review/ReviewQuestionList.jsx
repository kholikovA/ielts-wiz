import React, { useState } from 'react';
import { clozeRuns } from './cloze';

const TYPE_LABELS = {
  tfng: 'True / False / Not Given', yng: 'Yes / No / Not Given',
  mcq: 'Multiple choice', mcq_multi: 'Multiple choice',
  matching_headings: 'Matching headings', matching_info: 'Matching information',
  matching_features: 'Matching features', sentence_endings: 'Sentence endings',
  sentence_completion: 'Sentence completion', summary_completion: 'Summary completion',
  note_completion: 'Note completion', table_completion: 'Table completion',
  flowchart_completion: 'Flowchart completion', diagram_completion: 'Diagram completion',
  short_answer: 'Short answer',
};

const Mark = ({ status }) => {
  if (status === 'correct') return <svg className="rv-mark correct" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
  if (status === 'wrong') return <svg className="rv-mark wrong" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
  return <svg className="rv-mark unanswered" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>;
};
const Chevron = () => <svg className="rv-explain-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;

const promptHtml = (q, type) => {
  if (q.prompt_html) return q.prompt_html;
  if (q.prompt) return q.prompt;
  return TYPE_LABELS[type] || 'Question';
};

// Answer keys list equivalent variants with `|` / `/` (e.g.
// "colour-coding|colour coding"). Show the first as the canonical answer so the
// filled cloze reads as a sentence, not a list. (Grading still accepts them all.)
const primaryAns = (v) => String(v == null ? '' : v).split(/\s*[/|]\s*/)[0];

// One blank inside a cloze fragment, filled from the question's result.
function GapFill({ qnum, target, resultsByQ, resolver }) {
  const r = resultsByQ[qnum] || {};
  const your = r.unanswered ? null : resolver(qnum, r.userAns);
  const correct = primaryAns(resolver(qnum, r.correctAns));
  if (!target) return <span className="rv-fill ctx">{your || `—`}</span>;
  if (r.unanswered) return <span className="rv-fill blank">____<span className="rv-fill-correct">{correct}</span></span>;
  if (r.correct) return <span className="rv-fill correct">{your}</span>;
  return <span className="rv-fill wrong"><span className="rv-fill-your">{your}</span><span className="rv-fill-correct">{correct}</span></span>;
}

// The completion sentence/line/bullet with the target blank filled in context.
function ClozePrompt({ frag, resultsByQ, resolver }) {
  return (
    <span className="rv-cloze">
      {frag.label && <span className="rv-cloze-label">{frag.label} · </span>}
      {frag.runs.map((run, i) => {
        if (run.gap) return <GapFill key={i} qnum={run.qnum} target={run.target} resultsByQ={resultsByQ} resolver={resolver} />;
        if (run.html != null) return <span key={i} dangerouslySetInnerHTML={{ __html: run.html }} />;
        return <span key={i}>{run.text}</span>;
      })}
    </span>
  );
}

export default function ReviewQuestionList({ part, resultsByQ, resolver, evidence, answerKey, currentQ, onSelectQuestion }) {
  const [openSet, setOpenSet] = useState(() => new Set());
  const toggle = (qnum) => setOpenSet((s) => { const n = new Set(s); n.has(qnum) ? n.delete(qnum) : n.add(qnum); return n; });

  const rows = [];
  part.question_groups.forEach((g) => {
    if (g.type === 'mcq_multi') {
      const qnums = g.questions.map((q) => q.number).sort((a, b) => a - b);
      const primary = qnums[0];
      const r0 = resultsByQ[primary] || {};
      const chosen = String(r0.userAns || '').split(',').map((s) => s.trim()).filter(Boolean);
      const correctLetters = qnums.map((qn) => resultsByQ[qn]?.correctAns).filter(Boolean);
      const hits = qnums.filter((qn) => resultsByQ[qn]?.correct).length;
      const status = hits === qnums.length ? 'correct' : hits === 0 ? 'wrong' : 'partial';
      rows.push({
        qnum: primary,
        label: `${qnums[0]}–${qnums[qnums.length - 1]}`,
        promptHtml: promptHtml(g.questions.find((q) => q.prompt) || g.questions[0], g.type),
        status,
        yourTxt: chosen.join(', ') || null,
        correctTxt: correctLetters.join(', '),
        extra: `${hits}/${qnums.length} correct`,
      });
    } else {
      g.questions.forEach((q) => {
        const r = resultsByQ[q.number] || {};
        const status = r.unanswered ? 'unanswered' : r.correct ? 'correct' : 'wrong';
        rows.push({
          qnum: q.number,
          label: String(q.number),
          promptHtml: promptHtml(q, g.type),
          cloze: clozeRuns(g, q.number), // filled-in sentence for completion types
          status,
          yourTxt: r.unanswered ? null : resolver(q.number, r.userAns),
          correctTxt: resolver(q.number, r.correctAns ?? answerKey?.[q.number]),
          extra: null,
        });
      });
    }
  });
  rows.sort((a, b) => a.qnum - b.qnum);

  return (
    <div className="rv-qlist">
      {rows.map((row) => {
        const ev = evidence[row.qnum] || null;
        const hasExplain = !!(ev && (ev.rationale || ev.evidenceText));
        const open = openSet.has(row.qnum);
        return (
          <div key={row.qnum} id={`rv-q${row.qnum}`} className={`rv-q ${row.status}${row.qnum === currentQ ? ' current' : ''}`}>
            <button type="button" className="rv-q-head" onClick={() => onSelectQuestion(row.qnum)}>
              <span className={`rv-q-num ${row.status}`}>{row.label}</span>
              {row.cloze
                ? <span className="rv-q-prompt"><ClozePrompt frag={row.cloze} resultsByQ={resultsByQ} resolver={resolver} /></span>
                : <span className="rv-q-prompt" dangerouslySetInnerHTML={{ __html: row.promptHtml }} />}
              <Mark status={row.status} />
            </button>

            {/* For completion rows the filled cloze already shows the answer; the
                separate your/correct line is only for non-cloze types. */}
            {!row.cloze && (
              <div className="rv-q-answers">
                {row.status === 'correct' ? (
                  <span className="rv-ans"><span className="rv-ans-label">Your answer</span><span className="rv-your correct">{row.yourTxt}</span></span>
                ) : (
                  <>
                    <span className="rv-ans">
                      <span className="rv-ans-label">Your answer</span>
                      {row.yourTxt ? <span className="rv-your wrong">{row.yourTxt}</span> : <em className="rv-blank">No answer</em>}
                    </span>
                    <span className="rv-ans"><span className="rv-ans-label">Correct</span><span className="rv-correct">{row.correctTxt}</span></span>
                  </>
                )}
                {row.extra && <span className="rv-extra">{row.extra}</span>}
              </div>
            )}

            {hasExplain && (
              <button type="button" className={`rv-explain${open ? ' open' : ''}`} onClick={() => toggle(row.qnum)}>
                <Chevron /> Explain more
              </button>
            )}
            {hasExplain && open && (
              <div className="rv-q-panel">
                {ev.evidenceText && (
                  <div className="rv-ev">
                    <div className="rv-ev-label">In the passage{ev.located ? ' ↗' : ''}</div>
                    <blockquote
                      className={`rv-ev-quote${ev.located ? ' jump' : ''}`}
                      onClick={() => ev.located && onSelectQuestion(row.qnum)}
                    >
                      “{ev.evidenceText}”
                    </blockquote>
                  </div>
                )}
                {ev.rationale && (
                  <div className="rv-why">
                    <div className="rv-why-label">Why</div>
                    <p>{ev.rationale}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
