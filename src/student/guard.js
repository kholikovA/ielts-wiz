// Homework focus mode for work done inside the hub (writing, dictation, sentences, quiz):
//   - the student starts in full screen, and the work is hidden while they're out of it;
//   - leaving the page (switching tab or app, minimising, reloading, closing) is counted:
//     the first time is a warning, the second submits the homework as it is.
// Counts are kept in localStorage and in submissions.data.integrity (shown to the teacher).
// This is a deterrent, not proof: it runs in the student's browser.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useHub } from './ui';
import { alertDialog } from './dialog';

export const MAX_LEAVES = 2;

const fsEnabled = () => typeof document !== 'undefined' && Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fsElement = () => (typeof document !== 'undefined' ? document.fullscreenElement || document.webkitFullscreenElement : null);
function enterFullscreen() {
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  return fn ? Promise.resolve(fn.call(el, { navigationUI: 'hide' })) : Promise.resolve();
}
function exitFullscreen() {
  if (!fsElement()) return;
  const fn = document.exitFullscreen || document.webkitExitFullscreen;
  if (fn) Promise.resolve(fn.call(document)).catch(() => {});
}

const WARNING = {
  title: 'You left the homework',
  body: "This is your only warning. If you leave this page again (switch tab or app, minimise, reload or close it), your homework is submitted automatically as it is, and you can't change it.",
  confirmLabel: 'I understand',
};

export function GuardRules() {
  return (
    <ul className="hw-rules">
      <li><Icon name="layout" size={16} /><span>The homework opens in <strong>full screen</strong>. It's hidden whenever you leave full screen.</span></li>
      <li><Icon name="flag" size={16} /><span>Stay on this page. Switching tab or app, minimising, reloading or closing the page counts as <strong>leaving</strong>.</span></li>
      <li><Icon name="xCircle" size={16} /><span>The first time you leave, you get a warning. The second time, your homework is <strong>submitted automatically</strong> as it is and can't be changed.</span></li>
      <li><Icon name="eye" size={16} /><span>Your teacher sees how many times you left.</span></li>
    </ul>
  );
}

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}

/**
 * active: the student is doing (not reviewing) the homework.
 * onAutoSubmit(integrity): submits the current work; must include `integrity` if it writes `data`.
 */
