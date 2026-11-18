// Telegram Login — the widget script opens Telegram's own popup
// (oauth.telegram.org) and hands back a signed payload; the telegram-auth edge
// function checks the signature with the bot token. The bot id comes from that
// function, so the bot is configured in one place (TELEGRAM_BOT_TOKEN).
import { supabase } from '../supabaseClient';

const WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22';
let widgetPromise = null;
let configPromise = null;

export const loadTelegramWidget = () => {
  if (window.Telegram?.Login?.auth) return Promise.resolve(window.Telegram.Login);
  if (widgetPromise) return widgetPromise;
  widgetPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = () => (window.Telegram?.Login?.auth
      ? resolve(window.Telegram.Login)
      : reject(new Error('Telegram login failed to load.')));
    script.onerror = () => {
      widgetPromise = null;
      script.remove();
      reject(new Error('Telegram login failed to load.'));
    };
    document.head.appendChild(script);
  });
  return widgetPromise;
};

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

// Preload both so the popup opens straight from the click (browsers block
// popups that open after an await).
export const prepareTelegram = async () => {
  const botId = await getTelegramBotId();
  if (!botId) return null;
  await loadTelegramWidget();
  return botId;
};

// Must be called synchronously inside a click handler. Resolves with the
// signed payload, or null if the person closed the popup.
export const requestTelegramAuth = (botId) => new Promise((resolve) => {
  window.Telegram.Login.auth({ bot_id: botId, request_access: 'write' }, (data) => resolve(data || null));
});
