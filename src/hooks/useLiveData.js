import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Small status pill showing whether the realtime connection is live. Pair with
 * the `live` flag returned by useLiveData.
 */
export function LiveBadge({ live }) {
  return (
    <span
      title={live
        ? 'Live — updates automatically when students submit'
        : 'Reconnecting — still refreshes when you focus the tab'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: live ? 'var(--success)' : 'var(--text-tertiary)',
      }}
    >
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: live ? 'var(--success)' : 'var(--text-tertiary)',
        boxShadow: live ? '0 0 0 3px color-mix(in srgb, var(--success) 22%, transparent)' : 'none',
      }} />
      {live ? 'Live' : 'Reconnecting'}
    </span>
  );
}

/**
 * Loads data once on mount, then keeps it fresh "live":
 *   - subscribes to Postgres changes on `table` and triggers a *debounced full
 *     refetch* on any change (insert/update/delete);
 *   - also refetches when the tab regains visibility (covers anything missed if
 *     the realtime socket dropped while the tab was hidden).
 *
 * Why a debounced full refetch rather than merging the realtime payload into
 * state: the server stays the single source of truth (no fragile client-side
 * merge → no drift/duplicate bugs = stable), and debouncing coalesces bursts so
 * a flurry of submissions causes ONE refetch, not dozens (no render storms, no
 * speed hit). Initial load is unchanged, so first paint is just as fast.
 *
 * `load` may be redefined every render (we always invoke the latest via a ref),
 * so callers don't need to memoise it.
 *
 * @param {() => Promise<void>} load        Fetches data and sets component state.
 * @param {object}   opts
 * @param {string}   opts.table             Table to watch for changes.
 * @param {string}   [opts.channel='live']  Channel name prefix (unique per view).
 * @param {number}   [opts.debounceMs=1200] Coalesce window for bursts of changes.
 * @returns {{ loading: boolean, live: boolean, refresh: () => void }}
 */
export function useLiveData(load, { table, channel = 'live', debounceMs = 1200 } = {}) {
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  // Always call the freshest load() without re-subscribing.
  const loadRef = useRef(load);
  loadRef.current = load;
  const runRef = useRef(() => {});

  const refresh = useCallback(() => runRef.current(), []);

  useEffect(() => {
    let active = true;
    let timer = null;

    const run = async () => {
      try {
        await loadRef.current();
      } finally {
        if (active) setLoading(false);
      }
    };
    runRef.current = run;
    run(); // initial load

    const debouncedRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (active) loadRef.current(); }, debounceMs);
    };

    // Realtime subscription — guarded because the offline "stub" client (used
    // when env vars are missing) has no .channel().
    let ch = null;
    if (table && typeof supabase.channel === 'function') {
      ch = supabase
        .channel(`${channel}-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, debouncedRefetch)
        .subscribe((status) => { if (active) setLive(status === 'SUBSCRIBED'); });
    }

    const onVisible = () => {
      if (active && document.visibilityState === 'visible') loadRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      if (ch && typeof supabase.removeChannel === 'function') supabase.removeChannel(ch);
    };
  }, [table, channel, debounceMs]);

  return { loading, live, refresh };
}
