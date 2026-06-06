import React from 'react';
import { dedupeSpans } from './evidence';

// Split a paragraph's text at its evidence spans, wrapping each matched run in a
// <mark> with an anchor id (#ev-q12) and an inline Q-badge. Plain runs keep their
// HTML; matched runs are tag-free (tag-spanning matches were dropped upstream).
function renderParagraph(text, spans, currentQ, onSelectQuestion) {
  if (!spans.length) return <span dangerouslySetInnerHTML={{ __html: text }} />;
  const clean = dedupeSpans(spans);
  const nodes = [];
  let cursor = 0;
  clean.forEach((s, i) => {
    if (s.start > cursor) {
      nodes.push(<span key={`t${i}`} dangerouslySetInnerHTML={{ __html: text.slice(cursor, s.start) }} />);
    }
    nodes.push(
      <mark
        key={`e${s.qnum}`}
        id={`ev-q${s.qnum}`}
        className={`ev-span${s.qnum === currentQ ? ' current' : ''}`}
        data-qnum={s.qnum}
        onClick={() => onSelectQuestion(s.qnum)}
        title={`Question ${s.qnum}`}
      >
        <sup className="ev-badge">Q{s.qnum}</sup>{text.slice(s.start, s.end)}
      </mark>
    );
    cursor = s.end;
  });
  if (cursor < text.length) {
    nodes.push(<span key="tail" dangerouslySetInnerHTML={{ __html: text.slice(cursor) }} />);
  }
  return nodes;
}

// Read-only passage for one part, with evidence highlights + badges. No user
// highlighter, no placement controllers — purely presentational.
export default function ReviewPassagePane({ part, byParagraph, currentQ, onSelectQuestion }) {
  return (
    <div className="rv-passage-body">
      <h1 className="rv-passage-title" dangerouslySetInnerHTML={{ __html: part.passage_title || '' }} />
      {part.passage_subtitle && (
        <div className="rv-passage-subtitle" dangerouslySetInnerHTML={{ __html: part.passage_subtitle }} />
      )}
      {part.passage_paragraphs.map((p, idx) => {
        const text = typeof p === 'string' ? p : (p.text || '');
        const letter = typeof p === 'string' ? null : p.letter;
        const spans = byParagraph.get(`${part.part_number}:${idx}`) || [];
        const body = <p className="rv-para">{renderParagraph(text, spans, currentQ, onSelectQuestion)}</p>;
        if (letter) {
          return (
            <div className="rv-para-row" key={idx}>
              <div className="rv-para-letter">{letter}</div>
              <div>{body}</div>
            </div>
          );
        }
        return <React.Fragment key={idx}>{body}</React.Fragment>;
      })}
    </div>
  );
}
