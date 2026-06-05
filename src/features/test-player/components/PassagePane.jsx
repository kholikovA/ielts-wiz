import React from 'react';
import { HTML } from './gaps';

function HeadingGap({ qn, mhKey, place, answers, readOnly }) {
  const val = answers[qn];
  return (
    <div
      className="heading-gap"
      data-qnum={qn}
      onClick={() => !readOnly && (val ? place.clearAt(qn) : place.placeAt(mhKey, qn))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => !readOnly && place.dropAt(mhKey, qn, e)}
    >
      {val ? <span><HTML html={place.labelOf(mhKey, val)} /></span> : <span className="heading-gap-num">{qn}</span>}
      {val && !readOnly && (
        <button className="heading-gap-clear" title="Clear" onClick={(e) => { e.stopPropagation(); place.clearAt(qn); }}>×</button>
      )}
    </div>
  );
}

// Renders the reading passages. For a matching-headings part there are no A/B/C
// letter labels — a drop-zone gap sits above each questioned section instead.
export default function PassagePane({ spec, mhByPart, place, answers, readOnly }) {
  return (
    <>
      {spec.parts.map((part, pi) => {
        const mh = mhByPart[pi];
        const isMH = !!mh;
        return (
          <div className="passage-section" data-part={part.part_number} key={pi}>
            <h1 className="passage-title"><HTML html={part.passage_title} /></h1>
            {part.passage_subtitle && <div className="passage-subtitle"><HTML html={part.passage_subtitle} /></div>}
            <div className="passage-body">
              {part.passage_paragraphs.map((p, idx) => {
                const text = typeof p === 'string' ? p : p.text;
                const letter = typeof p === 'string' ? null : p.letter;
                if (isMH) {
                  const qn = letter ? mh.letterToQnum[letter] : null;
                  return (
                    <React.Fragment key={idx}>
                      {qn && <HeadingGap qn={qn} mhKey={mh.key} place={place} answers={answers} readOnly={readOnly} />}
                      <p><HTML html={text} /></p>
                    </React.Fragment>
                  );
                }
                if (letter) {
                  return (
                    <div className="para-row" key={idx}>
                      <div className="para-letter">{letter}</div>
                      <div><p><HTML html={text} /></p></div>
                    </div>
                  );
                }
                return <p key={idx}><HTML html={text} /></p>;
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
