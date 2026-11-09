import { supabase } from '../supabaseClient';

// Student Hub activity log → hub_events (supabase/migrations/20261110_hub_events.sql).
// Runs for students only: StudentApp turns it on through useHubTime, so
// teachers and student-view previews are never recorded. While off, every
// call here is a no-op, so shared code (api.js, test players) can call it freely.
//
// What it records (and nothing else):
//   session_start / session_end  a study session; a new one starts after 30 min away
//   page_time      active seconds per page (same rule as time on hub: visible,
//                  focused, in use)
//   hw_open / hw_start / hw_submit  homework funnel (from api.js)
//   question_time  active seconds and number of answer changes per test question
//                  (a change = a committed answer: select, radio, leaving a box, drop)
//   click          the label of buttons, links and tabs used. Never typed text.
//   error          script errors and failed requests

const SESSION_GAP_MS = 30 * 60 * 1000;
const FLUSH_MS = 30 * 1000;
const MAX_QUEUE = 500;

let enabled = false;
let queue = [];
let session = null; // { id, startedAt, active, pages:Set }
let lastActiveAt = 0;
let pageAcc = new Map(); // path -> seconds
let question = null; // { key, test, q }
let questionAcc = new Map(); // key -> { test, q, seconds, changes }
let flushTimer = null;
let token = null;
const once = new Set();

const uuid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }));
const path = () => window.location.pathname.slice(0, 200);
const clip = (s, n) => (s == null ? s : String(s).replace(/\s+/g, ' ').trim().slice(0, n));

export function deviceType(w = window.innerWidth, ua = navigator.userAgent) {
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua) || w < 640) return 'mobile';
  return 'desktop';
}

export function track(name, props = {}) {
  if (!enabled) return;
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push({ name, path: path(), props, at: new Date().toISOString(), session_id: session?.id || null });
}

// Fire an event only once per page load for this key (e.g. hw_start per assignment).
export function trackOnce(key, name, props) {
  if (!enabled || once.has(key)) return;
  once.add(key);
  track(name, props);
}

function startSession() {
  session = { id: uuid(), startedAt: Date.now(), active: 0, pages: new Set([path()]) };
  track('session_start', {
    device: deviceType(),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    lang: navigator.language || null,
    standalone: window.matchMedia?.('(display-mode: standalone)').matches || false,
    referrer: clip(document.referrer, 200) || null,
  });
}

function endSession() {
  if (!session) return;
  drainAccumulators();
  track('session_end', {
    active_seconds: Math.round(session.active),
    duration_seconds: Math.round((Date.now() - session.startedAt) / 1000),
    pages: session.pages.size,
  });
  session = null;
}

function drainAccumulators() {
  pageAcc.forEach((s, p) => {
    if (s >= 1) queue.push({ name: 'page_time', path: p, props: { seconds: Math.round(s), section: p.split('/')[1] || 'dashboard' }, at: new Date().toISOString(), session_id: session?.id || null });
  });
  pageAcc = new Map();
  questionAcc.forEach((v) => {
    if (v.seconds >= 1 || v.changes) queue.push({ name: 'question_time', path: v.test, props: { q: v.q, seconds: Math.round(v.seconds), changes: v.changes }, at: new Date().toISOString(), session_id: session?.id || null });
  });
  questionAcc = new Map();
}

// Called every second by useHubTime with whether the student is active.
export function tick(step, counting) {
  if (!enabled) return;
  const now = Date.now();
  if (!counting) {
    if (session && now - lastActiveAt > SESSION_GAP_MS) endSession();
    return;
  }
  if (!session || now - lastActiveAt > SESSION_GAP_MS) { endSession(); startSession(); }
  lastActiveAt = now;
  session.active += step;
  const p = path();
  session.pages.add(p);
  pageAcc.set(p, (pageAcc.get(p) || 0) + step);
  if (question && question.test === p) {
    const q = questionAcc.get(question.key) || { test: question.test, q: question.q, seconds: 0, changes: 0 };
    q.seconds += step;
    questionAcc.set(question.key, q);
  }
}

// ── Sending ─────────────────────────────────────────────────────────────────
const REST = process.env.REACT_APP_SUPABASE_URL;
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

async function refreshToken() {
  try { token = (await supabase.auth.getSession()).data.session?.access_token || null; } catch { token = null; }
}

