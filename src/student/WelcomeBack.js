import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as api from './api';
import { useHub, useCountUp } from './ui';
import { celebration, localDay, stackSize, AWAY_MS } from './welcome';
import './welcome.css';

// Shown over the hub when a student comes back: streaks catch fire, then the
// coins paid since the last visit (the midnight payout, teacher awards…) drop
// into a stack. What "last visit" means is remembered per device.

const key = (uid) => `iw.v1.hub.seen.${uid}`;
const read = (uid) => { try { return JSON.parse(localStorage.getItem(key(uid))) || null; } catch { return null; } };
const write = (uid, value) => { try { localStorage.setItem(key(uid), JSON.stringify(value)); } catch { /* storage off */ } };
const touch = (uid) => { const seen = read(uid); if (seen) write(uid, { ...seen, at: new Date().toISOString() }); };

// /?welcome=demo plays the animation with sample numbers (nothing is saved).
const DEMO = {
  streaks: [{ kind: 'attendance', from: 3, to: 4 }, { kind: 'homework', from: 5, to: 6 }],
  coins: {
    total: 9,
    rows: [
      { id: 1, label: 'All homework done · Mon 16 Nov', amount: 2 },
      { id: 2, label: 'Homework streak: 5 in a row', amount: 5 },
      { id: 3, label: 'Came to class', amount: 2 },
    ],
  },
};
const isDemo = () => new URLSearchParams(window.location.search).get('welcome') === 'demo';

const STREAK = {
  attendance: { title: 'Attendance streak', unit: (n) => (n === 1 ? 'class in a row' : 'classes in a row') },
  homework: { title: 'Homework streak', unit: () => 'on time in a row' },
};

const EMBERS = [
  { x: -46, d: 0.0 }, { x: 30, d: 0.35 }, { x: -18, d: 0.7 }, { x: 52, d: 1.05 },
  { x: -34, d: 1.4 }, { x: 12, d: 1.75 }, { x: 40, d: 2.1 }, { x: -6, d: 2.45 },
];

function Flame({ streak, order }) {
  const delay = order * 350;
  const [lit, setLit] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLit(true), delay + 450); return () => clearTimeout(t); }, [delay]);
  const value = useCountUp(lit ? streak.to : streak.from, 700, streak.from);
  const meta = STREAK[streak.kind];
  const id = `wb-${streak.kind}`;
  return (
    <div className="wb-streak" style={{ '--wb-delay': `${delay}ms` }}>
      <div className="wb-fire">
        <span className="wb-glow" />
        {EMBERS.map((e, i) => <span key={i} className="wb-ember" style={{ '--x': `${e.x}px`, animationDelay: `${delay + 700 + e.d * 1000}ms` }} />)}
        <svg className="wb-flame" viewBox="0 0 120 150" width="150" height="188" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-o`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb020" /><stop offset="1" stopColor="#ff4d0d" /></linearGradient>
            <linearGradient id={`${id}-i`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff1a8" /><stop offset="1" stopColor="#ffc21a" /></linearGradient>
          </defs>
          <path className="wb-flame-outer" fill={`url(#${id}-o)`} d="M60 6C66 34 98 48 98 92a38 38 0 0 1-76 0c0-18 8-30 18-40 2 14 10 18 14 10 4-16-4-34 6-56Z" />
          <path className="wb-flame-inner" fill={`url(#${id}-i)`} d="M60 62c4 16 20 22 20 42a20 20 0 0 1-40 0c0-12 8-18 12-26 2 6 6 4 8-16Z" />
        </svg>
      </div>
      <strong className="wb-num">{value}</strong>
      <span className="wb-title">{meta.title}</span>
      <span className="wb-unit">{meta.unit(streak.to)}</span>
    </div>
  );
}

