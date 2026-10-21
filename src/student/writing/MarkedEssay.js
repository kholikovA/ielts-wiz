import React, { useMemo, useState } from 'react';
import Icon from '../../components/ui/icons';
import { placeCorrections } from './marking';

const TYPE_LABEL = { grammar: 'Grammar', vocabulary: 'Vocabulary', spelling: 'Spelling', punctuation: 'Punctuation' };

// The essay with each correction inline: the original struck in red, the fix in green.
export function MarkedEssay({ text, corrections }) {
  const { parts, missing } = useMemo(() => placeCorrections(text || '', corrections || []), [text, corrections]);
  const [showList, setShowList] = useState(false);
  const all = corrections || [];
  return (
    <div className="wm-essay">
      <div className="wm-text">
        {parts.map((p, i) => (p.c ? (
          <span key={i} className="wm-corr" title={`${TYPE_LABEL[p.c.type] || 'Correction'}${p.c.note ? `: ${p.c.note}` : ''}`}>
            <del>{p.text}</del>
            {p.c.fix ? <ins>{p.c.fix}</ins> : null}
            <sup>{p.n}</sup>
          </span>
        ) : <React.Fragment key={i}>{p.text}</React.Fragment>))}
      </div>
      {all.length > 0 && (
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowList((v) => !v)}>
            <Icon name="bookOpen" size={14} /> {showList ? 'Hide explanations' : `Explain the ${all.length} correction${all.length === 1 ? '' : 's'}`}
          </button>
          {showList && (
            <ol className="wm-list">
              {all.map((c, i) => (
                <li key={i} className={missing.includes(c) ? 'is-missing' : ''}>
                  <span className={`wm-type wm-type--${c.type}`}>{TYPE_LABEL[c.type] || 'Note'}</span>
                  <span><del>{c.quote}</del> <Icon name="arrowRight" size={12} /> <ins>{c.fix}</ins>{c.note ? <small>{c.note}</small> : null}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

// What the student sees after the teacher sends the review.
export function MarkingView({ submission }) {
  const m = submission.marking;
  if (!m) return null;
  return (
    <div className="wm-view">
      {m.criteria?.length > 0 && (
        <div className="wm-criteria">
          {m.criteria.map((c) => (
            <div key={c.name} className="wm-crit">
              <div className="wm-crit-head"><span>{c.name}</span><strong>{Number(c.band).toFixed(1)}</strong></div>
              {c.comment && <p>{c.comment}</p>}
            </div>
          ))}
        </div>
      )}
      {m.corrections?.length > 0 && (
        <section>
          <h4 className="wm-h">Your essay, corrected</h4>
          <MarkedEssay text={submission.body} corrections={m.corrections} />
        </section>
      )}
    </div>
  );
}
