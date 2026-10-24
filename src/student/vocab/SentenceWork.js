import React, { useMemo, useState } from 'react';
import Icon from '../../components/ui/icons';
import * as api from '../api';
import { useHub, useAsync, ErrorNote, Spinner } from '../ui';
import { checkDictation } from '../dictation/diff';
import { confirmDialog } from '../dialog';

// "Use it in a sentence": one sentence per target word, each checked by Claude
// (correct / almost / wrong + a corrected version and a tip). Up to 3 checks
// per word; a word counts as used once a check says "correct".

export const MAX_CHECKS = 3;
// Same numbers as the sentence-check edge function (checked there too).
export const LEVELS = {
  junior: { label: 'Junior', min: 8, ask: 'at least 8 words, with a reason, result or example' },
  senior: { label: 'Senior', min: 12, ask: 'at least 12 words, an academic tone and a complex structure (e.g. a which / although / if clause)' },
};
export const levelOf = (a) => (a.payload?.level === 'senior' ? 'senior' : 'junior');
const countWords = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const VERDICT = {
  correct: { label: 'Correct', icon: 'checkCircle' },
  simple: { label: 'Too simple', icon: 'trending' },
  almost: { label: 'Almost', icon: 'edit' },
  wrong: { label: 'Not yet', icon: 'xCircle' },
};

// Latest check per word index, plus how many checks each word has had.
export function summariseChecks(checks) {
  const latest = {};
  const count = {};
  checks.forEach((c) => {
    latest[c.word_index] = c;
    count[c.word_index] = (count[c.word_index] || 0) + 1;
  });
  return { latest, count };
}

export const usedCount = (checks) => new Set(checks.filter((c) => c.verdict === 'correct').map((c) => c.word_index)).size;

// The learner's sentence with the AI's edits marked (removed red, added green).
export function Changes({ sentence, corrected }) {
  const ops = useMemo(() => checkDictation(sentence || '', corrected || '').ops, [sentence, corrected]);
  if (!corrected || ops.every((o) => o.t === 'ok')) return null;
  return (
    <p className="uw-changes">
      {ops.map((o, i) => {
        if (o.t === 'ok') return <span key={i}>{o.said} </span>;
        if (o.t === 'extra') return <React.Fragment key={i}><del>{o.said}</del> </React.Fragment>;
        if (o.t === 'miss') return <React.Fragment key={i}><ins>{o.ref}</ins> </React.Fragment>;
        return <React.Fragment key={i}><del>{o.said}</del> <ins>{o.ref}</ins> </React.Fragment>;
      })}
    </p>
  );
}

export function CheckResult({ check }) {
  if (!check) return null;
  const v = VERDICT[check.verdict] || VERDICT.almost;
  return (
    <div className={`uw-result uw-result--${check.verdict}`}>
      <span className="uw-verdict"><Icon name={v.icon} size={14} /> {v.label}</span>
      {check.verdict === 'simple'
        ? check.corrected && <p className="uw-upgrade"><small>Try something like</small>{check.corrected}</p>
        : <Changes sentence={check.sentence} corrected={check.corrected} />}
      {check.tip && <p className="uw-tip">{check.tip}</p>}
    </div>
  );
}

function WordRow({ a, i, word, check, count, locked, onChecked, min }) {
  const [text, setText] = useState(check?.sentence || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const left = MAX_CHECKS - (count || 0);
  const n = countWords(text);
  const run = async () => {
    setBusy(true); setError(null);
    try {
      const sentence = text.replace(/\s+/g, ' ').trim();
      const r = await api.checkSentence(a.id, i, sentence);
      if (!r.cached) onChecked({ word_index: i, word: word.w, sentence, verdict: r.verdict, corrected: r.corrected, tip: r.tip, created_at: new Date().toISOString() });
    } catch (err) { setError(err); }
    setBusy(false);
  };
  const changed = text.trim() && text.replace(/\s+/g, ' ').trim() !== (check?.sentence || '');
  return (
    <li className={`card uw-row${check ? ` is-${check.verdict}` : ''}`}>
      <div className="uw-word">
        <span className="uw-n">{i + 1}</span>
        <strong>{word.w}</strong>
        {word.m && <span className="uw-meaning">{word.m}</span>}
      </div>
      <textarea className="form-textarea uw-input" rows={2} value={text} readOnly={locked || busy}
        onChange={(e) => setText(e.target.value)} placeholder={`Write a sentence using “${word.w}”…`}
        aria-label={`Your sentence with ${word.w}`} spellCheck autoCapitalize="sentences" />
      <CheckResult check={check} />
      {!locked && (
        <div className="uw-actions">
          <small className={n && n < min ? 'hub-warn' : ''}>
            {n < min ? `${n}/${min} words` : left > 0 ? `${left} check${left === 1 ? '' : 's'} left` : 'No checks left'}
          </small>
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy || left <= 0 || !changed || n < min} onClick={run}>
            {busy ? <><span className="dx-spin" /> Checking…</> : <><Icon name="sparkle" size={14} /> {check ? 'Check again' : 'Check'}</>}
          </button>
        </div>
      )}
      {error && <ErrorNote error={error} />}
    </li>
  );
}

