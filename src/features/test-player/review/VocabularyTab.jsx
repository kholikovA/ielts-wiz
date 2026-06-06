import React from 'react';

// Per-test vocabulary list: word + definition (+ optional in-passage context).
// Filtered to the active part when the entries carry a `part`, otherwise shows
// the whole list. The tab is only mounted when there is vocabulary to show.
export default function VocabularyTab({ vocabulary, activePart }) {
  const list = vocabulary || [];
  const scoped = list.some((v) => v.part != null)
    ? list.filter((v) => v.part == null || v.part === activePart)
    : list;

  if (!scoped.length) {
    return <div className="rv-vocab-empty">No vocabulary for this passage.</div>;
  }
  return (
    <ul className="rv-vocab">
      {scoped.map((v, i) => (
        <li className="rv-vocab-item" key={`${v.word}-${i}`}>
          <div className="rv-vocab-word">{v.word}</div>
          <div className="rv-vocab-def">{v.definition}</div>
          {v.context && <div className="rv-vocab-context">“{v.context}”</div>}
        </li>
      ))}
    </ul>
  );
}
