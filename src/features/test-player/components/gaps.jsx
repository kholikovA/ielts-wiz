import React, { useRef, useMemo, useEffect } from 'react';

// Grow the answer field to the RIGHT to fit its content (so it doesn't stack up
// vertically). Only once it hits a max width does it wrap onto a second line.
// In a table cell the max is the cell width; inline it's a comfortable cap.
// Text width comes from canvas measureText using the field's own font, which is
// exact (scrollWidth drops the right padding when content overflows).
let _ctx = null;
let _ctxTried = false;
const measureText = (el, text) => {
  if (!_ctxTried) { _ctxTried = true; try { _ctx = document.createElement('canvas').getContext('2d'); } catch { _ctx = null; } }
  const cs = getComputedStyle(el);
  if (!_ctx || !_ctx.measureText) return String(text || '').length * (parseFloat(cs.fontSize) || 16) * 0.55; // jsdom / no canvas
  _ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return _ctx.measureText(text || '').width;
};
const autoGrow = (el) => {
  if (!el) return;
  const cell = el.closest('td');
  const max = cell ? Math.max(96, cell.clientWidth - 12) : 320;
  const textW = measureText(el, el.value);
  const w = Math.min(max, Math.max(76, Math.ceil(textW) + 30)); // padding + caret room
  el.style.width = `${w}px`;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

// Boxed answer field bound to a question number. It's a textarea (not an input) so
// long answers wrap onto a second line within a narrow box instead of scrolling.
// The number shows as a placeholder until filled (CSS hides it when .filled).
export function GapInput({ qnum, value, onChange, wide, disabled }) {
  const filled = !!(value && String(value).length);
  const ref = useRef(null);
  useEffect(() => { autoGrow(ref.current); }, [value]);
  return (
    <span className="gap-wrap">
      <textarea
        ref={ref}
        rows={1}
        className={`gap-input${wide ? ' wide' : ''}${filled ? ' filled' : ''}`}
        data-qnum={qnum}
        autoComplete="off"
        spellCheck="false"
        disabled={disabled}
        value={value || ''}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        onChange={(e) => onChange(qnum, e.target.value.replace(/\n/g, ' '))}
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
      return `<span class="gap-wrap"><textarea rows="1" class="gap-input" data-qnum="${qn}" autocomplete="off" spellcheck="false"></textarea><span class="gap-num-placeholder">${qn}</span></span>`;
    });
  }, [bodyHtml, qnums]);

  const onInput = (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains('gap-input')) {
      autoGrow(t);
      if (!readOnly) onChange(parseInt(t.dataset.qnum, 10), t.value.replace(/\n/g, ' '));
    }
  };
  const onKeyDown = (e) => { if (e.key === 'Enter' && e.target.classList?.contains('gap-input')) e.preventDefault(); };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll('textarea.gap-input').forEach((inp) => {
      const qn = parseInt(inp.dataset.qnum, 10);
      const v = answers[qn] == null ? '' : String(answers[qn]);
      if (inp.value !== v) inp.value = v;
      inp.disabled = !!readOnly;
      inp.classList.toggle('filled', !!v);
      autoGrow(inp);
    });
  }, [html, answers, readOnly]);

  return <div className="completion-layout" ref={ref} onInput={onInput} onKeyDown={onKeyDown} dangerouslySetInnerHTML={{ __html: html }} />;
}
