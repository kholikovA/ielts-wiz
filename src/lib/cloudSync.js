// =============================================================================
// cloudSync — bridges the versioned local progress store with the
// `user_test_results` Supabase table so progress survives device changes.
//
// Design rules:
//   * The CLOUD is the durable record of truth for finished attempts. New
//     results are written through the idempotent outbox (see syncQueue.js);
//     localStorage is a fast/offline render cache that we reconcile FROM the
//     cloud on every boot and sign-in.
//   * Every query is scoped to the signed-in user's own rows. RLS alone isn't
//     enough: admins can SELECT every user's results (for /admin analytics), so
//     an unscoped query would merge other people's attempts into an admin's
//     history.
//   * An attempt is identified by its `attempt_id`. Rows and activity entries
//     recorded before attempt ids existed fall back to a fingerprint
//     (day|kind|test|correct|total), matched one-for-one so two genuine
//     attempts with the same score on the same day both survive.
//   * We never delete local rows that are missing from the cloud (could be slow
//     propagation, or a different device's offline work).
//   * Sync passes are serialized: two overlapping backfills (boot + SIGNED_IN
//     fire together) would otherwise both insert the same local-only attempt.
// =============================================================================

import { supabase } from '../supabaseClient';
import { getActivity, STORAGE_KEYS, migrateLegacy, MAX_ACTIVITY } from './progressStore';
import { STORAGE_KEYS as GRAMMAR_KEYS } from './grammarProgressStore';
import { flush as flushOutbox, newAttemptId, pendingRows } from './syncQueue';

const COMPLETION_KEY_FOR_KIND = {
  listening:  STORAGE_KEYS.listening,
  reading_p1: STORAGE_KEYS.readingPassage1,
  reading_p2: STORAGE_KEYS.readingPassage2,
  reading_p3: STORAGE_KEYS.readingPassage3,
};

const SUBMISSION_PREFIX = 'iw.v1.lastSubmission.';
// A local answer snapshot belongs to a cloud row recorded within this window.
const SNAPSHOT_MATCH_MS = 10 * 60 * 1000;

const safeParse = (raw, fb) => { try { return raw ? JSON.parse(raw) : fb; } catch { return fb; } };
const timeOf = (iso) => { const t = Date.parse(iso || ''); return Number.isFinite(t) ? t : 0; };
const fingerprint = (d, kind, id, correct, total) => `${d}|${kind}|${id}|${correct}|${total}`;
const entryFp = (e) => fingerprint(e.d, e.t, String(e.id), e.correct, e.total);
const rowFp = (r) => fingerprint((r.completed_at || '').slice(0, 10), r.kind, String(r.test_id), r.correct, r.total);

// Tells mounted catalogue pages to re-read the local store after a sync.
export const PROGRESS_EVENT = 'iw:progress-changed';
const announce = () => {
  try { window.dispatchEvent(new Event(PROGRESS_EVENT)); } catch { /* non-browser */ }
};

let _chain = Promise.resolve();
const serial = (fn) => {
  const run = _chain.then(fn, fn);
  _chain = run.catch(() => {});
  return run;
};

const currentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

// Every result row of this user, oldest first, paged past PostgREST's row cap.
const fetchOwnRows = async (userId, columns) => {
  const PAGE = 1000;
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('user_test_results')
      .select(columns)
      .eq('user_id', userId)
      .order('completed_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE) return out;
  }
};

const readSnapshot = (kind, testId) => {
  const s = safeParse(localStorage.getItem(`${SUBMISSION_PREFIX}${kind}.${testId}`), null);
  return s && s.answers && typeof s.answers === 'object' ? s : null;
};
const writeSnapshot = (kind, testId, snap) => {
  try { localStorage.setItem(`${SUBMISSION_PREFIX}${kind}.${testId}`, JSON.stringify(snap)); } catch { /* full */ }
};

