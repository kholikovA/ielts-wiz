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

const COMPLETION_KEY_FOR_KIND = {
  listening:  STORAGE_KEYS.listening,
  reading_p1: STORAGE_KEYS.readingPassage1,
  reading_p2: STORAGE_KEYS.readingPassage2,
  reading_p3: STORAGE_KEYS.readingPassage3,
};

const safeParse = (raw, fb) => { try { return raw ? JSON.parse(raw) : fb; } catch { return fb; } };

// Push a single result up. Called by:
//   - the React app, after grammar mastery (we wrap recordMastery)
//   - the HTML test pages, via the same REST endpoint (no JS bridge needed)
// Failures are swallowed; the local copy is already saved.
export const pushResult = async ({ kind, test_id, correct, total, completed_at }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { ok: false, reason: 'no-session' };
    const { error } = await supabase.from('user_test_results').insert({
      user_id: session.user.id,
      kind,
      test_id: String(test_id),
      correct,
      total,
      completed_at: completed_at || new Date().toISOString(),
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
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
