import React, { useState } from 'react';
import Icon from '../../components/ui/icons';
import * as api from '../api';
import { ErrorNote } from '../ui';

// Teacher tool: Claude drafts an example sentence, a gapped version, word forms
// and collocations for each card; the teacher checks and trims before saving.
//   cards:   [{ f, b }]                  (fronts/meanings as typed)
//   extras:  { [front lowercased]: { b?, ex, gap, ans, forms, coll } }
//   onChange(nextExtras)

const BLANK = '____';
export const extraKey = (f) => (f || '').trim().toLowerCase();

// Merge a card with its extra fields (the teacher's own meaning wins unless empty).
export function withExtras(card, extras) {
  const x = extras[extraKey(card.f)];
  if (!x) return card;
  const { b, f, ...rest } = x;
  return { ...card, b: card.b || b || '', ...rest };
}

const Gapped = ({ text, answer }) => {
  const [a, b] = (text || '').split(BLANK);
  return <>{a}<mark className="rc-fill">{answer}</mark>{b}</>;
};

function CardRow({ card, x, onChange }) {
  const [editing, setEditing] = useState(false);
  const set = (patch) => onChange({ ...x, ...patch });
  const removeAt = (field, i) => set({ [field]: (x[field] || []).filter((_, k) => k !== i) });
  return (
    <li className="ce-row">
      <div className="ce-head">
        <strong>{card.f}</strong>
        <span>{card.b || x.b}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing((v) => !v)}>
          <Icon name={editing ? 'check' : 'edit'} size={13} /> {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      {editing ? (
        <div className="ce-edit">
          <label className="form-label" htmlFor={`ex-${card.f}`}>Example sentence</label>
          <textarea id={`ex-${card.f}`} className="form-textarea" rows={2} value={x.ex || ''} onChange={(e) => set({ ex: e.target.value })} />
          <label className="form-label" htmlFor={`gap-${card.f}`}>Gapped sentence (use {BLANK})</label>
          <input id={`gap-${card.f}`} className="form-input" value={x.gap || ''} onChange={(e) => set({ gap: e.target.value })} />
          <label className="form-label" htmlFor={`ans-${card.f}`}>Answer for the gap</label>
          <input id={`ans-${card.f}`} className="form-input" value={(x.ans || []).join(', ')}
            onChange={(e) => set({ ans: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
          {x.gap && !x.gap.includes(BLANK) && <p className="form-help hub-warn">The gapped sentence needs {BLANK}.</p>}
        </div>
      ) : (
        x.ex && <p className="ce-ex">{x.gap && (x.ans || [])[0] ? <Gapped text={x.gap} answer={x.ans[0]} /> : x.ex}</p>
      )}
      {(x.forms?.length > 0 || x.coll?.length > 0) && (
        <div className="ce-chips">
          {(x.forms || []).map((f, i) => (
            <span key={`f${i}`} className="ce-chip" title={f.gap}>
              <small>{f.pos || 'form'}</small> {f.w}
              <button type="button" onClick={() => removeAt('forms', i)} aria-label={`Remove ${f.w}`}><Icon name="close" size={11} /></button>
            </span>
          ))}
          {(x.coll || []).map((c, i) => (
            <span key={`c${i}`} className="ce-chip ce-chip--coll" title={c.gap}>
              {c.p || (c.ans || []).join(' / ')}
              <button type="button" onClick={() => removeAt('coll', i)} aria-label={`Remove ${c.p}`}><Icon name="close" size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

export default function CardEnricher({ cards, extras, onChange }) {
  const [busy, setBusy] = useState(null); // progress 0..1
  const [error, setError] = useState(null);
  const missing = cards.filter((c) => !extras[extraKey(c.f)]);
  const done = cards.filter((c) => extras[extraKey(c.f)]);

  const run = async (list) => {
    setError(null); setBusy(0);
    try {
      const out = await api.enrichCards(list.map((c) => ({ f: c.f, b: c.b })), setBusy);
      const next = { ...extras };
      out.forEach((r) => { next[extraKey(r.f)] = r; });
      onChange(next);
    } catch (err) { setError(err); }
    setBusy(null);
  };

  if (!cards.length) return null;
  return (
    <div className="ce">
      <div className="ce-bar">
        <span>
          <strong>Context, word forms &amp; collocations</strong>
          <small>{done.length} of {cards.length} cards ready. Students then type answers instead of only flipping cards.</small>
        </span>
        {busy != null ? (
          <span className="dx-progress" style={{ marginTop: 0 }}><span className="dx-spin" /> Writing… {Math.round(busy * 100)}%</span>
        ) : (
          <div className="hub-actions" style={{ margin: 0 }}>
            {missing.length > 0 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => run(missing)}>
                <Icon name="sparkle" size={14} /> {done.length ? `Add for ${missing.length} more` : 'Add with AI'}
              </button>
            )}
            {done.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => run(cards)}>Redo all</button>}
          </div>
        )}
      </div>
      {error && <ErrorNote error={error} />}
      {done.length > 0 && (
        <ul className="ce-list">
          {cards.map((c) => {
            const x = extras[extraKey(c.f)];
            return x ? <CardRow key={extraKey(c.f)} card={c} x={x} onChange={(nx) => onChange({ ...extras, [extraKey(c.f)]: nx })} /> : null;
          })}
        </ul>
      )}
    </div>
  );
}