export function useHomeworkGuard(a, { active, onAutoSubmit }) {
  const { user, preview } = useHub();
  const storeKey = `iw.v1.hub.guard.${a.id}`;
  const [integrity, setIntegrity] = useState(() => {
    const server = a.submission?.data?.integrity || null;
    // No submission at all (new, or the teacher allowed a retake): start clean.
    if (!a.submission) { try { localStorage.removeItem(storeKey); } catch { /* storage off */ } return { leaves: 0, events: [] }; }
    const local = readLocal(storeKey);
    return [server, local].filter(Boolean).sort((x, y) => (y.leaves || 0) - (x.leaves || 0))[0] || { leaves: 0, events: [] };
  });
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => Boolean(fsElement()));
  const on = Boolean(active) && !preview;
  const latest = useRef();
  latest.current = { integrity, onAutoSubmit };
  const autoRan = useRef(false);
  const warnOnReturn = useRef(false);
  const entered = useRef(false);

  const persist = useCallback((next) => {
    setIntegrity(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* storage off */ }
    return api.mergeSubmissionData(a.id, user.id, { integrity: next }).catch(() => {});
  }, [a.id, user.id, storeKey]);

  const autoSubmit = useCallback(async (next) => {
    if (autoRan.current) return;
    autoRan.current = true;
    try {
      await latest.current.onAutoSubmit(next);
    } catch {
      autoRan.current = false; // try again on the next visit
    }
  }, []);

  // Out of chances already (e.g. the page was closed on the second leave): submit now.
  useEffect(() => {
    if (on && (integrity.leaves || 0) >= MAX_LEAVES) autoSubmit(integrity);
  }, [on, integrity, autoSubmit]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(fsElement()));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // Done (submitted) or left the page: give the screen back.
  useEffect(() => {
    if (on) return undefined;
    if (entered.current) { entered.current = false; exitFullscreen(); }
    return undefined;
  }, [on]);
  useEffect(() => () => { if (entered.current) exitFullscreen(); }, []);

  useEffect(() => {
    if (!on || !started) return undefined;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const cur = latest.current.integrity;
        const at = new Date().toISOString();
        const next = { ...cur, leaves: (cur.leaves || 0) + 1, events: [...(cur.events || []), at].slice(-20) };
        if (next.leaves >= MAX_LEAVES) {
          next.auto_submitted = at;
          persist(next);
          autoSubmit(next).then(() => alertDialog({
            title: 'Your homework was submitted',
            body: 'You left the page a second time, so your homework was submitted automatically as it was.',
            confirmLabel: 'OK',
          }));
        } else {
          next.warned = true;
          persist(next);
          warnOnReturn.current = true;
        }
      } else if (warnOnReturn.current) {
        warnOnReturn.current = false;
        alertDialog(WARNING);
      }
    };
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [on, started, persist, autoSubmit]);

  const start = async () => {
    if (fsEnabled()) {
      try { await enterFullscreen(); entered.current = true; } catch { /* the block screen asks again */ }
    }
    setStarted(true);
    // Left once on an earlier visit (e.g. reloaded) without seeing the warning.
    if ((integrity.leaves || 0) === 1 && !integrity.warned) {
      persist({ ...integrity, warned: true });
      alertDialog(WARNING);
    }
  };
  const resume = async () => {
    try { await enterFullscreen(); entered.current = true; } catch { /* stays blocked */ }
  };

  return { on, preview, started, start, resume, integrity, needsFullscreen: fsEnabled() && !fullscreen };
}

/** Wraps the homework: a start screen, then the work in a focus layer. */
export function GuardFrame({ g, title, children }) {
  if (g.preview) {
    return (
      <>
        <div className="card hw-guard-note"><strong>Students see these rules first:</strong><GuardRules /></div>
        {children}
      </>
    );
  }
  if (!g.on) return children;
  const leaves = g.integrity.leaves || 0;
  if (!g.started) {
    return (
      <div className="card hw-gate">
        <h2 className="h3">Before you start</h2>
        <GuardRules />
        {leaves === 1 && <p className="hw-gate-warn"><Icon name="flag" size={14} /> You've already left this homework once. Leaving again submits it.</p>}
        <button type="button" className="btn btn-primary" onClick={g.start}>
          <Icon name="play" size={16} /> {fsEnabled() ? 'Start in full screen' : 'Start'}
        </button>
      </div>
    );
  }
  return (
    <div className="hw-focus" role="region" aria-label="Homework">
      <header className="hw-focus-bar">
        <strong>{title}</strong>
        <span className={leaves ? 'pill pill-amber' : 'pill'}>{leaves ? 'Warning used: next leave submits' : 'Stay on this page'}</span>
      </header>
      <div className="hw-focus-body">{children}</div>
      {g.needsFullscreen && (
        <div className="hw-focus-block">
          <div className="card">
            <h2 className="h3">Full screen is required</h2>
            <p className="body">Your homework is hidden until you go back to full screen.</p>
            <button type="button" className="btn btn-primary" onClick={g.resume}>Return to full screen</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Teacher: how often the student left the page. */
export function IntegrityNote({ sub }) {
  const i = sub?.data?.integrity;
  if (!i?.leaves) return null;
  return (
    <p className={`hw-integrity${i.auto_submitted ? ' is-auto' : ''}`}>
      <Icon name="flag" size={14} />
      Left the page {i.leaves} time{i.leaves === 1 ? '' : 's'}{i.auto_submitted ? ' · submitted automatically' : ''}
    </p>
  );
}
