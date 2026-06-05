import React, { useRef, useMemo, useEffect } from 'react';

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

// Completion gaps embedded in complex HTML (tables / flowcharts / diagrams),
// where splitting the markup into React fragments would break the structure.
// We inject real <input> elements into the rendered HTML and capture answers via
// event delegation, syncing values imperatively (for review/read-only).
export function CompletionLayout({ bodyHtml, qnums, answers, onChange, readOnly }) {
  const ref = useRef(null);
  const html = useMemo(() => {
    let i = 0;
    return String(bodyHtml).replace(/___/g, () => {
      const qn = qnums[i++];
      return `<span class="gap-wrap"><input type="text" class="gap-input" data-qnum="${qn}" autocomplete="off" spellcheck="false"><span class="gap-num-placeholder">${qn}</span></span>`;
    });
  }, [bodyHtml, qnums]);

  const onInput = (e) => {
    const t = e.target;
    if (!readOnly && t && t.classList && t.classList.contains('gap-input')) {
      onChange(parseInt(t.dataset.qnum, 10), t.value);
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll('input.gap-input').forEach((inp) => {
      const qn = parseInt(inp.dataset.qnum, 10);
      const v = answers[qn] == null ? '' : String(answers[qn]);
      if (inp.value !== v) inp.value = v;
      inp.disabled = !!readOnly;
      inp.classList.toggle('filled', !!v);
    });
  }, [html, answers, readOnly]);

  return <div className="completion-layout" ref={ref} onInput={onInput} dangerouslySetInnerHTML={{ __html: html }} />;
}
