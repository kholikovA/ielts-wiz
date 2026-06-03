import React, { useState } from 'react';

// Compact, expandable list of a test's question types (in order of appearance).
// Shows the first `collapsed` chips + a "+N more" toggle.
export default function QuestionTypeChips({ types, collapsed = 2 }) {
  const [open, setOpen] = useState(false);
  if (!types || !types.length) return null;
  const shown = open ? types : types.slice(0, collapsed);
  const extra = types.length - collapsed;

  const toggle = (e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'var(--space-2)' }}>
      {shown.map((t) => <span key={t} className="qtype-chip">{t}</span>)}
      {extra > 0 && (
        <button type="button" className="qtype-chip qtype-more" onClick={toggle}>
          {open ? 'Show less' : `+${extra} more`}
        </button>
      )}
    </div>
  );
}
