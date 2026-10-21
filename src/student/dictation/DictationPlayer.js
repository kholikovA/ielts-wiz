import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '../../components/ui/icons';
import { chunkCues } from './cues';

// Sentence-by-sentence dictation player. There is no seek bar: students move
// only by sentence (previous / replay / next), hearing 1–3 sentences per play.
// The recording is fetched whole first, so seeks are exact and playback never
// stalls mid-sentence.
//
// Keys (work while typing): Esc play/pause · Alt+, previous · Alt+. next.

const LEAD_IN = 0.05; // start a hair early so the first syllable isn't clipped
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function readSaved(key) {
  if (!key) return null;
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}

export default function DictationPlayer({ src, cues, storageKey, defaultSize = 1 }) {
  const saved = useMemo(() => readSaved(storageKey), [storageKey]);
  const [size, setSize] = useState(() => [1, 2, 3].includes(saved?.size) ? saved.size : defaultSize);
  const chunks = useMemo(() => chunkCues(cues, size), [cues, size]);
  const [idx, setIdx] = useState(() => Math.min(Math.floor((saved?.sentence || 0) / size), Math.max(0, chunks.length - 1)));
  const [state, setState] = useState('loading'); // loading | ready | playing | buffering | error
  const [loadPct, setLoadPct] = useState(null);
  const [heard, setHeard] = useState(() => new Set(saved?.heard || []));
  const audioRef = useRef(null);
  const fillRef = useRef(null);
  const run = useRef(0); // bumps whenever playback is (re)started or stopped
  const active = useRef(null); // the chunk currently playing
  const pausedMid = useRef(false);

  const chunk = chunks[Math.min(idx, chunks.length - 1)];

  // Load the whole recording into memory.
  useEffect(() => {
    const a = audioRef.current;
    let live = true;
    let objectUrl = null;
    setState('loading');
    const ready = () => live && setState((s) => (s === 'loading' ? 'ready' : s));
    a.addEventListener('canplaythrough', ready);
    a.addEventListener('loadeddata', ready);
    const onError = () => live && setState('error');
    a.addEventListener('error', onError);
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok || !res.body) throw new Error('fetch');
        const total = Number(res.headers.get('content-length')) || 0;
        const reader = res.body.getReader();
        const parts = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read(); // eslint-disable-line no-await-in-loop
          if (done) break;
          parts.push(value);
          got += value.byteLength;
          if (live && total) setLoadPct(Math.round((got / total) * 100));
        }
        if (!live) return;
        objectUrl = URL.createObjectURL(new Blob(parts, { type: res.headers.get('content-type') || 'audio/mpeg' }));
        a.src = objectUrl;
      } catch {
        if (live) a.src = src; // stream it instead
      }
      a.load();
    })();
    return () => {
      live = false;
      run.current += 1;
      a.pause();
      a.removeEventListener('canplaythrough', ready);
      a.removeEventListener('loadeddata', ready);
      a.removeEventListener('error', onError);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  // Remember where the student is.
  useEffect(() => {
    if (!storageKey || !chunk) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ size, sentence: chunk.from, heard: [...heard] })); } catch { /* storage off */ }
  }, [storageKey, size, chunk, heard]);

  const setFill = (v) => {
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${Math.max(0, Math.min(1, v))})`;
  };

  const finish = useCallback((c) => {
    const a = audioRef.current;
    run.current += 1;
    active.current = null;
    pausedMid.current = false;
    a.pause();
    setFill(1);
    setState('ready');
    setHeard((h) => {
      const n = new Set(h);
      for (let i = c.from; i <= c.to; i += 1) n.add(i);
      return n;
    });
  }, []);

  // Stop exactly at the chunk's end: rAF while visible, timeupdate as a backstop.
  const check = useCallback(() => {
    const a = audioRef.current; const c = active.current;
    if (!c) return false;
    setFill((a.currentTime - c.s) / Math.max(0.1, c.e - c.s));
    if (a.currentTime >= c.e || a.ended) { finish(c); return false; }
    return true;
  }, [finish]);

  useEffect(() => {
    const a = audioRef.current;
    const onTime = () => check();
    const onWaiting = () => active.current && setState('buffering');
    const onPlaying = () => active.current && setState('playing');
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('playing', onPlaying);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('playing', onPlaying);
    };
  }, [check]);

  const seek = (a, t) => new Promise((resolve) => {
    if (Math.abs(a.currentTime - t) < 0.02) { resolve(); return; }
    let done = false;
    const end = () => { if (!done) { done = true; a.removeEventListener('seeked', end); resolve(); } };
    a.addEventListener('seeked', end);
    a.currentTime = t;
    setTimeout(end, 2000);
  });

  const play = useCallback(async (i, resume = false) => {
    const a = audioRef.current; const c = chunks[i];
    if (!a || !c || state === 'loading' || state === 'error') return;
    const my = ++run.current;
    active.current = null;
    setIdx(i);
    if (!resume) {
      a.pause();
      setFill(0);
      await seek(a, Math.max(0, c.s - LEAD_IN));
      if (my !== run.current) return;
    }
    pausedMid.current = false;
    active.current = c;
    setState('playing');
    try {
      await a.play();
    } catch {
      if (my === run.current) { active.current = null; setState('ready'); }
      return;
    }
    const loop = () => {
      if (my !== run.current) return;
      if (check()) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [chunks, state, check]);

  const pause = useCallback(() => {
    run.current += 1;
    active.current = null;
    pausedMid.current = true;
    audioRef.current.pause();
    setState('ready');
  }, []);

  const playing = state === 'playing' || state === 'buffering';
  const toggle = useCallback(() => {
    if (playing) { pause(); return; }
    const a = audioRef.current;
    const resume = pausedMid.current && chunk && a.currentTime > chunk.s && a.currentTime < chunk.e - 0.05;
    play(idx, resume);
  }, [playing, pause, play, idx, chunk]);
  const prev = useCallback(() => idx > 0 && play(idx - 1), [idx, play]);
  const next = useCallback(() => idx < chunks.length - 1 && play(idx + 1), [idx, chunks.length, play]);

  const changeSize = (n) => {
    if (n === size) return;
    const first = chunk ? chunk.from : 0;
    run.current += 1;
    active.current = null;
    pausedMid.current = false;
    audioRef.current.pause();
    setFill(0);
    setState((s) => (s === 'playing' || s === 'buffering' ? 'ready' : s));
    setSize(n);
    setIdx(Math.floor(first / n));
  };

  // Keyboard shortcuts, usable while the cursor is in the answer box.
  const keys = useRef({});
  keys.current = { toggle, prev, next };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !e.altKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); keys.current.toggle(); return; }
      if (e.altKey && !e.metaKey && !e.ctrlKey && (e.code === 'Comma' || e.code === 'Period')) {
        e.preventDefault();
        if (e.code === 'Comma') keys.current.prev(); else keys.current.next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const loading = state === 'loading';
  const total = cues.length;
  const where = chunk ? (chunk.from === chunk.to ? `Sentence ${chunk.from + 1}` : `Sentences ${chunk.from + 1}–${chunk.to + 1}`) : '';
  const alt = isMac ? '⌥' : 'Alt+';

  return (
    <div className="dx-player" aria-label="Dictation player">
      <audio ref={audioRef} preload="auto" onContextMenu={(e) => e.preventDefault()} />
      <div className="dx-main">
        <div className="dx-controls">
          <button type="button" className="dx-btn" onClick={prev} disabled={loading || idx === 0} aria-label="Previous sentence">
            <Icon name="skipBack" size={16} />
          </button>
          <button type="button" className={`dx-play${playing ? ' is-playing' : ''}`} onClick={toggle} disabled={loading || state === 'error'}
            aria-label={playing ? 'Pause' : 'Play'}>
            {loading || state === 'buffering'
              ? <span className="dx-spin" />
              : <Icon name={playing ? 'pause' : 'play'} size={18} />}
          </button>
          <button type="button" className="dx-btn" onClick={next} disabled={loading || idx >= chunks.length - 1} aria-label="Next sentence">
            <Icon name="skipForward" size={16} />
          </button>
        </div>
        <div className="dx-where">
          <strong>{loading ? 'Loading audio' : state === 'error' ? "Audio couldn't load" : where}</strong>
          <small>{loading ? (loadPct != null ? `${loadPct}%` : '…') : `of ${total} · ${heard.size} heard`}</small>
        </div>
        <div className="dx-size">
          <span>Sentences</span>
          <div className="hub-seg" role="radiogroup" aria-label="Sentences per play">
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={size === n} className={size === n ? 'is-selected' : ''} onClick={() => changeSize(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <div className={`dx-track${chunks.length > 60 ? ' is-dense' : ''}`} aria-hidden="true">
        {chunks.map((c, i) => {
          const done = (() => { for (let k = c.from; k <= c.to; k += 1) if (!heard.has(k)) return false; return true; })();
          return (
            <span key={`${size}-${c.from}`} className={`dx-seg${done ? ' is-heard' : ''}${i === idx ? ' is-current' : ''}`}>
              {i === idx && <span className="dx-seg-fill" ref={fillRef} />}
            </span>
          );
        })}
      </div>
      <div className="dx-keys">
        <span><kbd>Esc</kbd> play / pause</span>
        <span><kbd>{alt},</kbd> previous</span>
        <span><kbd>{alt}.</kbd> next</span>
      </div>
    </div>
  );
}
