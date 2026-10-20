// Persist a finished attempt:
//   1. iw.v1.activity            — rolling activity log (heatmap, streak, badges)
//   2. iw.v1.lastSubmission.K.ID — answer snapshot for ?review=1 replay
//   3. user_test_results (cloud) — the DURABLE record of truth, written via the
//      idempotent outbox (syncQueue) so a failed/offline/signed-out push is
//      retried until the server confirms it, and never double-counts.
// (1) and (2) are a fast local cache; (3) is what survives device changes.

import { logActivity } from '../../lib/progressStore';
import { fetchLastSubmission } from '../../lib/cloudSync';
import { enqueue, newAttemptId } from '../../lib/syncQueue';

export const lastSubmissionKey = (kind, id) => `iw.v1.lastSubmission.${kind}.${id}`;

// Cross-device fallback: the latest saved submission for this test from the cloud.
export const loadLastSubmissionCloud = (kind, id) => fetchLastSubmission(kind, id);

// Find the submission to replay in review mode: this device's snapshot first,
// else the cloud's newest. Calls back with one of
//   { status: 'ready', saved }            answers to replay
//   { status: 'missing', correct, total, ts }  attempted, saved without answers
//   { status: 'none' }                    never submitted on this account
// Returns a cancel function for effect cleanup.
export function loadReviewSubmission(kind, id, onResult) {
  const local = loadLastSubmission(kind, id);
  if (local) { onResult({ status: 'ready', saved: local }); return () => {}; }
  let cancelled = false;
  Promise.resolve(loadLastSubmissionCloud(kind, id)).then((remote) => {
    if (cancelled) return;
    if (remote && remote.answers && typeof remote.answers === 'object') {
      const saved = { answers: remote.answers, correctCount: remote.correct, total: remote.total, ts: remote.ts };
      try { localStorage.setItem(lastSubmissionKey(kind, id), JSON.stringify(saved)); } catch { /* cache only */ }
      onResult({ status: 'ready', saved });
    } else if (remote) {
      onResult({ status: 'missing', correct: remote.correct, total: remote.total, ts: remote.ts });
    } else {
      onResult({ status: 'none' });
    }
  }).catch(() => { if (!cancelled) onResult({ status: 'none' }); });
  return () => { cancelled = true; };
}

// Leave review mode for a fresh attempt at the same test.
export const retakeHref = () => window.location.pathname.replace(/\/review\/?$/, '');

// Snapshot used to replay a submission in review mode.
export function saveLastSubmission(kind, id, { answers, correct, total, ts, attemptId }) {
  try {
    localStorage.setItem(
      lastSubmissionKey(kind, id),
      // HTML wrote { answers, correctCount, total, ts } — keep the same keys.
      JSON.stringify({
        answers: answers || {}, correctCount: correct, total,
        ts: ts || new Date().toISOString(), a: attemptId || undefined,
      })
    );
  } catch { /* storage full / unavailable — the cloud row carries the answers too */ }
}

export function loadLastSubmission(kind, id) {
  try {
    const raw = localStorage.getItem(lastSubmissionKey(kind, id));
    const data = raw ? JSON.parse(raw) : null;
    return data && data.answers && typeof data.answers === 'object' ? data : null;
  } catch { return null; }
}

// Record a completed attempt. `replaying` is true when we're re-rendering a past
// submission in review mode — in that case we must NOT re-record. One
// attempt_id ties the activity entry, the local snapshot and the cloud row
// together, so sync can tell an attempt apart from a second one with the same
// score. Returns the attempt_id (or null when replaying).
export function recordAttempt({ kind, id, answers, correct, total, durationSec = null, replaying = false }) {
  if (replaying) return null;
  const attemptId = newAttemptId();
  const ts = new Date().toISOString();
  const snapshot = { ...(answers || {}) };
  // 1. activity log — logActivity stamps `d` (today) itself.
  logActivity({ t: kind, id: String(id), correct, total, ts, a: attemptId });
  // 2. review snapshot (local cache for instant review on this device)
  saveLastSubmission(kind, id, { answers: snapshot, correct, total, ts, attemptId });
  // 3. durable cloud write via the outbox — idempotent, retried until confirmed,
  //    incl. the answer snapshot (even when blank) so review works cross-device.
  return enqueue({
    kind,
    test_id: id,
    correct,
    total,
    answers: snapshot,
    duration_seconds: durationSec ?? undefined,
    completed_at: ts,
    attempt_id: attemptId,
  });
}