// Student feedback on a test, written to `test_reports`. Works signed-in or not
// (user_id defaults to auth.uid() server-side; null for anonymous reports).
export const submitTestReport = async ({ kind, test_id, message, context }) => {
  try {
    const msg = String(message || '').trim();
    if (!msg) return { ok: false, reason: 'empty' };
    const user = await currentUser();
    const row = {
      kind: kind || null,
      test_id: test_id != null ? String(test_id) : null,
      message: msg.slice(0, 4000),
      context: context || null,
    };
    if (user) row.user_id = user.id;
    const { error } = await supabase.from('test_reports').insert(row);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
};

// The newest saved submission for one test, from the cloud — the cross-device
// fallback when there's no local snapshot to replay. Returns
//   { answers, correct, total, ts }        newest attempt that has its answers
//   { answers: null, correct, total, ts }  attempted, but saved without answers
//   null                                   no attempt in the cloud (or offline)
export const fetchLastSubmission = async (kind, test_id) => {
  try {
    const user = await currentUser();
    if (!user) return null;
    const base = () => supabase
      .from('user_test_results')
      .select('answers, correct, total, completed_at')
      .eq('user_id', user.id)
      .eq('kind', kind)
      .eq('test_id', String(test_id));
    const withAnswers = await base().not('answers', 'is', null).order('completed_at', { ascending: false }).limit(1);
    const r = withAnswers.data && withAnswers.data[0];
    if (r && r.answers) return { answers: r.answers, correct: r.correct, total: r.total, ts: r.completed_at };
    const latest = await base().order('completed_at', { ascending: false }).limit(1);
    const l = latest.data && latest.data[0];
    return l ? { answers: null, correct: l.correct, total: l.total, ts: l.completed_at } : null;
  } catch {
    return null;
  }
};

// Push any local activity entries that aren't already in the cloud. Covers
// attempts made before the outbox existed, while a rule rejected them, or by a
// page that couldn't reach the server. Each pushed entry is given an
// attempt_id first (persisted locally), so a retry can never double-insert it.
const _flushToCloud = async () => {
  const user = await currentUser();
  if (!user) return 0;
  const cloud = await fetchOwnRows(user.id, 'kind, test_id, correct, total, completed_at, attempt_id');
  const cloudIds = new Set(cloud.map((r) => r.attempt_id).filter(Boolean));
  const queued = pendingRows();
  const pending = new Set(queued.map((r) => r.attempt_id));
  const activity = getActivity();
  const localIds = new Set(activity.map((e) => e && e.a).filter(Boolean));

  // Cloud rows (and still-queued rows) not claimed by a local attempt_id are
  // matched by fingerprint.
  const fpLeft = {};
  [...cloud, ...queued].forEach((r) => {
    if (r.attempt_id && localIds.has(r.attempt_id)) return;
    const k = rowFp(r);
    fpLeft[k] = (fpLeft[k] || 0) + 1;
  });

  // The latest local entry per test, for attaching its answer snapshot.
  const lastIdx = {};
  activity.forEach((e, i) => { if (e && e.t) lastIdx[`${e.t}|${e.id}`] = i; });

  let changed = false;
  const toPush = [];
  activity.forEach((e, i) => {
    if (!e || !e.t || e.id == null || !(e.total > 0)) return;
    if (e.a) {
      if (cloudIds.has(e.a) || pending.has(e.a)) return;
    } else {
      const k = entryFp(e);
      if (fpLeft[k] > 0) { fpLeft[k] -= 1; return; }
      e.a = newAttemptId();
      changed = true;
    }
    const row = {
      kind: e.t,
      test_id: String(e.id),
      correct: e.correct,
      total: e.total,
      completed_at: e.ts || (e.d ? new Date(`${e.d}T12:00:00Z`).toISOString() : new Date().toISOString()),
      attempt_id: e.a,
    };
    const snap = readSnapshot(e.t, e.id);
    if (snap && (snap.a ? snap.a === e.a : lastIdx[`${e.t}|${e.id}`] === i)) row.answers = snap.answers;
    toPush.push(row);
  });
  if (changed) localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(activity));

  let pushed = 0;
  for (const row of toPush) {
    // One at a time: a single rejected row must not sink the others.
    const { error } = await supabase.from('user_test_results').insert({ ...row, user_id: user.id });
    if (!error || error.code === '23505') pushed += 1;
  }
  return pushed;
};

// Attach local answer snapshots to this user's cloud rows that were saved
// without them, so those attempts can be reviewed on any device. Needs the
// "attach answers" UPDATE policy; without it this is a harmless no-op.
const backfillAnswers = async (rows) => {
  const byTest = {};
  rows.forEach((r) => { (byTest[`${r.kind}|${r.test_id}`] = byTest[`${r.kind}|${r.test_id}`] || []).push(r); });
  for (const list of Object.values(byTest)) {
    const { kind, test_id: testId } = list[0];
    const snap = readSnapshot(kind, testId);
    if (!snap) continue;
    let target = snap.a ? list.find((r) => r.attempt_id === snap.a) : null;
    if (!target && snap.ts) {
      let best = null;
      list.forEach((r) => {
        const gap = Math.abs(timeOf(r.completed_at) - timeOf(snap.ts));
        if (gap <= SNAPSHOT_MATCH_MS && (!best || gap < best.gap)) best = { r, gap };
      });
      target = best && best.r;
    }
    if (!target || target.answers) continue;
    const { error } = await supabase
      .from('user_test_results')
      .update({ answers: snap.answers })
      .eq('id', target.id)
      .is('answers', null);
    if (!error) target.answers = snap.answers;
  }
};