function Coins({ coins }) {
  const n = stackSize(coins.total);
  const total = useCountUp(coins.total, 350 + n * 110);
  const rows = coins.rows.slice(0, 4);
  return (
    <div className="wb-coins">
      <div className="wb-stack" style={{ height: 44 + n * 11 }} aria-hidden="true">
        <span className="wb-stack-glow" />
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="wb-coin" style={{ bottom: i * 11, '--shift': `${(i % 3 - 1) * 4}px`, animationDelay: `${200 + i * 110}ms` }} />
        ))}
      </div>
      <strong className="wb-num wb-num--coins">+{total}</strong>
      <span className="wb-title">{coins.total === 1 ? 'coin' : 'coins'} earned since your last visit</span>
      <ul className="wb-rows" style={{ animationDelay: `${500 + n * 110}ms` }}>
        {rows.map((r) => <li key={r.id}><span>{r.label}</span><b>+{r.amount}</b></li>)}
        {coins.rows.length > rows.length && <li className="wb-more"><span>and {coins.rows.length - rows.length} more</span></li>}
      </ul>
    </div>
  );
}

export default function WelcomeBack() {
  const { user, preview } = useHub();
  const uid = user.id;
  const [show, setShow] = useState(null);
  const [step, setStep] = useState(0);
  const busy = useRef(false);
  const button = useRef(null);

  useEffect(() => {
    if (isDemo()) { setStep(0); setShow(DEMO); return undefined; }
    if (preview) return undefined; // a teacher looking at a student's hub
    let live = true;

    const check = async () => {
      if (busy.current) return;
      const seen = read(uid);
      const now = new Date();
      if (seen && seen.day === localDay(now) && now - new Date(seen.at) < AWAY_MS) { touch(uid); return; }
      busy.current = true;
      try {
        const [summary, history] = await Promise.all([api.hubSummary(), api.coinHistory(uid, 60)]);
        if (!live) return;
        const found = celebration(seen, summary, history, now);
        write(uid, { at: new Date().toISOString(), day: localDay(now), att: summary.attendance_streak || 0, hw: summary.homework_streak || 0 });
        if (found) { setStep(0); setShow(found); }
      } catch { /* try again on the next visit */ } finally { busy.current = false; }
    };

    const beat = setInterval(() => { if (document.visibilityState === 'visible') touch(uid); }, 20000);
    const onVisibility = () => { if (document.visibilityState === 'visible') check(); else touch(uid); };
    const onHide = () => touch(uid);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    check();
    return () => {
      live = false;
      clearInterval(beat);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
    };
  }, [uid, preview]);

  const stages = show ? [show.streaks.length ? 'streaks' : null, show.coins ? 'coins' : null].filter(Boolean) : [];
  const last = step >= stages.length - 1;
  const close = useCallback(() => setShow(null), []);
  const advance = useCallback(() => { if (last) close(); else setStep((s) => s + 1); }, [last, close]);

  useEffect(() => {
    if (!show) return undefined;
    button.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, step, close]);

  if (!show) return null;
  const stage = stages[step];
  const grew = show.streaks.some((s) => s.to > s.from);
  return (
    <div className="wb" role="dialog" aria-modal="true" aria-label="Welcome back" onClick={advance}>
      <div className="wb-stage" key={stage}>
        {stage === 'streaks' ? (
          <>
            <h2 className="wb-head">{grew ? 'Your streak is growing' : 'Your streak is alive'}</h2>
            <div className="wb-streaks">
              {show.streaks.map((s, i) => <Flame key={s.kind} streak={s} order={i} />)}
            </div>
          </>
        ) : (
          <>
            <h2 className="wb-head">Welcome back</h2>
            <Coins coins={show.coins} />
          </>
        )}
      </div>
      <button ref={button} type="button" className="wb-continue" onClick={(e) => { e.stopPropagation(); advance(); }}>
        {last ? 'Continue' : 'Next'}
      </button>
      {stages.length > 1 && (
        <div className="wb-dots" aria-hidden="true">{stages.map((s, i) => <i key={s} className={i === step ? 'is-on' : ''} />)}</div>
      )}
    </div>
  );
}