// The page is going away: a keepalive fetch survives the unload, supabase-js may not.
export function keepaliveRpc(fn, args) {
  if (!token || !REST) return false;
  try {
    fetch(`${REST}/rest/v1/rpc/${fn}`, {
      method: 'POST', keepalive: true,
      headers: { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    }).catch(() => {});
    return true;
  } catch { return false; }
}

export async function flush({ leaving = false } = {}) {
  if (leaving) drainAccumulators();
  if (!queue.length) return;
  const batch = queue.splice(0, 200);
  if (leaving) { keepaliveRpc('log_hub_events', { p_events: batch }); return; }
  await refreshToken();
  let error = null;
  try { ({ error } = await supabase.rpc('log_hub_events', { p_events: batch })); } catch (e) { error = e; }
  if (error) queue = batch.concat(queue).slice(-MAX_QUEUE);
  else if (queue.length) flush();
}

// ── DOM listeners: clicks, test questions, errors ───────────────────────────
const CLICKABLE = 'button, a[href], [role="button"], [role="tab"], [role="radio"], [role="menuitem"], [role="switch"], summary, select';

export function clickLabel(el) {
  if (!el) return null;
  if (el.closest('[data-no-track]')) return null;
  if (el.tagName === 'SELECT') return clip(el.getAttribute('aria-label') || el.name || 'select', 60);
  return clip(el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent, 60) || null;
}

const isTest = (p) => /^\/(reading-test|listening-test)\//.test(p);

function onClick(e) {
  const el = e.target.closest?.(CLICKABLE);
  const label = clickLabel(el);
  if (!label) return;
  track('click', { label, tag: el.tagName.toLowerCase(), href: el.tagName === 'A' ? clip(el.getAttribute('href'), 120) : undefined });
}

function questionOf(target) {
  const p = path();
  if (!isTest(p)) return null;
  const host = target.closest?.('[data-qnum]');
  const q = host?.getAttribute('data-qnum');
  return q ? { key: `${p}#${q}`, test: p, q: clip(q, 10) } : null;
}

function onFocusQuestion(e) {
  const q = questionOf(e.target);
  if (q) question = q;
}

function onAnswerChange(e) {
  const q = questionOf(e.target);
  if (!q) return;
  question = q;
  const acc = questionAcc.get(q.key) || { test: q.test, q: q.q, seconds: 0, changes: 0 };
  acc.changes += 1;
  questionAcc.set(q.key, acc);
}

function onError(e) {
  track('error', { kind: 'script', message: clip(e.message, 300), source: clip(e.filename, 200), line: e.lineno || null });
}
function onRejection(e) {
  const r = e.reason;
  track('error', { kind: 'promise', message: clip(r?.message || r, 300), code: r?.code || null });
}

// Failed Supabase requests (called from api.js unwrap).
export function trackApiError(error) {
  track('error', { kind: 'api', message: clip(error?.message, 300), code: error?.code || null });
}

const onHide = () => { if (document.visibilityState === 'hidden') flush({ leaving: true }); };
const onPageHide = () => { endSession(); flush({ leaving: true }); };

export function start() {
  if (enabled) return;
  enabled = true;
  refreshToken();
  document.addEventListener('click', onClick, true);
  document.addEventListener('focusin', onFocusQuestion, true);
  document.addEventListener('pointerdown', onFocusQuestion, true);
  document.addEventListener('change', onAnswerChange, true);
  document.addEventListener('drop', onAnswerChange, true);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', onPageHide);
  flushTimer = setInterval(() => flush(), FLUSH_MS);
}

export function stop() {
  if (!enabled) return;
  endSession();
  flush();
  enabled = false;
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('focusin', onFocusQuestion, true);
  document.removeEventListener('pointerdown', onFocusQuestion, true);
  document.removeEventListener('change', onAnswerChange, true);
  document.removeEventListener('drop', onAnswerChange, true);
  window.removeEventListener('error', onError);
  window.removeEventListener('unhandledrejection', onRejection);
  document.removeEventListener('visibilitychange', onHide);
  window.removeEventListener('pagehide', onPageHide);
  clearInterval(flushTimer);
  queue = []; once.clear(); question = null; pageAcc = new Map(); questionAcc = new Map();
}