// Pull every server row for the current user, merge into local store.
// Idempotent — running multiple times is safe.
const _pullAndMerge = async () => {
  migrateLegacy();
  const user = await currentUser();
  if (!user) return { ok: false, reason: 'no-session', added: 0 };
  const data = await fetchOwnRows(user.id, 'id, kind, test_id, correct, total, completed_at, attempt_id, answers');

  let addedCompletions = 0;
  let addedActivity = 0;

  // Union completion lists per kind.
  const completionsByKind = {};
  data.forEach((row) => {
    if (!completionsByKind[row.kind]) completionsByKind[row.kind] = new Set();
    completionsByKind[row.kind].add(String(row.test_id));
  });
  Object.entries(completionsByKind).forEach(([kind, idSet]) => {
    const key = COMPLETION_KEY_FOR_KIND[kind];
    if (!key) return;
    const local = new Set(safeParse(localStorage.getItem(key), []).map(String));
    let changed = false;
    idSet.forEach((id) => {
      if (!local.has(id)) { local.add(id); changed = true; addedCompletions++; }
    });
    if (changed) localStorage.setItem(key, JSON.stringify([...local]));
  });

  // Reconstruct grammar mastery from cloud rows. We only push on pass, so
  // every cloud row with kind=grammar is a passing attempt. Conservative
  // merge: only add topics that aren't already present locally, so local
  // attempt counts and timestamps are not clobbered.
  const grammarRows = data.filter((r) => r.kind === 'grammar');
  if (grammarRows.length > 0) {
    const mastery = safeParse(localStorage.getItem(GRAMMAR_KEYS.mastery), {});
    let changed = false;
    grammarRows.forEach((row) => {
      if (!mastery[row.test_id]) {
        mastery[row.test_id] = {
          masteredAt: row.completed_at,
          score: (row.correct || 0) / (row.total || 1),
          attempts: 1,
        };
        changed = true;
      }
    });
    if (changed) localStorage.setItem(GRAMMAR_KEYS.mastery, JSON.stringify(mastery));
  }

  // Merge the activity log: by attempt_id where both sides have one, else
  // one-for-one by fingerprint.
  const merged = getActivity().filter(Boolean);
  const localIds = new Set(merged.map((e) => e.a).filter(Boolean));
  const fpPool = {};
  merged.forEach((e) => { if (!e.a) (fpPool[entryFp(e)] = fpPool[entryFp(e)] || []).push(e); });
  let activityChanged = false;
  data.forEach((row) => {
    if (row.attempt_id && localIds.has(row.attempt_id)) return;
    const pool = fpPool[rowFp(row)];
    if (pool && pool.length) {
      const e = pool.shift();
      if (row.attempt_id) { e.a = row.attempt_id; localIds.add(row.attempt_id); activityChanged = true; }
      if (!e.ts) { e.ts = row.completed_at; activityChanged = true; }
      return;
    }
    merged.push({
      d: row.completed_at.slice(0, 10), t: row.kind, id: String(row.test_id),
      correct: row.correct, total: row.total, ts: row.completed_at, a: row.attempt_id || undefined,
    });
    if (row.attempt_id) localIds.add(row.attempt_id);
    addedActivity++;
    activityChanged = true;
  });
  if (activityChanged) {
    // Chronological, so the last entry per test is its latest attempt.
    const order = (e) => `${e.d}|${e.ts || ''}`;
    const sorted = merged.map((e, i) => ({ e, i }))
      .sort((x, y) => (order(x.e) < order(y.e) ? -1 : order(x.e) > order(y.e) ? 1 : x.i - y.i))
      .map((x) => x.e);
    while (sorted.length > MAX_ACTIVITY) sorted.shift();
    localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(sorted));
  }

  // Review snapshots. First push local answers up to rows that lack them, then
  // bring down the newest cloud answers wherever this device's snapshot is
  // missing or older — so Review works for every attempted test on every device.
  try { await backfillAnswers(data); } catch { /* best-effort */ }
  let addedSnapshots = 0;
  const newestWithAnswers = {};
  data.forEach((r) => { if (r.answers && typeof r.answers === 'object') newestWithAnswers[`${r.kind}|${r.test_id}`] = r; });
  Object.values(newestWithAnswers).forEach((r) => {
    const local = readSnapshot(r.kind, r.test_id);
    if (local && local.ts && timeOf(local.ts) >= timeOf(r.completed_at) - SNAPSHOT_MATCH_MS) return;
    writeSnapshot(r.kind, r.test_id, {
      answers: r.answers, correctCount: r.correct, total: r.total, ts: r.completed_at, a: r.attempt_id || undefined,
    });
    addedSnapshots++;
  });

  const added = addedCompletions + addedActivity + addedSnapshots;
  if (added > 0 || activityChanged) announce();
  return { ok: true, added, addedCompletions, addedActivity, addedSnapshots };
};

const guard = (fn, fallback) => async () => {
  try { return await fn(); } catch (e) { return fallback(e); }
};

export const flushToCloud = () => serial(guard(_flushToCloud, () => 0));

export const pullAndMerge = () => serial(guard(_pullAndMerge,
  (e) => ({ ok: false, reason: String(e?.message || e), added: 0 })));

// Full two-way reconcile, run on boot, sign-in, and when the device comes back
// online. Order matters: push everything local UP first (the durable outbox of
// new attempts, then any legacy local-only activity), THEN pull the cloud DOWN
// so this device ends up holding the union of every device's history.
export const reconcile = () => serial(async () => {
  try { await flushOutbox(); } catch { /* kept in queue, retried next time */ }
  try { await _flushToCloud(); } catch { /* best-effort legacy backfill */ }
  try { return await _pullAndMerge(); } catch (e) { return { ok: false, reason: String(e?.message || e), added: 0 }; }
});
