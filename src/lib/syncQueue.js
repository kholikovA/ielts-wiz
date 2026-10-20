// =============================================================================
// syncQueue — a durable, idempotent outbox for test results.
//
// Why this exists: localStorage used to be the source of truth and the cloud a
// best-effort mirror, so a result could be lost forever (storage cleared, a new
// device, or a push that silently failed at submit time). This flips the model:
// every finished attempt is enqueued here and pushed to Supabase as the durable
// record of truth. A push that fails — offline, signed out, a transient 500 —
// STAYS in the queue and is retried on the next boot, sign-in, or `online`
// event, until the server confirms it.
//
// Idempotency: each queued row carries a client-generated `attempt_id` (UUID).
// The DB has a unique index on (user_id, attempt_id), so retrying a push that
// already landed is a no-op (the duplicate insert is caught and dropped from the
// queue) — a result can never be double-counted, no matter how many retries.
//
// "Force sign-in to save": `user_id` is NOT stored in the queued row. It is
// stamped from the live session at flush time, so a row only ever commits once
// the user is signed in. A signed-out submit is held safely until they do.
// =============================================================================

import { supabase } from '../supabaseClient';

const OUTBOX_KEY = 'iw.v1.outbox';

const readQueue = () => {
  try { const v = JSON.parse(localStorage.getItem(OUTBOX_KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
};
const writeQueue = (rows) => {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(rows)); } catch { /* storage full/disabled */ }
};

// Crypto-strong UUID where available; a v4-shaped fallback otherwise. The value
// only needs to be unique per (user, attempt), which either path satisfies.
export const newAttemptId = () => {
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); } catch { /* fall through */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// The columns user_test_results accepts from the client. Anything else on the
// enqueued object is dropped so a future field can't break the insert.
const ALLOWED = ['kind', 'test_id', 'correct', 'total', 'completed_at', 'answers', 'duration_seconds', 'type_stats', 'attempt_id'];
const pick = (row) => {
  const out = {};
  for (const k of ALLOWED) if (row[k] !== undefined && row[k] !== null) out[k] = row[k];
  return out;
};

// Add a finished attempt to the outbox and kick off a flush. Returns the
// attempt_id so callers can correlate if they ever need to. Never throws.
export const enqueue = (result) => {
  const row = pick({ ...result, attempt_id: result.attempt_id || newAttemptId() });
  row.test_id = String(row.test_id);
  row.completed_at = row.completed_at || new Date().toISOString();
  const q = readQueue();
  // De-dupe within the queue itself (e.g. a double-fired submit handler).
  if (!q.some((r) => r.attempt_id === row.attempt_id)) { q.push(row); writeQueue(q); }
  flush(); // fire-and-forget; safe to call concurrently (guarded below)
  return row.attempt_id;
};

export const pendingCount = () => readQueue().length;

// Flushes are serialized through a promise chain rather than dropped when one is
// already running. A flush requested mid-flight (e.g. enqueue's auto-flush still
// awaiting the session when sign-in triggers another) runs AFTER the current one
// instead of no-op'ing — so a just-signed-in flush never gets swallowed.
let _chain = Promise.resolve(0);

export const flush = () => {
  _chain = _chain.then(flushOnce, flushOnce); // run regardless of prior outcome
  return _chain;
};

// One drain of the outbox to Supabase. Each row is inserted independently so one
// bad row can't block the rest. A duplicate (already-saved) row is treated as a
// success. Every other failure keeps the row for the next flush: a rejection
// can be a server-side rule the app has outgrown (the kind CHECK once refused
// every full-test result), and dropping would lose the attempt for good.
// Resolves to the number of rows still pending afterwards. Never throws.
const flushOnce = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    // Force-sign-in-to-save: hold everything until there's a user to attribute
    // it to. Nothing is lost — it commits on the next sign-in.
    if (!session?.user) return readQueue().length;
    const userId = session.user.id;
    restoreHeld(userId);

    const q = readQueue();
    if (q.length === 0) return 0;

    const landed = new Set();
    for (const row of q) {
      const { error } = await supabase
        .from('user_test_results')
        .insert({ ...row, user_id: userId });
      if (!error || isDuplicate(error)) landed.add(row.attempt_id); // saved (now or earlier)
    }
    // Re-read before writing: a result enqueued while the inserts were in
    // flight must not be overwritten by this flush's stale snapshot.
    const remaining = readQueue().filter((r) => !landed.has(r.attempt_id));
    writeQueue(remaining);
    return remaining.length;
  } catch {
    return readQueue().length; // network/unknown — keep the queue intact
  }
};

// 23505 = unique_violation: the (user_id, attempt_id) row already exists.
const isDuplicate = (error) =>
  error?.code === '23505' || /duplicate key|already exists/i.test(error?.message || '');

// Sign-out wipes the iw.v1.* cache. Rows that couldn't be pushed first (offline)
// are parked under the signed-out user's id and rejoin the outbox the next time
// that same user flushes, so they're never lost or credited to someone else.
export const HELD_PREFIX = 'iw.v1.outbox.held.';

export const holdForUser = (userId) => {
  if (!userId) return;
  const q = readQueue();
  if (!q.length) return;
  try {
    const key = HELD_PREFIX + userId;
    const held = JSON.parse(localStorage.getItem(key) || '[]');
    const ids = new Set(held.map((r) => r.attempt_id));
    localStorage.setItem(key, JSON.stringify([...held, ...q.filter((r) => !ids.has(r.attempt_id))]));
  } catch { /* storage disabled */ }
};

const restoreHeld = (userId) => {
  try {
    const key = HELD_PREFIX + userId;
    const held = JSON.parse(localStorage.getItem(key) || 'null');
    if (!Array.isArray(held)) return;
    const q = readQueue();
    const ids = new Set(q.map((r) => r.attempt_id));
    writeQueue([...q, ...held.filter((r) => r && !ids.has(r.attempt_id))]);
    localStorage.removeItem(key);
  } catch { /* corrupt entry — leave it */ }
};

// Rows still waiting to reach the cloud (cloudSync uses these so its backfill
// never inserts a second copy of a queued attempt).
export const pendingRows = () => readQueue();
