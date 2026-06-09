import React from 'react';
import { InterleaveGaps, HTML } from './gaps';
import './flowchart.css';

// Native flowchart renderer — a vertical sequence of boxes joined by arrows, drawn
// entirely in the DOM (boxes + CSS arrowheads). NO images, so nothing can be
// right-click-saved or extracted, it stays crisp at any zoom, and it themes with
// the player. Boxes may carry `___` gaps bound to question numbers, so a flowchart
// works as a flowchart_completion question with the engine's normal answer state.
//
// spec = {
//   title?: string,
//   steps: [
//     { html: 'add ___ then heat', qnums: [22], word_bank?: [...] }  // gap box
//     { html: 'remove bark' }                                        // plain box
//     { html: 'produced in machine', emphasis: true }                // highlighted
//   ]
// }
export default function Flowchart({ spec, answers = {}, onChange = () => {}, disabled = false }) {
  const steps = (spec && spec.steps) || [];
  return (
    <figure className="fc">
      {spec && spec.title && <figcaption className="fc-title">{spec.title}</figcaption>}
      <div className="fc-flow">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className={`fc-box${step.emphasis ? ' fc-box--accent' : ''}`}>
              {step.qnums && step.qnums.length ? (
                <InterleaveGaps
                  html={step.html}
                  qnums={step.qnums}
                  answers={answers}
                  onChange={onChange}
                  wordBank={step.word_bank}
                  disabled={disabled}
                />
              ) : (
                <HTML html={step.html} />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="fc-arrow" aria-hidden="true">
                {step.arrow_label && <span className="fc-arrow-label">{step.arrow_label}</span>}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </figure>
  );
}
