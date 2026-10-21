import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../../components/ui/icons';
import * as api from '../api';
import { ErrorNote } from '../ui';
import { formatDate, wordCount } from '../homework';
import { overallBand, draftFeedback, CRITERIA_T1, CRITERIA_T2 } from './marking';
import { MarkedEssay } from './MarkedEssay';

const BANDS = Array.from({ length: 19 }, (_, i) => (9 - i * 0.5).toFixed(1));
const bandStr = (b) => (b == null || b === '' || Number.isNaN(Number(b)) ? '' : Number(b).toFixed(1));

// Teacher's review of a writing submission. Claude drafts the marking (bands
// per criterion, comments, corrections); the teacher edits it and sends it.
// Nothing reaches the student until it's sent.
export default function WritingReview({ a, sub, onDone }) {
  const names = a.payload?.task === 'Task 1' ? CRITERIA_T1 : CRITERIA_T2;
  const sent = sub.marking;
  const [criteria, setCriteria] = useState(() => (sent?.criteria?.length
    ? sent.criteria.map((c) => ({ name: c.name, band: bandStr(c.band), comment: c.comment || '' }))
    : names.map((name) => ({ name, band: '', comment: '' }))));
  const [overall, setOverall] = useState(bandStr(sub.band));
  const overallTouched = useRef(sub.band != null);
  const [feedback, setFeedback] = useState(sub.feedback || '');
  const [corrections, setCorrections] = useState(() => (sent?.corrections || []).map((c) => ({ ...c, on: true })));
  const [ai, setAi] = useState({ state: sent ? 'idle' : 'loading', error: null, model: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const applyDraft = useCallback((result, model) => {
    setCriteria(result.criteria.map((c, i) => ({ name: c.name || names[i], band: bandStr(c.band), comment: c.comment || '' })));
    setCorrections((result.corrections || []).map((c) => ({ ...c, on: true })));
    setFeedback(draftFeedback(result));
    overallTouched.current = false;
    setOverall(Number(result.overall ?? overallBand(result.criteria.map((c) => c.band))).toFixed(1));
    setAi({ state: 'done', error: null, model });
  }, [names]);

  const runAi = useCallback(async (force = false) => {
    setAi({ state: 'loading', error: null, model: null });
    try {
      const out = await api.aiMarkWriting(sub.id, force);
      applyDraft(out.result, out.model);
    } catch (err) {
      setAi({ state: 'error', error: err, model: null });
    }
  }, [sub.id, applyDraft]);

  // Draft automatically the first time a submission is opened (cached after that).
  useEffect(() => { if (!sent) runAi(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setCrit = (i, field, value) => {
    setCriteria((list) => {
      const next = list.map((c, k) => (k === i ? { ...c, [field]: value } : c));
      if (field === 'band' && !overallTouched.current) {
        const o = overallBand(next.map((c) => (c.band === '' ? null : c.band)));
        if (o != null && next.every((c) => c.band !== '')) setOverall(o.toFixed(1));
      }
      return next;
    });
  };

  const save = async () => {
    setBusy(true); setError(null);
    const marking = criteria.some((c) => c.band !== '' || c.comment.trim()) || corrections.some((c) => c.on)
      ? {
        criteria: criteria.filter((c) => c.band !== '').map((c) => ({ name: c.name, band: Number(c.band), comment: c.comment.trim() })),
        corrections: corrections.filter((c) => c.on).map(({ on, ...c }) => c),
        ai_model: ai.model || sent?.ai_model || null,
      }
      : null;
    try {
      await api.reviewSubmission(sub.id, overall === '' ? null : Number(overall), feedback, marking);
      onDone();
    } catch (err) { setError(err); setBusy(false); }
  };

  const included = corrections.filter((c) => c.on);
  return (
    <div className="hub-review wm-review">
      <p className="form-help">{wordCount(sub.body)} words · submitted {formatDate(sub.submitted_at, true)}</p>

      <div className={`wm-ai wm-ai--${ai.state}`} role="status">
        {ai.state === 'loading' && <><span className="dx-spin" /> Claude is marking this essay. This takes about half a minute.</>}
        {ai.state === 'done' && <><Icon name="sparkle" size={14} /> Draft from Claude. Check and adjust before sending; the student sees nothing until you do.
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => runAi(true)}>Re-mark</button></>}
        {ai.state === 'error' && <><Icon name="xCircle" size={14} /> {ai.error?.message || 'AI marking failed.'}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => runAi(false)}>Try again</button></>}
        {ai.state === 'idle' && <><Icon name="check" size={14} /> Sent {formatDate(sub.reviewed_at, true)}. Edit and update below.
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => runAi(false)}><Icon name="sparkle" size={14} /> Load Claude's draft</button></>}
      </div>

      <div className="wm-grid">
        {criteria.map((c, i) => (
          <div key={c.name} className="wm-crit-edit">
            <div className="wm-crit-head">
              <label htmlFor={`crit-${sub.id}-${i}`}>{c.name}</label>
              <select id={`crit-${sub.id}-${i}`} className="form-select" value={c.band} onChange={(e) => setCrit(i, 'band', e.target.value)}>
                <option value="">—</option>
                {BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <textarea className="form-textarea" rows={3} value={c.comment} onChange={(e) => setCrit(i, 'comment', e.target.value)} aria-label={`${c.name} comment`} />
          </div>
        ))}
      </div>

      <div className="hub-form-row">
        <div className="form-field">
          <label className="form-label" htmlFor={`band-${sub.id}`}>Overall band</label>
          <select id={`band-${sub.id}`} className="form-select" value={overall} onChange={(e) => { overallTouched.current = true; setOverall(e.target.value); }}>
            <option value="">—</option>
            {BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <p className="form-help">Worked out from the four criteria unless you change it.</p>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={`fb-${sub.id}`}>Feedback</label>
        <textarea id={`fb-${sub.id}`} className="form-textarea" rows={6} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </div>

      <div className="form-field">
        <span className="form-label">Corrections ({included.length} of {corrections.length} included)</span>
        {corrections.length ? (
          <>
            <MarkedEssay text={sub.body || ''} corrections={included} />
            <ul className="wm-pick">
              {corrections.map((c, i) => (
                <li key={i}>
                  <label>
                    <input type="checkbox" checked={c.on} onChange={() => setCorrections((list) => list.map((x, k) => (k === i ? { ...x, on: !x.on } : x)))} />
                    <span><del>{c.quote}</del> <Icon name="arrowRight" size={12} /> <ins>{c.fix}</ins>{c.note ? <small>{c.note}</small> : null}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : <div className="hub-pre hub-essay-view">{sub.body || '(empty)'}</div>}
      </div>

      {error && <ErrorNote error={error} />}
      <button type="button" className="btn btn-primary" disabled={busy || ai.state === 'loading'} onClick={save}>
        {busy ? 'Sending…' : sub.reviewed_at ? 'Update review' : 'Send to student'}
      </button>
    </div>
  );
}
