import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Text with math: \( inline \), \[ display \] (LaTeX via KaTeX) and ![alt](url) images.
// Inline marks <i>, <u>, <b> (italic titles, underlined parts of a passage) may wrap any of these.
// Dollar signs stay plain text, so prices like $14 need no escaping.
// block: paragraphs split on blank lines; single newlines become line breaks.
// Tables: [table] ... [/table], one row per line, cells split by " | ". A row starting
// with "!" is a header row, "^" a caption; a cell ending in "*N" spans N columns.

const TOKEN = /(\[table\][\s\S]*?\[\/table\]|<([iub])>[\s\S]*?<\/\2>|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|!\[[^\]]*\]\([^)\s]+\))/g;
const MARK = /^<([iub])>([\s\S]*)<\/\1>$/;
const TAGS = { i: 'em', u: 'u', b: 'strong' };
// Images cut from a PDF carry their size in points: ![alt](url#w=420). Shown at a
// fixed scale so text in every image matches in size.
// Figures (graphs, diagrams) carry their display width in CSS px: ![Figure](url#fig=330).
const PT = 1.7;

function renderMath(src, display) {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false, output: 'html' });
  } catch {
    return null;
  }
}

const TABLE = /^\[table\]([\s\S]*)\[\/table\]$/;

function Table({ src }) {
  const lines = src.split('\n').map((l) => l.trim()).filter(Boolean);
  const caption = lines.filter((l) => l.startsWith('^')).map((l) => l.slice(1).trim());
  const rows = lines.filter((l) => !l.startsWith('^')).map((l) => {
    const head = l.startsWith('!');
    const cells = (head ? l.slice(1) : l).split(' | ').map((c) => {
      const m = c.trim().match(/^([\s\S]*?)\*(\d+)$/);
      return m ? { text: m[1].trim(), span: Number(m[2]) } : { text: c.trim(), span: 1 };
    });
    return { head, cells };
  });
  return (
    <span className="mt-table-wrap">
      <table className="mt-table">
        {caption.length > 0 && <caption>{caption.map((c, i) => <Parts key={i} text={c} />)}</caption>}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.cells.map((c, k) => {
                const Cell = r.head ? 'th' : 'td';
                return <Cell key={k} colSpan={c.span > 1 ? c.span : undefined}><Parts text={c.text} /></Cell>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </span>
  );
}

function Parts({ text }) {
  // split() also returns the tag-letter capture group; drop those single letters.
  const parts = String(text).split(TOKEN).filter((p, i) => i % 3 !== 2);
  return parts.map((p, i) => {
    if (!p) return null;
    const table = p.match(TABLE);
    if (table) return <Table key={i} src={table[1]} />;
    const mark = p.match(MARK);
    if (mark) {
      const Tag = TAGS[mark[1]];
      return <Tag key={i}><Parts text={mark[2]} /></Tag>;
    }
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
      const figW = Number((hash || '').match(/^fig=([\d.]+)/)?.[1]) || null;
      if (figW) return <img key={i} className="mt-img mt-fig" src={src} alt={img[1] || 'Figure'} style={{ width: `${Math.round(figW)}px` }} loading="lazy" />;
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
      {paras.map((p, i) => (TABLE.test(p.trim())
        ? <div key={i} className="mt-para"><Parts text={p.trim()} /></div>
        : <p key={i}><Parts text={p.trim()} /></p>))}
    </div>
  );
}
