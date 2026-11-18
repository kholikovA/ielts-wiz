// Connection state for homework attempts. The browser's online/offline events
// catch a dropped Wi-Fi/mobile link at once; a failed save (wifi up, no
// internet) is reported here too. While offline the attempt is paused (see
// GuardFrame) and the SAT timer stops; checkConnection() pings the API.
// During an attempt a heartbeat pings every few seconds, so a link that is up
// but carries nothing is caught quickly; the pause counts from the last answer
// the server gave (offlineSince), so no time is lost before it was noticed.
import { useEffect, useSyncExternalStore } from 'react';

const API = process.env.REACT_APP_SUPABASE_URL;
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const POLL_MS = 5000;
const HEARTBEAT_MS = 5000;
const PING_TIMEOUT_MS = 4000;

let online = typeof navigator === 'undefined' || navigator.onLine !== false;
const listeners = new Set();
let poll = null;
let lastOk = Date.now(); // last time the server answered
let since = null; // when the connection was last known good, once offline

function set(next) {
  if (next) lastOk = Date.now();
  if (next === online) return;
  online = next;
  since = online ? null : Math.min(lastOk, Date.now());
  if (!online && !poll && typeof window !== 'undefined') poll = setInterval(() => { checkConnection(); }, POLL_MS);
  if (online && poll) { clearInterval(poll); poll = null; }
  listeners.forEach((l) => l());
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
export const isOnline = () => online;
/** While offline: the last moment the server was known reachable (ms). */
export const offlineSince = () => (online ? null : since);
export const useOnline = () => useSyncExternalStore(subscribe, isOnline, () => true);

/** True for a request that never reached the server (no connection, DNS, timeout). */
export function isNetworkError(err) {
  if (!err) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const m = `${err.name || ''} ${err.message || err}`;
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet|aborterror/i.test(m);
}

/** Call from a failed request's catch: switches to offline when it was the connection. */
export function reportError(err) {
  if (isNetworkError(err)) set(false);
}

export const OFFLINE_MESSAGE = "You're offline. Your work is saved on this device. Try again once you're back online.";

/** Pings the API (any HTTP answer counts as online). Resolves to the new state. */
export async function checkConnection(timeoutMs = PING_TIMEOUT_MS) {
  if (typeof fetch === 'undefined') return online;
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctrl && setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const url = API ? `${API}/auth/v1/health?t=${Date.now()}` : `/robots.txt?t=${Date.now()}`;
    await fetch(url, { cache: 'no-store', headers: API && KEY ? { apikey: KEY } : undefined, signal: ctrl?.signal });
    set(true);
  } catch {
    set(false);
  } finally {
    if (t) clearTimeout(t);
  }
  return online;
}

/** Pings every few seconds while `active` and online (offline has its own poll). */
export function useHeartbeat(active) {
  const isUp = useOnline();
  useEffect(() => {
    if (!active || !isUp) return undefined;
    const t = setInterval(() => { checkConnection(); }, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [active, isUp]);
}

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => { lastOk = Date.now(); set(false); }); // the link dropped just now
  window.addEventListener('online', () => { checkConnection(); });
}

// Tests only.
export const __setOnline = set;
