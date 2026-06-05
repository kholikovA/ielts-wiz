// =============================================================================
// cloudSync — bridges the versioned local progress store with the
// `user_test_results` Supabase table so progress survives device changes.
//
// Design rules:
//   * localStorage stays the read-path of truth in the UI for speed and
//     offline support. Cloud is treated as a syncing peer, not a replacement.
//   * Network calls are best-effort. Failures never block the UI.
//   * Writes go cloud-side via Supabase's PostgREST (auth header from the
//     existing session). HTML test pages use the same REST contract.
//   * Reads pull all rows once on app mount and merge any cloud-only entries
//     into local. We never delete local rows that are missing from the cloud
//     (could be slow propagation, or a different device's offline work).
// =============================================================================

import { supabase } from '../supabaseClient';
import { getActivity, STORAGE_KEYS, migrateLegacy } from './progressStore';
import { STORAGE_KEYS as GRAMMAR_KEYS } from './grammarProgressStore';

const COMPLETION_KEY_FOR_KIND = {
  listening:  STORAGE_KEYS.listening,
  reading_p1: STORAGE_KEYS.readingPassage1,
  reading_p2: STORAGE_KEYS.readingPassage2,
  reading_p3: STORAGE_KEYS.readingPassage3,
};

const safeParse = (raw, fb) => { try { return raw ? JSON.parse(raw) : fb; } catch { return fb; } };

// Push a single result up. Called by:
//   - MasteryTest.js, after a passing grammar attempt
//   - the HTML test pages, via the same REST endpoint (no JS bridge needed)
// Failures are swallowed; the local copy is already saved.
export const pushResult = async ({ kind, test_id, correct, total, completed_at, answers }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { ok: false, reason: 'no-session' };
    const row = {
      user_id: session.user.id,
      kind,
      test_id: String(test_id),
      correct,
      total,
      completed_at: completed_at || new Date().toISOString(),
    };
    // Persist the answer snapshot (nullable `answers` jsonb column) so a review
    // can be replayed on any device, not just the one the test was taken on.
    if (answers && Object.keys(answers).length) row.answers = answers;
    const { error } = await supabase.from('user_test_results').insert(row);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
};

// Student feedback on a test, written to `test_reports`. Works signed-in or not
// (user_id defaults to auth.uid() server-side; null for anonymous reports).
export const submitTestReport = async ({ kind, test_id, message, context }) => {
  try {
    const msg = String(message || '').trim();
    if (!msg) return { ok: false, reason: 'empty' };
    const { data: { session } } = await supabase.auth.getSession();
    const row = {
      kind: kind || null,
      test_id: test_id != null ? String(test_id) : null,
      message: msg.slice(0, 4000),
      context: context || null,
    };
    if (session?.user) row.user_id = session.user.id;
    const { error } = await supabase.from('test_reports').insert(row);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
};

// Most-recent saved submission (with its answer snapshot) for one test, from the
// cloud — the cross-device fallback when there's no local snapshot to replay.
export const fetchLastSubmission = async (kind, test_id) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const { data, error } = await supabase
      .from('user_test_results')
      .select('answers, correct, total, completed_at')
      .eq('kind', kind)
      .eq('test_id', String(test_id))
      .not('answers', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1);
    if (error || !data || !data.length || !data[0].answers) return null;
    return { answers: data[0].answers, correct: data[0].correct, total: data[0].total, ts: data[0].completed_at };
  } catch {
    return null;
  }
};

// Push any local activity entries that aren't already in the cloud. Best-effort.
// Called before sign-out wipes local storage, so a local-only attempt (made
// before cloud sync worked for that kind, or while offline) can't be lost.
export const flushToCloud = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return 0;
    const { data: existing } = await supabase
      .from('user_test_results')
      .select('kind, test_id, correct, total, completed_at');
    const seen = new Set((existing || []).map(r =>
      `${(r.completed_at || '').slice(0, 10)}|${r.kind}|${r.test_id}|${r.correct}|${r.total}`));
    const rows = [];
    for (const e of getActivity()) {
      if (!e || !e.t || e.id == null || !(e.total > 0)) continue;
      const fp = `${e.d}|${e.t}|${e.id}|${e.correct}|${e.total}`;
      if (seen.has(fp)) continue;
      seen.add(fp);
      rows.push({
        user_id: session.user.id,
        kind: e.t,
        test_id: String(e.id),
        correct: e.correct,
        total: e.total,
        completed_at: e.d ? new Date(`${e.d}T12:00:00Z`).toISOString() : new Date().toISOString(),
      });
    }
    if (rows.length) await supabase.from('user_test_results').insert(rows);
    return rows.length;
  } catch {
    return 0;
  }
};

// Pull every server row for the current user, merge into local store.
// Idempotent — running multiple times is safe.
export const pullAndMerge = async () => {
  try {
    migrateLegacy();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { ok: false, reason: 'no-session', added: 0 };
    const { data, error } = await supabase
      .from('user_test_results')
      .select('kind, test_id, correct, total, completed_at')
      .order('completed_at', { ascending: true });
    if (error) return { ok: false, reason: error.message, added: 0 };

    let addedCompletions = 0;
    let addedActivity = 0;

    // Group server rows by kind so we can union into each completion list.
    const completionsByKind = {};
    data.forEach(row => {
      if (!completionsByKind[row.kind]) completionsByKind[row.kind] = new Set();
      completionsByKind[row.kind].add(String(row.test_id));
    });
    Object.entries(completionsByKind).forEach(([kind, idSet]) => {
      const key = COMPLETION_KEY_FOR_KIND[kind];
      if (!key) return;
      const local = new Set(safeParse(localStorage.getItem(key), []).map(String));
      let changed = false;
      idSet.forEach(id => {
        if (!local.has(id)) { local.add(id); changed = true; addedCompletions++; }
      });
      if (changed) localStorage.setItem(key, JSON.stringify([...local]));
    });

    // Reconstruct grammar mastery from cloud rows. We only push on pass, so
    // every cloud row with kind=grammar is a passing attempt. Conservative
    // merge: only add topics that aren't already present locally, so local
    // attempt counts and timestamps are not clobbered.
    const grammarRows = data.filter(r => r.kind === 'grammar');
    if (grammarRows.length > 0) {
      const mastery = safeParse(localStorage.getItem(GRAMMAR_KEYS.mastery), {});
      let changed = false;
      grammarRows.forEach(row => {
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

    // Merge activity log. Dedup by (date, kind, test_id, completed_at minute).
    const localActivity = getActivity();
    const seen = new Set(localActivity.map(e => `${e.d}|${e.t}|${e.id}|${e.correct}|${e.total}`));
    const merged = [...localActivity];
    data.forEach(row => {
      const d = row.completed_at.slice(0, 10);
      const fp = `${d}|${row.kind}|${row.test_id}|${row.correct}|${row.total}`;
      if (!seen.has(fp)) {
        merged.push({ d, t: row.kind, id: String(row.test_id), correct: row.correct, total: row.total });
        seen.add(fp);
        addedActivity++;
      }
    });
    if (addedActivity > 0) {
      merged.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
      while (merged.length > 400) merged.shift();
      localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(merged));
    }

    return { ok: true, added: addedCompletions + addedActivity, addedCompletions, addedActivity };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e), added: 0 };
  }
};
