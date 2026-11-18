// Telegram Login, as a same-tab redirect. Telegram allows one exact domain per
// bot (ielts-wiz.com), but the site runs on www. and student., so Telegram
// returns to ielts-wiz.com/telegram-login.html, which forwards the signed
// result to the page that started the login (#tgAuthResult=...). The
// telegram-auth edge function checks Telegram's signature with the bot token;
// the bot id comes from that function, so the bot is configured in one place.
import { supabase } from '../supabaseClient';

const TELEGRAM_ORIGIN = 'https://ielts-wiz.com';
let configPromise = null;

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

// Resolves with the bot id, or null when Telegram login isn't configured.
export const getTelegramBotId = () => {
  if (!configPromise) {
    configPromise = callTelegramAuth({ action: 'config' })
      .then(({ data }) => data?.bot_id || null)
      .catch(() => null)
      .then((id) => { if (!id) configPromise = null; return id; });
  }
  return configPromise;
};

// Leave for Telegram's login page; it comes back to this same page.
export const startTelegramAuth = (botId) => {
  const back = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const returnTo = `${TELEGRAM_ORIGIN}/telegram-login.html?to=${encodeURIComponent(back)}`;
  const params = new URLSearchParams({
    bot_id: String(botId), origin: TELEGRAM_ORIGIN, request_access: 'write', return_to: returnTo,
  });
  window.location.assign(`https://oauth.telegram.org/auth?${params}`);
};

// After returning: the signed payload, null if cancelled/unreadable, or
// undefined if this page load isn't a Telegram return. Clears the hash.
export const takeTelegramResult = () => {
  const m = /[#&]tgAuthResult=([^&]*)/.exec(window.location.hash || '');
  if (!m) return undefined;
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
  try {
    let b64 = decodeURIComponent(m[1]).replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return data && typeof data === 'object' && data.hash ? data : null;
  } catch {
    return null;
  }
};
