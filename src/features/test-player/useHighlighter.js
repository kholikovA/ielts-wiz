import { useEffect, useRef, useState } from 'react';

// Passage highlighter. On a text selection inside the passage pane it surfaces a
// floating "Highlight" button; applying wraps the selection in a <mark>. Clicking
// an existing highlight removes it. Highlights are applied imperatively to the
// DOM, so the prose paragraphs must be memoized (see PassagePane) to survive
// React re-renders.
export function useHighlighter(paneRef, enabled) {
  const [tip, setTip] = useState(null);
  const rangeRef = useRef(null);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane || !enabled) { setTip(null); return undefined; }

    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setTip(null); return; }
      const range = sel.getRangeAt(0);
      if (!pane.contains(range.commonAncestorContainer)) { setTip(null); return; }
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
    pane.addEventListener('click', onClick);
    return () => { document.removeEventListener('mouseup', onMouseUp); pane.removeEventListener('click', onClick); };
  }, [paneRef, enabled]);

  const apply = () => {
    const range = rangeRef.current;
    if (!range) return;
    const mark = document.createElement('mark');
    mark.className = 'iw-hl';
    mark.style.cssText = 'background:#fde68a;border-radius:2px;cursor:pointer';
    try { range.surroundContents(mark); }
    catch { try { mark.appendChild(range.extractContents()); range.insertNode(mark); } catch { /* unsplittable selection */ } }
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    setTip(null);
    rangeRef.current = null;
  };

  return { tip, apply, clearTip: () => setTip(null) };
}
