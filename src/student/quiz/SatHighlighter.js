import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../../components/ui/icons';

// Bluebook-style highlights: select text in the passage or the question and pick a
// colour (or underline) from the bar that pops up; click a highlight to change or
// remove it. Drawn with the CSS Custom Highlight API, so the rendered text (KaTeX,
// tables) is never touched. Saved per question as character offsets into each zone
// (elements marked data-hl="passage" / data-hl="prompt").

export const HL_STYLES = [
  { id: 'yellow', label: 'Yellow highlight' },
  { id: 'blue', label: 'Blue highlight' },
  { id: 'pink', label: 'Pink highlight' },
  { id: 'underline', label: 'Underline' },
];

export const highlightsSupported = () => typeof window !== 'undefined' && typeof window.Highlight === 'function' && Boolean(window.CSS?.highlights);

// Remove [s, e) from a zone's highlights, splitting any that straddle it.
export function subtract(list, z, s, e) {
  const out = [];
  for (const h of list) {
    if (h.z !== z || h.e <= s || h.s >= e) { out.push(h); continue; }
    if (h.s < s) out.push({ ...h, e: s });
    if (h.e > e) out.push({ ...h, s: e });
  }
  return out;
}

export function addHighlight(list, z, s, e, style) {
  if (e <= s) return list;
  return [...subtract(list, z, s, e), { z, s, e, c: style }].sort((x, y) => x.z.localeCompare(y.z) || x.s - y.s);
}

const offsetIn = (zone, node, offset) => {
  const r = document.createRange();
  r.setStart(zone, 0);
  r.setEnd(node, offset);
  return r.toString().length;
};

// Character offset -> DOM position inside a zone.
function pointAt(zone, at) {
  const walk = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
  let left = at;
  let last = null;
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (left <= n.length) return [n, left];
    left -= n.length;
    last = n;
  }
  return last ? [last, last.length] : null;
}

function rangeFor(zone, s, e) {
  const a = pointAt(zone, s);
  const b = pointAt(zone, e);
  if (!a || !b) return null;
  const r = document.createRange();
  try { r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]); } catch { return null; }
  return r;
}

const zoneOf = (root, node) => {
  const el = node?.nodeType === 1 ? node : node?.parentElement;
  const z = el?.closest?.('[data-hl]');
  return z && root.contains(z) ? z : null;
};

export function useStoredHighlights(key) {
  const [all, setAll] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(all)); } catch { /* storage off */ } }, [all, key]);
  return [all, setAll];
}

// rootRef: the element that holds the zones for the current question.
export default function SatHighlighter({ rootRef, list, onChange }) {
  const [bar, setBar] = useState(null); // { x, y, z, s, e, existing }
  const barRef = useRef(null);
  const supported = highlightsSupported();

  // Paint.
  useLayoutEffect(() => {
    if (!supported) return undefined;
    const root = rootRef.current;
    const groups = Object.fromEntries(HL_STYLES.map((st) => [st.id, []]));
    if (root) {
      for (const h of list) {
        const zone = root.querySelector(`[data-hl="${h.z}"]`);
        const r = zone && rangeFor(zone, h.s, h.e);
        if (r && groups[h.c]) groups[h.c].push(r);
      }
    }
    for (const st of HL_STYLES) window.CSS.highlights.set(`sat-hl-${st.id}`, new window.Highlight(...groups[st.id]));
    return () => { for (const st of HL_STYLES) window.CSS.highlights.delete(`sat-hl-${st.id}`); };
  });

  const close = useCallback(() => setBar(null), []);

  useEffect(() => {
    if (!supported) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    const place = (rect) => ({
      x: Math.min(window.innerWidth - 120, Math.max(120, rect.left + rect.width / 2)),
      y: rect.top > 70 ? rect.top - 10 : rect.bottom + 54,
    });
    const onUp = (ev) => {
      if (barRef.current?.contains(ev.target)) return;
      // Let the selection settle (a click inside a selection collapses it after mouseup).
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) { setBar(null); return; }
        const r = sel.getRangeAt(0);
        const zone = zoneOf(root, r.startContainer);
        if (!zone || zone !== zoneOf(root, r.endContainer)) { setBar(null); return; }
        const z = zone.dataset.hl;
        const s = offsetIn(zone, r.startContainer, r.startOffset);
        const e = offsetIn(zone, r.endContainer, r.endOffset);
        if (!sel.isCollapsed && e > s && r.toString().trim()) {
          const existing = list.find((h) => h.z === z && h.s < e && h.e > s) || null;
          setBar({ ...place(r.getBoundingClientRect()), z, s, e, existing });
          return;
        }
        // A click on a highlight: edit that one.
        const hit = list.find((h) => h.z === z && h.s <= s && h.e > s);
        const hr = hit && rangeFor(zone, hit.s, hit.e);
        if (hit && hr) setBar({ ...place(hr.getBoundingClientRect()), z, s: hit.s, e: hit.e, existing: hit });
        else setBar(null);
      }, 0);
    };
    const onKey = (ev) => { if (ev.key === 'Escape') setBar(null); };
    root.addEventListener('mouseup', onUp);
    root.addEventListener('touchend', onUp);
    window.addEventListener('keydown', onKey);
    const scroller = root.closest('.sat-main');
    const onScroll = () => setBar(null);
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      root.removeEventListener('mouseup', onUp);
      root.removeEventListener('touchend', onUp);
      window.removeEventListener('keydown', onKey);
      scroller?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [rootRef, list, supported]);

  // A click anywhere outside the bar and the zones closes it.
  useEffect(() => {
    if (!bar) return undefined;
    const down = (ev) => {
      if (barRef.current?.contains(ev.target) || rootRef.current?.contains(ev.target)) return;
      setBar(null);
    };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [bar, rootRef]);

  if (!supported || !bar) return null;
  const apply = (style) => {
    onChange(addHighlight(list, bar.z, bar.s, bar.e, style));
    window.getSelection()?.removeAllRanges();
    close();
  };
  const remove = () => {
    onChange(subtract(list, bar.z, bar.s, bar.e));
    window.getSelection()?.removeAllRanges();
    close();
  };
  return (
    <div ref={barRef} className="sat-hlbar" style={{ left: bar.x, top: bar.y }} role="toolbar" aria-label="Highlight"
      onMouseDown={(e) => e.preventDefault()}>
      {HL_STYLES.map((st) => (
        <button key={st.id} type="button" className={`sat-hl-btn is-${st.id}${bar.existing?.c === st.id ? ' is-on' : ''}`}
          title={st.label} aria-label={st.label} aria-pressed={bar.existing?.c === st.id} onClick={() => apply(st.id)}>
          {st.id === 'underline' ? <span className="sat-hl-u">U</span> : <i />}
        </button>
      ))}
      {bar.existing && (
        <button type="button" className="sat-hl-btn is-remove" title="Remove highlight" aria-label="Remove highlight" onClick={remove}>
          <Icon name="trash" size={16} />
        </button>
      )}
    </div>
  );
}
