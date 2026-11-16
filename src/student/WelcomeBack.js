import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as api from './api';
import { useHub, useCountUp } from './ui';
import { withStatus } from './homework';
import Flame from './Flame';
import {
  celebration, localDay, stackSize, AWAY_MS, attendanceMarks, homeworkMarks, plainMarks, igniteIndex, markLabel,
} from './welcome';
import './welcome.css';

// Shown over the hub when a student comes back: each streak gets its own
// screen where the newest flame catches fire, then the coins paid since the
// last visit (the midnight payout, teacher awards…) drop into a stack.
// What "last visit" means is remembered per device.

const key = (uid) => `iw.v1.hub.seen.${uid}`;
const read = (uid) => { try { return JSON.parse(localStorage.getItem(key(uid))) || null; } catch { return null; } };
const write = (uid, value) => { try { localStorage.setItem(key(uid), JSON.stringify(value)); } catch { /* storage off */ } };
const touch = (uid) => { const seen = read(uid); if (seen) write(uid, { ...seen, at: new Date().toISOString() }); };

// /?welcome=demo plays the animation with sample numbers (nothing is saved).
const ago = (days) => new Date(Date.now() - days * 86400000);
const demoMarks = (list) => list.map(([days, status]) => ({ at: ago(days), status, lit: status !== 'absent' }));
const demo = () => ({
  streaks: [
    { kind: 'attendance', from: 3, to: 4, marks: demoMarks([[5, 'absent'], [4, 'present'], [3, 'present'], [2, 'present'], [0, 'present']]) },
    { kind: 'homework', from: 5, to: 6, marks: demoMarks([[4, 'present'], [3, 'present'], [2, 'present'], [1, 'present'], [0, 'present']]) },
  ],
  coins: {
    total: 9,
    rows: [
      { id: 1, label: 'All homework done · yesterday', amount: 2 },
      { id: 2, label: 'Homework streak: 5 in a row', amount: 5 },
      { id: 3, label: 'Came to class', amount: 2 },
    ],
  },
});
const isDemo = () => new URLSearchParams(window.location.search).get('welcome') === 'demo';

const STREAK = {
  attendance: { title: 'Attendance streak', unit: (n) => (n === 1 ? 'class in a row' : 'classes in a row') },
  homework: { title: 'Homework streak', unit: () => 'on time in a row' },
};

const EMBERS = [
  { x: -46, d: 0.0 }, { x: 30, d: 0.3 }, { x: -18, d: 0.6 }, { x: 52, d: 0.9 },
  { x: -34, d: 1.2 }, { x: 12, d: 1.5 }, { x: 40, d: 1.8 }, { x: -6, d: 2.1 },
];
const IGNITE_MS = 1100; // how long the newest flame stays an empty outline

// The recent run of a streak with its real history, or plain flames without it.
function usable(marks, streak) {
  return marks && igniteIndex(marks) >= 0 ? marks : plainMarks(streak);
}

// One streak: earlier flames are already burning, the newest one starts as an
// empty outline and catches fire, and the count ticks up with it.
function StreakStage({ streak }) {
  const marks = usable(streak.marks, streak.to);
  const hot = igniteIndex(marks);
  const [lit, setLit] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLit(true), IGNITE_MS + 250); return () => clearTimeout(t); }, []);
  const start = streak.to > streak.from ? streak.from : Math.max(0, streak.to - 1);
  const value = useCountUp(lit ? streak.to : start, 500, start);
  const meta = STREAK[streak.kind];
  return (
    <div className={`wb-streak wb-streak--${streak.kind}`} style={{ '--ignite': `${IGNITE_MS}ms` }}>
      <h2 className="wb-head">{meta.title}</h2>
      <strong className={`wb-num${lit ? ' is-bump' : ''}`}>{value}</strong>
      <span className="wb-unit">{meta.unit(streak.to)}</span>
      <div className="wb-week">
        {marks.map((m, i) => {
          const state = i === hot ? 'ignite' : m.lit ? 'lit' : 'empty';
          return (
            <div key={i} className={`wb-day is-${state}`}>
              {state === 'ignite' && <span className="wb-burst" />}
              {state === 'ignite' && EMBERS.map((e, n) => (
                <span key={n} className="wb-ember" style={{ '--x': `${e.x}px`, animationDelay: `${IGNITE_MS + 500 + e.d * 1000}ms` }} />
              ))}
              <Flame size={state === 'ignite' ? 96 : 72} tone={streak.kind} state={state} alive={state === 'lit'} phase={i} />
              <small>{markLabel(m.at)}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Coins({ coins }) {
  const n = stackSize(coins.total);
  const total = useCountUp(coins.total, 350 + n * 110);
  const rows = coins.rows.slice(0, 4);
  return (
    <div className="wb-coins">
      <div className="wb-stack" style={{ height: n * 16 }} aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="wb-coin" style={{ bottom: i * 16, '--shift': `${[0, 5, -4, 3, -6, 2][i % 6]}px`, animationDelay: `${200 + i * 110}ms` }} />
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
    if (isDemo()) { setStep(0); setShow(demo()); return undefined; }
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
        if (!found) return;
        if (found.streaks.length) {
          // The recent history behind each streak; without it the flames are shown plain.
          const [attendance, items, results] = await Promise.all([
            api.studentAttendance(uid).catch(() => null),
            api.studentHomework(uid).catch(() => null),
            api.testResults(uid).catch(() => []),
          ]);
          if (!live) return;
          const marks = {
            attendance: attendance && attendanceMarks(attendance),
            homework: items && homeworkMarks(withStatus(items, results), now),
          };
          found.streaks = found.streaks.map((s) => ({ ...s, marks: marks[s.kind] }));
        }
        setStep(0);
        setShow(found);
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

  const stages = show ? [...show.streaks.map((st) => ({ id: st.kind, streak: st })), ...(show.coins ? [{ id: 'coins' }] : [])] : [];
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
  return (
    <div className="wb" role="dialog" aria-modal="true" aria-label="Welcome back" onClick={advance}>
      <div className="wb-stage" key={stage.id}>
        {stage.streak ? <StreakStage streak={stage.streak} /> : (
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
        <div className="wb-dots" aria-hidden="true">{stages.map((s, i) => <i key={s.id} className={i === step ? 'is-on' : ''} />)}</div>
      )}
    </div>
  );
}
