import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from '../../components/ui/icons';
import { listeningTestsData } from '../../data/listening-tests';
import { useHub, Seg, ErrorNote } from '../ui';
import { prepareDictation, MAX_MINUTES } from './media';
import { fmtTime } from './cues';

const PART_TESTS = ['part1', 'part2', 'part3', 'part4'].map((part, i) => ({
  label: `Part ${i + 1}`,
  tests: listeningTestsData[part] || [],
}));
const testTitle = (id) => PART_TESTS.flatMap((g) => g.tests).find((t) => String(t.id) === String(id))?.title;

/**
 * Teacher's dictation source picker. Calls onChange(dict) with
 *   { payload, key: { transcript, source }, title } once audio is prepared and
 *   at least one sentence is selected, or null.
 * `initial` (when duplicating) is { payload, key } and is used as-is.
 */
export default function DictationSetup({ onChange, initial, onSuggestTitle }) {
  const { user } = useHub();
  const [mode, setMode] = useState('test');
  const [testId, setTestId] = useState('');
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [transcript, setTranscript] = useState('');
  const [step, setStep] = useState(null); // { label, progress }
  const [error, setError] = useState(null);
  const [prepared, setPrepared] = useState(null); // { audio_url, duration, cues, transcript_source, source }
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [skipAnnouncer, setSkipAnnouncer] = useState(true);
  const [keepInitial, setKeepInitial] = useState(Boolean(initial));
  const audition = useRef(null);
  const auditionStop = useRef(null);

  const hasAnnouncer = prepared?.cues.some((c) => c.a);
  const selected = useMemo(() => {
    if (!prepared) return [];
    return prepared.cues
      .map((c, i) => ({ ...c, i }))
      .filter((c) => c.i >= from && c.i <= to && !(skipAnnouncer && c.a));
  }, [prepared, from, to, skipAnnouncer]);

  useEffect(() => {
    if (keepInitial && initial) { onChange(initial); return; }
    if (!prepared || !selected.length) { onChange(null); return; }
    onChange({
      payload: {
        source: prepared.source.kind,
        test_id: prepared.source.kind === 'test' ? Number(prepared.source.id) : undefined,
        audio_url: prepared.audio_url,
        duration: Math.round(prepared.duration),
        cues: selected.map((c) => ({ s: c.s, e: c.e })),
      },
      key: { transcript: selected.map((c) => c.text).join(' '), source: prepared.transcript_source },
    });
  }, [prepared, selected, keepInitial, initial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { audition.current?.pause(); }, []);

  const run = async () => {
    setError(null);
    let source;
    if (mode === 'test') {
      if (!testId) { setError({ message: 'Choose a test.' }); return; }
      source = { kind: 'test', id: testId };
    } else if (mode === 'file') {
      if (!file) { setError({ message: 'Choose a file.' }); return; }
      source = { kind: 'file', file };
    } else {
      if (!link.trim()) { setError({ message: 'Paste a link.' }); return; }
      source = { kind: 'link', url: link.trim() };
    }
    setStep({ label: 'Starting', progress: null });
    try {
      const out = await prepareDictation({
        uid: user.id, source, transcript: mode === 'test' ? '' : transcript,
        step: (label, progress) => setStep({ label, progress }),
      });
      setPrepared({ ...out, source: mode === 'test' ? source : { kind: mode } });
      setFrom(0);
      setTo(out.cues.length - 1);
      setSkipAnnouncer(true);
      if (onSuggestTitle) {
        if (mode === 'test') onSuggestTitle(`Dictation: ${testTitle(testId) || `Test ${testId}`}`);
        else if (mode === 'file') onSuggestTitle(`Dictation: ${file.name.replace(/\.[^.]+$/, '')}`);
        else onSuggestTitle('Dictation');
      }
    } catch (err) {
      setError(err);
    }
    setStep(null);
  };

  const reset = () => {
    audition.current?.pause();
    setPrepared(null);
    setKeepInitial(false);
  };

  const listen = (c) => {
    if (!audition.current) audition.current = new Audio();
    const a = audition.current;
    if (a.src !== prepared.audio_url) a.src = prepared.audio_url;
    clearInterval(auditionStop.current);
    a.currentTime = Math.max(0, c.s - 0.05);
    a.play().catch(() => {});
    auditionStop.current = setInterval(() => { if (a.currentTime >= c.e) { a.pause(); clearInterval(auditionStop.current); } }, 30);
  };

  if (keepInitial && initial) {
    return (
      <div className="form-field">
        <span className="form-label">Audio</span>
        <div className="card dx-ready">
          <Icon name="headphones" size={16} />
          <span>Same recording and sentences as the original ({initial.payload.cues.length} sentences).</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Change</button>
        </div>
      </div>
    );
  }

  if (prepared) {
    const words = selected.reduce((n, c) => n + c.text.split(/\s+/).filter(Boolean).length, 0);
    const secs = selected.reduce((n, c) => n + (c.e - c.s), 0);
    return (
      <div className="form-field">
        <span className="form-label">Sentences</span>
        <div className="card dx-ready">
          <Icon name="headphones" size={16} />
          <span>
            <strong>{selected.length} sentences</strong> · {words} words · {fmtTime(secs)} of speech
            <small>{prepared.transcript_source === 'generated' ? 'Transcript generated from the audio. Check it below.' : prepared.transcript_source === 'teacher' ? 'Using your transcript.' : 'Transcript from the test.'}</small>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Change audio</button>
        </div>
        <div className="hub-form-row" style={{ marginTop: 12 }}>
          <div className="form-field">
            <label className="form-label" htmlFor="dx-from">From</label>
            <select id="dx-from" className="form-select" value={from} onChange={(e) => { const v = Number(e.target.value); setFrom(v); if (to < v) setTo(v); }}>
              {prepared.cues.map((c, i) => <option key={i} value={i}>{i + 1}. {c.text.slice(0, 60)}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="dx-to">To</label>
            <select id="dx-to" className="form-select" value={to} onChange={(e) => { const v = Number(e.target.value); setTo(v); if (from > v) setFrom(v); }}>
              {prepared.cues.map((c, i) => <option key={i} value={i}>{i + 1}. {c.text.slice(0, 60)}</option>)}
            </select>
          </div>
        </div>
        {hasAnnouncer && (
          <label className="hub-check">
            <input type="checkbox" checked={skipAnnouncer} onChange={(e) => setSkipAnnouncer(e.target.checked)} />
            Skip the exam instructions ("Now listen carefully…")
          </label>
        )}
        <ol className="dx-cues">
          {prepared.cues.map((c, i) => {
            const on = i >= from && i <= to && !(skipAnnouncer && c.a);
            return (
              <li key={i} className={on ? '' : 'is-off'}>
                <button type="button" className="dx-cue-play" onClick={() => listen(c)} aria-label={`Play sentence ${i + 1}`}><Icon name="play" size={12} /></button>
                <span className="dx-cue-n">{i + 1}</span>
                <span className="dx-cue-t">{fmtTime(c.s)}</span>
                <span className="dx-cue-text">{c.text}</span>
              </li>
            );
          })}
        </ol>
        {!selected.length && <ErrorNote error={{ message: 'No sentences selected.' }} />}
      </div>
    );
  }

  const busy = Boolean(step);
  return (
    <div className="form-field">
      <span className="form-label">Audio</span>
      <Seg label="Audio source" value={mode} onChange={(v) => { setMode(v); setError(null); }} options={[
        { value: 'test', label: 'Listening test', icon: 'headphones' },
        { value: 'file', label: 'Upload', icon: 'upload' },
        { value: 'link', label: 'Link', icon: 'link' },
      ]} />
      <div style={{ marginTop: 12 }}>
        {mode === 'test' && (
          <select className="form-select" value={testId} onChange={(e) => setTestId(e.target.value)} aria-label="Test" disabled={busy}>
            <option value="">Choose a listening test…</option>
            {PART_TESTS.map((g) => (
              <optgroup key={g.label} label={`Listening ${g.label}`}>
                {g.tests.map((t) => <option key={t.id} value={t.id}>Test {t.id}: {t.title}</option>)}
              </optgroup>
            ))}
          </select>
        )}
        {mode === 'file' && (
          <>
            <input type="file" className="form-input" accept="audio/*,video/*,.mp3,.m4a,.wav,.mp4,.mov,.webm" disabled={busy}
              onChange={(e) => setFile(e.target.files?.[0] || null)} aria-label="Audio or video file" />
            <p className="form-help">Audio or video, up to {MAX_MINUTES} minutes. Video is converted to audio in your browser.</p>
          </>
        )}
        {mode === 'link' && (
          <>
            <input type="url" className="form-input" value={link} onChange={(e) => setLink(e.target.value)} disabled={busy}
              placeholder="https://… (mp3 / mp4, Google Drive or Dropbox)" aria-label="Link to audio or video" />
            <p className="form-help">Direct file links, or Google Drive / Dropbox links shared as "Anyone with the link". YouTube can't be converted: download it and upload the file.</p>
          </>
        )}
        {mode !== 'test' && (
          <div className="form-field" style={{ marginTop: 12 }}>
            <label className="form-label" htmlFor="dx-transcript">Transcript (optional)</label>
            <textarea id="dx-transcript" className="form-textarea" rows={5} value={transcript} onChange={(e) => setTranscript(e.target.value)} disabled={busy}
              placeholder="Paste the exact transcript, or leave empty and it's generated from the audio." />
          </div>
        )}
      </div>
      {busy ? (
        <div className="dx-progress" role="status">
          <span className="dx-spin" />
          <span>{step.label}{step.progress != null ? ` · ${Math.round(step.progress * 100)}%` : '…'}</span>
          {step.progress != null && <span className="hub-bar"><span style={{ width: `${Math.round(step.progress * 100)}%` }} /></span>}
        </div>
      ) : (
        <button type="button" className="btn btn-secondary" style={{ marginTop: 12 }} onClick={run}>
          <Icon name="headphones" size={16} /> Prepare audio
        </button>
      )}
      {error && <ErrorNote error={error} />}
    </div>
  );
}
