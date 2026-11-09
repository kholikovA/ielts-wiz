import { useEffect, useRef, useState } from 'react';

// Passage + questions highlighter. On a text selection inside one of the panes it surfaces a
// floating "Highlight" button; applying wraps the selection in a <mark>. Clicking
// an existing highlight removes it. Highlights are applied imperatively to the
// DOM, so the prose paragraphs must be memoized (see PassagePane) to survive
// React re-renders.
// `paneRefs` is one ref or a stable array of refs. Selections that touch answer
// controls (inputs, choices, drag cards) are ignored so a highlight never wraps them.
const CONTROLS = 'input, select, textarea, button, [draggable="true"], [contenteditable="true"]';
const touchesControl = (range) => {
  const host = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  if (host && host.closest && host.closest(CONTROLS)) return true;
  return Boolean(range.cloneContents().querySelector(CONTROLS));
};

export function useHighlighter(paneRefs, enabled) {
  const [tip, setTip] = useState(null);
  const rangeRef = useRef(null);

  useEffect(() => {
    const panes = (Array.isArray(paneRefs) ? paneRefs : [paneRefs]).map((r) => r.current).filter(Boolean);
    if (!panes.length || !enabled) { setTip(null); return undefined; }

    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setTip(null); return; }
      const range = sel.getRangeAt(0);
      if (!panes.some((pane) => pane.contains(range.commonAncestorContainer)) || touchesControl(range)) { setTip(null); return; }
      const rect = range.getBoundingClientRect();
      if (!rect.width) { setTip(null); return; }
      rangeRef.current = range.cloneRange();
      setTip({ x: rect.left + rect.width / 2, y: rect.top - 6 });
    };
    const onClick = (e) => {
      const m = e.target.closest && e.target.closest('mark.iw-hl');
      if (m) {
        const p = m.parentNode;
        while (m.firstChild) p.insertBefore(m.firstChild, m);
        p.removeChild(m);
        p.normalize();
      }
    };
    document.addEventListener('mouseup', onMouseUp);
    panes.forEach((pane) => pane.addEventListener('click', onClick));
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      panes.forEach((pane) => pane.removeEventListener('click', onClick));
    };
  }, [paneRefs, enabled]);

  const apply = () => {
    const range = rangeRef.current;
    if (!range) return;
    const mark = document.createElement('mark');
    mark.className = 'iw-hl';
    // No inline background — the .iw-hl rule paints it with the themed
    // --highlight (neon brand purple), so it stays correct in dark mode too.
    mark.style.cssText = 'border-radius:2px;cursor:pointer';
    try { range.surroundContents(mark); }
    catch { try { mark.appendChild(range.extractContents()); range.insertNode(mark); } catch { /* unsplittable selection */ } }
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    setTip(null);
    rangeRef.current = null;
  };

  return { tip, apply, clearTip: () => setTip(null) };
}
