import { useEffect, useRef } from 'react';
import { startChat, stopChat, useChatState, unreadTotal, describe } from './store';

// Starts the chat store for the signed-in user (not in student view) and
// handles new-message alerts: a short sound, a desktop notification when the
// tab is in the background (if allowed), and the unread count in the tab title.

let audioCtx = null;
function blip() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') return; // no user gesture yet
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1320, t + 0.08);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.26);
  } catch { /* audio unavailable */ }
}
// Browsers only allow audio after a user gesture: unlock on the first one.
if (typeof window !== 'undefined') {
  const unlock = () => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume().catch(() => {});
    } catch { /* ignore */ }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const notificationPermission = () => (notificationsSupported() ? Notification.permission : 'denied');
export const askNotificationPermission = () => (notificationsSupported() ? Notification.requestPermission() : Promise.resolve('denied'));

const BASE_TITLE = 'Student Hub · IELTS Wiz';

export function useChatBootstrap({ uid, enabled, go }) {
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    if (!enabled || !uid) { stopChat(); return undefined; }
    startChat(uid, (chat, row, seen) => {
      if (chat.muted || seen) return;
      blip();
      if (document.visibilityState === 'visible' || notificationPermission() !== 'granted') return;
      try {
        const { title, body } = describe(chat, row);
        const n = new Notification(title, { body, tag: chat.id, icon: '/favicon.ico' });
        n.onclick = () => { window.focus(); goRef.current(`/messages/${chat.id}`); n.close(); };
      } catch { /* some mobile browsers only allow service-worker notifications */ }
    });
    return undefined;
  }, [uid, enabled]);

  useEffect(() => () => stopChat(), []);

  const s = useChatState();
  const total = enabled ? unreadTotal(s) : 0;
  useEffect(() => {
    document.title = total ? `(${total > 99 ? '99+' : total}) ${BASE_TITLE}` : BASE_TITLE;
  }, [total]);
  return total;
}
