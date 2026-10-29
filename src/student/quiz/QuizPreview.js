import React, { useMemo } from 'react';
import * as api from '../api';
import { useAsync, Loaded } from '../ui';
import MathText from './MathText';
import { keyParts, numbering } from './quiz';

// Teacher preview: every question with its correct answer and explanation.
const LETTERS = 'ABCDEFGHIJ';

export default function QuizPreview({ a }) {
  const key = useAsync(() => api.quizKey(a.id), [a.id]);
  const nums = useMemo(() => numbering(a.payload), [a.payload]);
  return (
    <Loaded state={key}>
      {(k) => {
        const keyData = k?.key || {};
        return (
          <div className="qp">
            {a.payload.sections.map((s) => (
              <section key={s.id} className="qp-section">
                {(s.title || s.instructions) && <header className="qa-sec"><span>{s.title}</span>{s.instructions}</header>}
                {s.questions.map((q) => {
                  const n = nums[q.id];
                  const kk = keyData[q.id];
                  return (
                    <article key={q.id} className="card qp-q">
                      <div className="qp-head">
                        <span className="qa-num">{n.from === n.to ? n.from : `${n.from}–${n.to}`}</span>
                        {q.bank && <small className="hub-muted">{q.bank.skill} · {q.bank.difficulty} · ID <code>{q.bank.id}</code></small>}
                      </div>
                      {q.passage && <MathText block text={q.passage} className="bank-passage" />}
                      {q.image && <img className="qz-image" src={q.image} alt="" />}
                      {q.prompt && <MathText block text={q.prompt} className="bank-prompt" />}
                      {q.type === 'mcq' ? (
                        <ol className="bank-opts">
                          {q.options.map((o, i) => <li key={i} className={(kk || []).includes(i) ? 'is-key' : ''}><b>{LETTERS[i]}</b><MathText text={o} /></li>)}
                        </ol>
                      ) : q.type !== 'open' && <p className="bank-spr"><strong>Answer:</strong> <MathText text={keyParts(q, kk).join(' | ')} /></p>}
                      {keyData._rationale?.[q.id] && (
                        <details className="bank-why" open><summary>Explanation</summary><MathText block text={keyData._rationale[q.id]} /></details>
                      )}
                    </article>
                  );
                })}
              </section>
            ))}
          </div>
        );
      }}
    </Loaded>
  );
}
