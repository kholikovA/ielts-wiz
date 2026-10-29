import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Text with math: \( inline \), \[ display \] (LaTeX via KaTeX) and ![alt](url) images.
// Dollar signs stay plain text, so prices like $14 need no escaping.
// block: paragraphs split on blank lines; single newlines become line breaks.

const TOKEN = /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|!\[[^\]]*\]\([^)\s]+\))/g;
// Images cut from a PDF carry their size in points: ![alt](url#w=420). Shown at a
// fixed scale so text in every image matches in size.
const PT = 1.7;

function renderMath(src, display) {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false, output: 'html' });
  } catch {
    return null;
  }
}

function Parts({ text }) {
  const parts = String(text).split(TOKEN);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith('\\[') || p.startsWith('\\(')) {
      const display = p.startsWith('\\[');
      // Inline math at full size (fractions as on the SAT), not shrunk to text style.
      const html = renderMath(display ? p.slice(2, -2) : `\\displaystyle ${p.slice(2, -2)}`, display);
      if (html == null) return <code key={i}>{p}</code>;
      // eslint-disable-next-line react/no-danger
      return <span key={i} className={display ? 'mt-display' : 'mt-inline'} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    const img = p.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      const [src, hash] = img[2].split('#');
      const w = Number((hash || '').match(/w=([\d.]+)/)?.[1]) || null;
      return <img key={i} className={`mt-img${w ? ' mt-img--pdf' : ''}`} src={src} alt={img[1]} style={w ? { width: `${Math.round(w * PT)}px` } : undefined} loading="lazy" />;
    }
    const lines = p.split('\n');
    return <React.Fragment key={i}>{lines.map((l, k) => <React.Fragment key={k}>{k > 0 && <br />}{l}</React.Fragment>)}</React.Fragment>;
  });
}

export default function MathText({ text, block = false, className = '' }) {
  const paras = useMemo(() => (block ? String(text || '').split(/\n\s*\n/) : null), [text, block]);
  if (!text) return null;
  if (!block) return <span className={`mt ${className}`.trim()}><Parts text={text} /></span>;
  return (
    <div className={`mt mt-block ${className}`.trim()}>
      {paras.map((p, i) => <p key={i}><Parts text={p.trim()} /></p>)}
    </div>
  );
}
