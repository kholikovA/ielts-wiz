import React from 'react';
import { InterleaveGaps, CompletionLayout, GapInput, HTML } from './gaps';
import Flowchart from './Flowchart';
import SecuredImage from './SecuredImage';

// Correct/incorrect/unanswered badge shown after grading.
const Mark = ({ r }) => {
  if (!r) return null;
  if (r.unanswered) return <span className="lq-mark dash" title="Not answered">–</span>;
  return r.correct
    ? <span className="lq-mark ok" title="Correct">✓</span>
    : <span className="lq-mark no" title="Incorrect">✗</span>;
};

// After grading, show the correct answer (and the user's wrong one) for a question.
const Solution = ({ r }) => {
  if (!r || r.correct) return null;
  const correct = Array.isArray(r.correctAns) ? r.correctAns.join(', ') : r.correctAns;
  return (
    <span className="lq-sol">
      {!r.unanswered && <em className="lq-your">{r.userAns}</em>}
      <span className="lq-correct">{correct}</span>
    </span>
  );
};

// A letter dropdown (matching / map labelling). Stores the chosen letter.
function LetterSelect({ qnum, value, onChange, options, disabled }) {
  return (
    <select
      className="lq-select" data-qnum={qnum} disabled={disabled}
      value={value || ''} onChange={(e) => onChange(qnum, e.target.value)}
    >
      <option value="" />
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function ListeningQuestionGroup({ group, answers, onChange, readOnly = false, results = null }) {
  const g = group;
  const setA = readOnly ? () => {} : onChange;
  const res = (n) => (results ? results[n] : null);

  const qnums = g.questions.map((q) => q.number);
  const range = qnums.length
    ? (qnums.length > 1 ? `${Math.min(...qnums)}–${Math.max(...qnums)}` : `${qnums[0]}`)
    : '';

  const body = () => {
    switch (g.type) {
      // ---- note / form completion (sections of labelled items) ----
      case 'note_completion':
      case 'form_completion': {
        const sections = (g.layout && g.layout.sections) || [];
        return (
          <div className="lq-note">
            {g.layout && g.layout.title && <div className="lq-note-title">{g.layout.title}</div>}
            {sections.map((sec, si) => (
              <div className="lq-note-sec" key={si}>
                {sec.heading && <div className="lq-note-head">{sec.heading}</div>}
                {(sec.items || []).map((it, ii) => (
                  it.qnum != null ? (
                    <div className="lq-item" data-qnum={it.qnum} key={ii}>
                      <span className="lq-num">{it.qnum}</span>
                      <span className="lq-item-body">
                        <InterleaveGaps html={it.html} qnums={[it.qnum]} answers={answers} onChange={setA} disabled={readOnly} />
                        {readOnly && <Solution r={res(it.qnum)} />}
                      </span>
                      {readOnly && <Mark r={res(it.qnum)} />}
                    </div>
                  ) : (
                    <div className="lq-item lq-item--label" key={ii}><HTML html={it.html} /></div>
                  )
                ))}
              </div>
            ))}
          </div>
        );
      }

      // ---- table / summary completion (gaps inside authored markup) ----
      case 'table_completion':
      case 'summary_completion': {
        const layout = g.layout || {};
        if (layout.body_html && layout.word_bank) {
          return (
            <div className="lq-prose">
              {layout.title && <div className="lq-note-title">{layout.title}</div>}
              <InterleaveGaps html={layout.body_html} qnums={qnums} answers={answers} onChange={setA} wordBank={layout.word_bank} disabled={readOnly} />
            </div>
          );
        }
        return (
          <div className="lq-prose">
            {layout.title && <div className="lq-note-title">{layout.title}</div>}
            <CompletionLayout bodyHtml={layout.body_html || ''} qnums={qnums} answers={answers} onChange={setA} readOnly={readOnly} />
          </div>
        );
      }

      // ---- sentence completion (one gap per question) ----
      case 'sentence_completion':
        return g.questions.map((q) => (
          <div className="lq-item" data-qnum={q.number} key={q.number}>
            <span className="lq-num">{q.number}</span>
            <span className="lq-item-body">
              <InterleaveGaps html={q.prompt_html || `${q.prompt || ''} ___`} qnums={[q.number]} answers={answers} onChange={setA} disabled={readOnly} />
              {readOnly && <Solution r={res(q.number)} />}
            </span>
            {readOnly && <Mark r={res(q.number)} />}
          </div>
        ));

      // ---- short answer ----
      case 'short_answer':
        return g.questions.map((q) => (
          <div className="lq-item" data-qnum={q.number} key={q.number}>
            <span className="lq-num">{q.number}</span>
            <span className="lq-item-body">
              <HTML html={q.prompt_html || q.prompt} />{' '}
              <GapInput qnum={q.number} value={answers[q.number]} onChange={setA} disabled={readOnly} />
              {readOnly && <Solution r={res(q.number)} />}
            </span>
            {readOnly && <Mark r={res(q.number)} />}
          </div>
        ));

      // ---- native flowchart (no images) ----
      case 'flowchart_completion':
        return (
          <>
            <Flowchart spec={g.flowchart} answers={answers} onChange={setA} disabled={readOnly} />
            {readOnly && (
              <div className="lq-keyrow">
                {qnums.map((n) => <span className="lq-keychip" key={n}><b>{n}</b> <Solution r={res(n)} /><Mark r={res(n)} /></span>)}
              </div>
            )}
          </>
        );

      // ---- multiple choice (single) ----
      case 'mcq':
        return g.questions.map((q) => (
          <fieldset className="lq-mcq" data-qnum={q.number} key={q.number}>
            <legend className="lq-mcq-stem"><span className="lq-num">{q.number}</span><HTML html={q.prompt} /></legend>
            {q.options.map((o) => {
              const chosen = answers[q.number] === o.letter;
              const r = res(q.number);
              const cls = readOnly
                ? (r && r.correctAns === o.letter ? ' is-correct' : (chosen && r && !r.correct ? ' is-wrong' : ''))
                : '';
              return (
                <label className={`lq-opt${chosen ? ' chosen' : ''}${cls}`} key={o.letter}>
                  <input type="radio" name={`q${q.number}`} value={o.letter} checked={chosen} disabled={readOnly} onChange={() => setA(q.number, o.letter)} />
                  <span className="lq-opt-letter">{o.letter}</span>
                  <span className="lq-opt-text"><HTML html={o.text} /></span>
                </label>
              );
            })}
          </fieldset>
        ));

      // ---- matching (pick a letter from a small bank) ----
      case 'matching': {
        const opts = (g.bank || []).map((b) => ({ value: b.letter, label: `${b.letter} — ${b.text}` }));
        return (
          <div className="lq-match">
            {g.bank && (
              <ul className="lq-bank">
                {g.bank.map((b) => <li key={b.letter}><b>{b.letter}</b> {b.text}</li>)}
              </ul>
            )}
            {g.questions.map((q) => (
              <div className="lq-item" data-qnum={q.number} key={q.number}>
                <span className="lq-num">{q.number}</span>
                <span className="lq-item-body"><HTML html={q.prompt} /></span>
                <LetterSelect qnum={q.number} value={answers[q.number]} onChange={setA} options={opts} disabled={readOnly} />
                {readOnly && <><Solution r={res(q.number)} /><Mark r={res(q.number)} /></>}
              </div>
            ))}
          </div>
        );
      }

      // ---- map / plan / diagram labelling (secured image + letter bank) ----
      case 'map_labelling':
      case 'plan_labelling':
      case 'diagram_labelling': {
        const opts = (g.bank || []).map((b) => {
          const letter = typeof b === 'string' ? b : b.letter;
          return { value: letter, label: typeof b === 'string' ? letter : `${b.letter}${b.text ? ` — ${b.text}` : ''}` };
        });
        return (
          <div className="lq-label">
            {g.image_url && (
              <div className="lq-image">
                <SecuredImage src={g.image_url} alt={g.image_alt || 'Labelling image'} watermark="IELTS Wiz" />
              </div>
            )}
            {g.questions.map((q) => (
              <div className="lq-item" data-qnum={q.number} key={q.number}>
                <span className="lq-num">{q.number}</span>
                <span className="lq-item-body"><HTML html={q.prompt} /></span>
                <LetterSelect qnum={q.number} value={answers[q.number]} onChange={setA} options={opts} disabled={readOnly} />
                {readOnly && <><Solution r={res(q.number)} /><Mark r={res(q.number)} /></>}
              </div>
            ))}
          </div>
        );
      }

      default:
        return <div className="lq-unknown">Unsupported question type: {g.type}</div>;
    }
  };

  return (
    <section className="lq-group">
      {g.instructions_html && (
        <div className="lq-instructions">
          <strong className="lq-range">Questions {range}</strong>
          <HTML html={g.instructions_html} />
        </div>
      )}
      {body()}
    </section>
  );
}