export default function SentenceWork({ a, onSaved }) {
  const { user, preview } = useHub();
  const words = a.payload?.words || [];
  const sub = a.submission;
  const locked = sub?.status === 'submitted';
  const checks = useAsync(() => api.usageChecks(a.id, user.id), [a.id, user.id]);
  const [added, setAdded] = useState([]); // results returned since loading (no refetch)
  const level = levelOf(a);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (checks.loading && !checks.data) return <Spinner />;
  const list = [...(checks.data || []), ...added];
  const { latest, count } = summariseChecks(list);
  const checkedAll = words.every((_, i) => latest[i]);
  const used = usedCount(list);

  const submit = async () => {
    if (!await confirmDialog({
      title: 'Submit your sentences?',
      body: `${used} of ${words.length} words used correctly. You can't check any more sentences after submitting.`,
      confirmLabel: 'Submit',
    })) return;
    setBusy(true); setError(null);
    try {
      await api.saveSubmission(a.id, user.id, {
        status: 'submitted', submitted_at: new Date().toISOString(),
        body: words.map((w, i) => `${w.w}: ${latest[i]?.sentence || ''}`).join('\n'),
        data: { used, total: words.length },
      });
      onSaved();
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <>
      <div className="card uw-intro">
        <Icon name="type" size={18} />
        <p>
          Write one sentence of your own with each word, using any form of it (e.g. <em>economy → economic</em>).
          {' '}<strong>{LEVELS[level].label} level:</strong> {LEVELS[level].ask}.
          {' '}Each sentence gets instant feedback; you can improve it and check up to {MAX_CHECKS} times.
        </p>
      </div>
      {preview && <p className="form-help">Preview: checking is only available to the student.</p>}
      <ol className="uw-list">
        {words.map((w, i) => (
          <WordRow key={i} a={a} i={i} word={w} check={latest[i]} count={count[i]} locked={locked || preview} min={LEVELS[level].min}
            onChecked={(row) => setAdded((x) => [...x, row])} />
        ))}
      </ol>
      <div className="card uw-foot">
        <span><strong>{used}</strong> of {words.length} used correctly</span>
        {locked
          ? <span className="dx-locked"><Icon name="check" size={14} /> Submitted</span>
          : <button type="button" className="btn btn-primary" disabled={busy || !checkedAll || preview} onClick={submit}>
            {busy ? 'Submitting…' : checkedAll ? 'Submit' : 'Check every sentence to submit'}
          </button>}
      </div>
      {error && <ErrorNote error={error} />}
    </>
  );
}

// Teacher: the latest check per word for one student.
export function SentenceResults({ words, checks }) {
  const { latest, count } = summariseChecks(checks);
  return (
    <ol className="uw-list uw-list--review">
      {words.map((w, i) => (
        <li key={i} className={`uw-row${latest[i] ? ` is-${latest[i].verdict}` : ''}`}>
          <div className="uw-word"><span className="uw-n">{i + 1}</span><strong>{w.w}</strong>{count[i] > 1 && <small>{count[i]} tries</small>}</div>
          {latest[i] ? <><p className="uw-sentence">{latest[i].sentence}</p><CheckResult check={latest[i]} /></> : <p className="form-help">Not attempted.</p>}
        </li>
      ))}
    </ol>
  );
}
