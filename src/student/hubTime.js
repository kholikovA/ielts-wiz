import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Counts the time a student actually spends on the hub and reports it to
// log_hub_time (supabase/migrations/20261110_hub_stats.sql).
// A second counts only when all of these hold:
//   - the tab is visible and the window has focus (not a background tab);
//   - the student did something in the last IDLE_MS, or audio/video is playing
//     (a listening test can run for minutes without any input).

const IDLE_MS = 3 * 60 * 1000;
const FLUSH_EVERY_S = 30;
const ACTIVITY = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'];

const mediaPlaying = () => Array.from(document.querySelectorAll('audio, video'))
  .some((m) => !m.paused && !m.ended && m.readyState > 2);

export function isCounting(now, lastInput, { visible, focused, playing }) {
  if (!visible || !focused) return false;
  return playing || now - lastInput < IDLE_MS;
}

export function useHubTime(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    let pending = 0;
    let lastInput = Date.now();
    let lastTick = Date.now();

    const flush = () => {
      if (pending < 1) return;
      const seconds = Math.round(pending);
      pending = 0;
      supabase.rpc('log_hub_time', { p_seconds: seconds }).then(({ error }) => {
        if (error) pending += seconds; // try again with the next flush
      }, () => { pending += seconds; });
    };

    const onInput = () => { lastInput = Date.now(); };
    const tick = () => {
      const now = Date.now();
      // Cap each step: a sleeping laptop must not credit the whole gap.
      const step = Math.min(2, (now - lastTick) / 1000);
      lastTick = now;
      const counting = isCounting(now, lastInput, {
        visible: document.visibilityState === 'visible',
        focused: document.hasFocus(),
        playing: mediaPlaying(),
      });
      if (counting) pending += step;
      if (pending >= FLUSH_EVERY_S) flush();
    };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };

    const id = setInterval(tick, 1000);
    ACTIVITY.forEach((e) => window.addEventListener(e, onInput, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      clearInterval(id);
      ACTIVITY.forEach((e) => window.removeEventListener(e, onInput, { capture: true }));
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', flush);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [enabled]);
}
