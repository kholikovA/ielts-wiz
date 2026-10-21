import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../../components/ui/icons';
import * as api from '../api';
import { useHub, useAsync, ErrorNote, Spinner } from '../ui';
import { formatDate, wordCount } from '../homework';
import { checkDictation } from './diff';
import DictationPlayer from './DictationPlayer';

// Colour-coded check of a dictation against its transcript:
// extra words struck in red, misspellings corrected in yellow, missing words in green.
export function DictationResult({ text, transcript }) {
  const { ops, score } = useMemo(() => checkDictation(text, transcript), [text, transcript]);
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="dx-result">
      <div className="dx-score">
        <div className="dx-score-main">
          <strong>{score.accuracy}%</strong>
          <span>{score.correct} of {score.total} words correct</span>
        </div>
        <div className="dx-score-chips">
          <span className="dx-chip dx-chip--typo">{score.typos} misspelt</span>
          <span className="dx-chip dx-chip--miss">{score.missing} missing</span>
          <span className="dx-chip dx-chip--extra">{score.extra} extra</span>
        </div>
      </div>
      <p className="dx-diff">
        {ops.map((o, i) => {
          const k = `${i}-${o.t}`;
          if (o.t === 'ok') return <span key={k}>{o.said} </span>;
          if (o.t === 'extra') return <React.Fragment key={k}><del className="dx-extra" title="Not in the recording">{o.said}</del> </React.Fragment>;
          if (o.t === 'miss') return <React.Fragment key={k}><ins className="dx-miss" title="Missed">{o.ref}</ins> </React.Fragment>;
          return <React.Fragment key={k}><mark className="dx-typo" title={`You wrote "${o.said}"`}><s>{o.said}</s>{o.ref}</mark> </React.Fragment>;
        })}
      </p>
      <div className="dx-legend">
        <span><del className="dx-extra">extra</del> not in the recording</span>
        <span><mark className="dx-typo">corrected</mark> misspelt</span>
        <span><ins className="dx-miss">missing</ins> not typed</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowKey((v) => !v)}>
          <Icon name="bookOpen" size={14} /> {showKey ? 'Hide transcript' : 'Show transcript'}
        </button>
      </div>
      {showKey && <p className="dx-key hub-pre">{transcript}</p>}
    </div>
  );
}

const SAVE_EVERY_MS = 15000;

// Student side of a dictation assignment.
export function DictationWork({ a, onSaved }) {
  const { user, preview } = useHub();
  const sub = a.submission;
  const locked = sub?.status === 'submitted';
  const draftKey = `iw.v1.hub.draft.${a.id}`;
  const [text, setText] = useState(() => {
    if (sub?.body) return sub.body;
    try { return localStorage.getItem(draftKey) || ''; } catch { return ''; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const lastSaved = useRef(sub?.body || '');
  const cues = a.payload?.cues || [];

  // Draft: locally on every change, to the server every 15 s (so another device can carry on).
  useEffect(() => {
    if (locked) return undefined;
    try { localStorage.setItem(draftKey, text); } catch { /* storage off */ }
    return undefined;
  }, [text, locked, draftKey]);
  const textRef = useRef(text);
  textRef.current = text;
  useEffect(() => {
    if (locked || preview) return undefined;
    const id = setInterval(() => {
      const t = textRef.current;
      if (t === lastSaved.current || !t.trim()) return;
      api.saveSubmission(a.id, user.id, { status: 'in_progress', body: t })
        .then(() => { lastSaved.current = t; setSavedAt(new Date()); })
        .catch(() => {});
    }, SAVE_EVERY_MS);
    return () => clearInterval(id);
  }, [a.id, user.id, locked, preview]);

  const key = useAsync(() => (locked ? api.dictationKey(a.id) : Promise.resolve(null)), [a.id, locked]);

  // Once the key is readable, store the score with the submission (for lists and the teacher).
  useEffect(() => {
    if (!locked || !key.data || sub?.data?.score || preview) return;
    const { score } = checkDictation(sub.body || '', key.data.transcript);
    api.saveSubmissionData(a.id, user.id, { score }).catch(() => {});
  }, [locked, key.data, sub, a.id, user.id, preview]);

  const submit = async () => {
    if (!window.confirm("Submit your dictation? You won't be able to change it afterwards, and you'll see the transcript.")) return;
    setBusy(true); setError(null);
    try {
      await api.saveSubmission(a.id, user.id, { status: 'submitted', body: text, submitted_at: new Date().toISOString() });
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      onSaved();
    } catch (err) { setError(err); setBusy(false); }
  };

  if (!a.payload?.audio_url || !cues.length) return <ErrorNote error={{ message: 'This dictation has no audio.' }} />;

  return (
    <>
      <div className="dx-sticky">
        <DictationPlayer src={a.payload.audio_url} cues={cues} storageKey={`iw.v1.hub.dict.${a.id}`} />
      </div>
      <div className="card dx-answer">
        <textarea
          className={`form-textarea dx-input${locked ? ' is-locked' : ''}`}
          value={locked ? (sub.body || '') : text}
          onChange={(e) => setText(e.target.value)}
          readOnly={locked}
          placeholder="Type what you hear…"
          aria-label="Your dictation"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
        />
        <div className="hub-essay-foot">
          <span>
            {wordCount(locked ? sub.body : text)} words
            {locked && sub.submitted_at ? ` · submitted ${formatDate(sub.submitted_at, true)}` : savedAt ? ' · saved' : ''}
          </span>
          {!locked && (
            <button type="button" className="btn btn-primary" disabled={busy || !text.trim()} onClick={submit}>
              {busy ? 'Submitting…' : 'Submit'}
            </button>
          )}
          {locked && <span className="dx-locked"><Icon name="check" size={14} /> Submitted</span>}
        </div>
        {error && <ErrorNote error={error} />}
      </div>
      {locked && (
        <section className="hub-section">
          <h2 className="h3">Check</h2>
          {key.loading ? <Spinner /> : key.data
            ? <div className="card"><DictationResult text={sub.body || ''} transcript={key.data.transcript} /></div>
            : <ErrorNote error={key.error || { message: "The transcript isn't available." }} />}
        </section>
      )}
    </>
  );
}
