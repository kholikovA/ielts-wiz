// Persist a finished attempt:
//   1. iw.v1.activity            — rolling activity log (heatmap, streak, badges)
//   2. iw.v1.lastSubmission.K.ID — answer snapshot for ?review=1 replay
//   3. user_test_results (cloud) — the DURABLE record of truth, written via the
//      idempotent outbox (syncQueue) so a failed/offline/signed-out push is
//      retried until the server confirms it, and never double-counts.
// (1) and (2) are a fast local cache; (3) is what survives device changes.

import { logActivity } from '../../lib/progressStore';
import { fetchLastSubmission } from '../../lib/cloudSync';
import { enqueue } from '../../lib/syncQueue';

export const lastSubmissionKey = (kind, id) => `iw.v1.lastSubmission.${kind}.${id}`;

// Cross-device fallback: the latest saved submission for this test from the cloud.
export const loadLastSubmissionCloud = (kind, id) => fetchLastSubmission(kind, id);

// Snapshot used to replay a submission in review mode.
export function saveLastSubmission(kind, id, { answers, correct, total }) {
  try {
    localStorage.setItem(
      lastSubmissionKey(kind, id),
      // HTML wrote { answers, correctCount, total, ts } — keep the same keys.
      JSON.stringify({ answers, correctCount: correct, total, ts: new Date().toISOString() })
    );
  } catch { /* storage full / unavailable — local snapshot is best-effort */ }
}

export function loadLastSubmission(kind, id) {
  try {
    const raw = localStorage.getItem(lastSubmissionKey(kind, id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Record a completed attempt. `replaying` is true when we're re-rendering a past
// submission in review mode — in that case we must NOT re-record (the HTML's
// REPLAYING guard). Returns the attempt_id of the queued cloud write (or null
// when replaying).
export function recordAttempt({ kind, id, answers, correct, total, durationSec = null, replaying = false }) {
  if (replaying) return null;
  // 1. activity log — logActivity stamps `d` (today) itself.
  logActivity({ t: kind, id: String(id), correct, total });
  // 2. review snapshot (local cache for instant review on this device)
  saveLastSubmission(kind, id, { answers, correct, total });
  // 3. durable cloud write via the outbox — idempotent, retried until confirmed,
  //    incl. the answer snapshot so review works cross-device.
  return enqueue({
    kind,
    test_id: id,
    correct,
    total,
    answers: answers && Object.keys(answers).length ? answers : undefined,
    duration_seconds: durationSec ?? undefined,
    completed_at: new Date().toISOString(),
  });
}
