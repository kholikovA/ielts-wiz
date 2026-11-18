// Telegram login through the IELTS Wiz bot. The site asks telegram-auth for a
// one-time code, the button opens t.me/<bot>?start=<code> in the Telegram app,
// the student taps Start → Confirm, and the telegram-bot webhook marks the
// request done. Meanwhile this page polls telegram-auth and finishes by itself:
// linking the account (Profile) or signing in (sign-in page).
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const POLL_MS = 2000;
// Codes live 15 minutes on the server; fetch a fresh one well before that.
const REFRESH_MS = 10 * 60 * 1000;

// Pull the error message out of a functions.invoke failure.
export const functionError = async (error, fallback) => {
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return { message: body.error, code: body.code };
  } catch { /* not JSON */ }
  return { message: error?.message || fallback, code: null };
};

export const callTelegramAuth = async (body) => {
  const { data, error } = await supabase.functions.invoke('telegram-auth', { body });
  if (error) return { data: null, error: await functionError(error, 'Something went wrong. Please try again.') };
  return { data, error: null };
};

const MESSAGES = {
  not_linked: "This Telegram isn't linked to IELTS Wiz yet. Continue with Google, then tap Link Telegram on your Profile page.",
  taken: 'This Telegram is already linked to another IELTS Wiz account.',
  expired: 'That Telegram link expired. Tap the button again.',
};

// kind: 'link' | 'signin'. onDone(data) runs once the student confirms in
// Telegram (for sign-in, data.token_hash). Returns what the button needs.
export function useTelegramLogin(kind, { enabled = true, onDone } = {}) {
  const [request, setRequest] = useState(null); // { code, url }
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const polling = useRef(false);

  const fetchCode = useCallback(async () => {
    const { data, error: err } = await callTelegramAuth({ action: 'start', kind });
    if (err || !data?.url) { setRequest(null); return; }
    setRequest({ code: data.code, url: data.url });
  }, [kind]);

  // Have a link ready before the click, so the button opens Telegram directly.
  useEffect(() => {
    if (!enabled || waiting) return undefined;
    fetchCode();
    const t = setInterval(fetchCode, REFRESH_MS);
    return () => clearInterval(t);
  }, [enabled, waiting, fetchCode]);

  const poll = useCallback(async () => {
    if (polling.current || !request) return;
    polling.current = true;
    try {
      const { data } = await callTelegramAuth({ action: 'poll', code: request.code });
      const status = data?.status;
      if (status === 'done') {
        setWaiting(false);
        await doneRef.current?.(data);
      } else if (MESSAGES[status]) {
        setWaiting(false);
        setError({ message: MESSAGES[status] });
        fetchCode();
      }
    } finally {
      polling.current = false;
    }
  }, [request, fetchCode]);

  useEffect(() => {
    if (!waiting) return undefined;
    const t = setInterval(poll, POLL_MS);
    // Coming back from the Telegram app: check straight away.
    const onBack = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onBack);
    window.addEventListener('focus', onBack);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onBack);
      window.removeEventListener('focus', onBack);
    };
  }, [waiting, poll]);

  // Click handler for the <a href={url} target="_blank"> button.
  const onOpen = useCallback(() => {
    setError(null);
    setWaiting(true);
  }, []);
  const cancel = useCallback(() => setWaiting(false), []);

  return { ready: Boolean(request), url: request?.url, waiting, error, onOpen, cancel };
}
