// Persist a finished attempt EXACTLY the way the standalone-HTML pages did, so
// the player is indistinguishable from them as far as stored history goes:
//   1. iw.v1.activity            — rolling activity log (heatmap, streak, badges)
//   2. iw.v1.lastSubmission.K.ID — answer snapshot for ?review=1 replay
//   3. user_test_results (cloud) — cross-device, per-user mirror
// The shapes here are matched byte-for-byte to the HTML; see grading parity test.

import { logActivity } from '../../lib/progressStore';
import { pushResult, fetchLastSubmission } from '../../lib/cloudSync';

export const lastSubmissionKey = (kind, id) => `iw.v1.lastSubmission.${kind}.${id}`;

// Cross-device fallback: the latest saved submission for this test from the cloud.
export const loadLastSubmissionCloud = (kind, id) => fetchLastSubmission(kind, id);

// Snapshot used to replay a submission in review mode.
export function saveLastSubmission(kind, id, { answers, correct, total, elapsedSec }) {
  try {
    localStorage.setItem(
      lastSubmissionKey(kind, id),
      // HTML wrote { answers, correctCount, total, ts } — keep those keys; add the
      // optional elapsedSec so the review's time feedback survives a replay.
      JSON.stringify({ answers, correctCount: correct, total, ts: new Date().toISOString(), elapsedSec: elapsedSec ?? null })
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
// REPLAYING guard). Returns nothing; cloud push is fire-and-forget.
export function recordAttempt({ kind, id, answers, correct, total, elapsedSec = null, replaying = false }) {
  if (replaying) return;
  // 1. activity log — logActivity stamps `d` (today) itself.
  logActivity({ t: kind, id: String(id), correct, total });
  // 2. review snapshot
  saveLastSubmission(kind, id, { answers, correct, total, elapsedSec });
  // 3. cloud mirror incl. answers, so review works cross-device (best-effort)
  pushResult({ kind, test_id: id, correct, total, answers, elapsedSec, completed_at: new Date().toISOString() });
}
