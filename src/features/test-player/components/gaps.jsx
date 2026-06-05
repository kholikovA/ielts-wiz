import React from 'react';

// Boxed text input bound to a question number. The number shows as a placeholder
// until the gap is filled (CSS hides it via .gap-input.filled + .gap-num-placeholder).
export function GapInput({ qnum, value, onChange, wide, disabled }) {
  const filled = !!(value && String(value).length);
  return (
    <span className="gap-wrap">
      <input
        type="text"
        className={`gap-input${wide ? ' wide' : ''}${filled ? ' filled' : ''}`}
        data-qnum={qnum}
        autoComplete="off"
        spellCheck="false"
        disabled={disabled}
        value={value || ''}
        onChange={(e) => onChange(qnum, e.target.value)}
      />
      <span className="gap-num-placeholder">{qnum}</span>
    </span>
  );
}

// Dropdown gap (summary completion with a word bank) — value is the bank letter.
export function GapSelect({ qnum, value, onChange, options, disabled }) {
  return (
    <span className="gap-wrap">
      <select
        className="gap-input gap-select"
        data-qnum={qnum}
        disabled={disabled}
        value={value || ''}
        onChange={(e) => onChange(qnum, e.target.value)}
      >
        <option value="" />
        {options.map((o) => (
          <option key={o.letter} value={o.letter}>{o.letter}</option>
        ))}
      </select>
    </span>
  );
}

// Render authored HTML that contains `___` markers, replacing each in order with
// a real controlled gap input/select bound to the matching qnum. The HTML between
// gaps is trusted (it comes from our own specs), so dangerouslySetInnerHTML is safe.
export function InterleaveGaps({ html, qnums, answers, onChange, wordBank, disabled }) {
  const segments = String(html).split('___');
  const nodes = [];
  segments.forEach((seg, i) => {
    if (seg) nodes.push(<span key={`s${i}`} dangerouslySetInnerHTML={{ __html: seg }} />);
    if (i < segments.length - 1) {
      const qn = qnums[i];
      nodes.push(
        wordBank ? (
          <GapSelect key={`g${i}`} qnum={qn} value={answers[qn]} onChange={onChange} options={wordBank} disabled={disabled} />
        ) : (
          <GapInput key={`g${i}`} qnum={qn} value={answers[qn]} onChange={onChange} disabled={disabled} />
        )
      );
    }
  });
  return <>{nodes}</>;
}

// Trusted authored HTML (prompts, instructions, passage prose).
export const HTML = ({ html, ...rest }) => (
  <span {...rest} dangerouslySetInnerHTML={{ __html: html || '' }} />
);
