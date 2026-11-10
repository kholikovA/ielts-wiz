import { useSyncExternalStore } from 'react';
import * as api from './chatApi';
import { chatTitle, previewText } from './format';

// One chat store for the whole hub: chat list, loaded message windows,
// members, typing. Started by useChatBootstrap (StudentApp) so the unread
// badge stays live on every page; the Messages page reads the same state.
//
// threads[chatId] = { items (oldest first), hasOlder, hasNewer, loading }
// refs[messageId] = messages loaded outside a window (reply targets, pins)

const PAGE = 50;
const initial = () => ({
  me: null, chats: null, error: null, threads: {}, refs: {}, members: {}, typing: {}, activeId: null, live: false,
});
let state = initial();
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (fn) => { state = { ...state, ...fn(state) }; emit(); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

export const getChatState = () => state;
export const useChatState = () => useSyncExternalStore(subscribe, getChatState);

export const unreadTotal = (s) => (s.chats || []).reduce((n, c) => n + (c.muted ? 0 : Number(c.unread) || 0), 0);
export const chatById = (s, id) => (s.chats || []).find((c) => c.id === id) || null;

const patchChat = (id, patch) => set((s) => ({
  chats: s.chats && s.chats.map((c) => (c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c)),
}));

const byTime = (a, b) => new Date(a.created_at) - new Date(b.created_at) || (a.id < b.id ? -1 : 1);
function mergeRows(items, rows) {
  const map = new Map(items.map((m) => [m.id, m]));
  rows.forEach((r) => map.set(r.id, { ...map.get(r.id), ...r }));
  return [...map.values()].sort(byTime);
}
const setThread = (chatId, fn) => set((s) => {
  const prev = s.threads[chatId] || { items: [], hasOlder: true, hasNewer: false, loading: false };
  return { threads: { ...s.threads, [chatId]: { ...prev, ...fn(prev) } } };
});

// ── Chat list ────────────────────────────────────────────────────────────────
let reloadTimer = null;
export async function reloadChats() {
  clearTimeout(reloadTimer);
  try {
    const chats = await api.listChats();
    set(() => ({ chats: chats || [], error: null }));
  } catch (error) {
    set((s) => ({ error: s.chats ? null : error }));
  }
}
const reloadSoon = () => { clearTimeout(reloadTimer); reloadTimer = setTimeout(reloadChats, 400); };

// ── Messages ─────────────────────────────────────────────────────────────────
export async function loadLatest(chatId) {
  setThread(chatId, () => ({ loading: true }));
  try {
    const rows = await api.messages(chatId, { limit: PAGE });
    setThread(chatId, () => ({ items: rows, hasOlder: rows.length === PAGE, hasNewer: false, loading: false }));
    fetchRefs(rows);
  } catch (e) {
    setThread(chatId, () => ({ loading: false, error: e }));
  }
}

const inflight = new Set();
async function once(key, fn) {
  if (inflight.has(key)) return;
  inflight.add(key);
  try { await fn(); } finally { inflight.delete(key); }
}

export const loadOlder = (chatId) => once(`older:${chatId}`, async () => {
  const t = state.threads[chatId];
  if (!t?.hasOlder || !t.items.length) return;
  const rows = await api.messages(chatId, { before: t.items[0].created_at, limit: PAGE });
  setThread(chatId, (p) => ({ items: mergeRows(p.items, rows), hasOlder: rows.length === PAGE }));
  fetchRefs(rows);
});

export const loadNewer = (chatId) => once(`newer:${chatId}`, async () => {
  const t = state.threads[chatId];
  if (!t?.hasNewer || !t.items.length) return;
  const rows = await api.messages(chatId, { after: t.items[t.items.length - 1].created_at, limit: PAGE });
  setThread(chatId, (p) => ({ items: mergeRows(p.items, rows), hasNewer: rows.length === PAGE }));
  fetchRefs(rows);
});

// Show a window of messages around `msg` (search result, reply, pin).
export async function loadAround(chatId, msg) {
  const half = 25;
  const [older, newer] = await Promise.all([
    api.messages(chatId, { before: msg.created_at, limit: half }),
    api.messages(chatId, { after: msg.created_at, limit: half }),
  ]);
  setThread(chatId, () => ({
    items: mergeRows([], [...older, msg, ...newer]), hasOlder: older.length === half, hasNewer: newer.length === half, loading: false,
  }));
  fetchRefs([...older, ...newer]);
}

// Reply targets + pinned messages that aren't in the loaded window.
export async function fetchRefs(rows, extraIds = []) {
  const known = new Set(Object.keys(state.refs));
  Object.values(state.threads).forEach((t) => t.items.forEach((m) => known.add(m.id)));
  const ids = [...new Set([...rows.map((r) => r.reply_to), ...extraIds].filter((id) => id && !known.has(id)))];
  if (!ids.length) return;
  try {
    const found = await api.messagesByIds(ids);
    set((s) => ({ refs: { ...s.refs, ...Object.fromEntries(found.map((m) => [m.id, m])) } }));
  } catch { /* reply preview just stays blank */ }
}

export const findMessage = (s, id) => {
  if (!id) return null;
  if (s.refs[id]) return s.refs[id];
  for (const t of Object.values(s.threads)) {
    const m = t.items.find((x) => x.id === id);
    if (m) return m;
  }
  return null;
};

export async function loadMembers(chatId) {
  try {
    const list = await api.chatMembers(chatId);
    set((s) => ({ members: { ...s.members, [chatId]: list || [] } }));
  } catch { /* panel shows what it has */ }
}

// Optimistic local insert for my own sends; realtime confirms with the same id.
export function addLocal(row) {
  const t = state.threads[row.chat_id];
  if (t && !t.hasNewer) setThread(row.chat_id, (p) => ({ items: mergeRows(p.items, [row]) }));
  patchChat(row.chat_id, (c) => ({
    last: lastFrom(row, c), last_message_at: row.created_at, last_read_at: row.created_at,
  }));
}

// Swap the optimistic row for the saved one (or drop it when `row` is null).
export function replaceLocal(chatId, tmpId, row) {
  setThread(chatId, (p) => ({ items: mergeRows(p.items.filter((m) => m.id !== tmpId), row ? [row] : []) }));
  if (row) {
    rememberSent(row.id);
    patchChat(chatId, (c) => ({ last: lastFrom(row, c), last_message_at: row.created_at, last_read_at: row.created_at, unread: 0 }));
  } else reloadSoon();
}

export function updateLocal(row) {
  setThread(row.chat_id, (p) => ({ items: p.items.map((m) => (m.id === row.id ? { ...m, ...row } : m)) }));
  if (state.refs[row.id]) set((s) => ({ refs: { ...s.refs, [row.id]: { ...s.refs[row.id], ...row } } }));
}

function senderName(chat, senderId) {
  if (!chat) return null;
  if (chat.kind === 'direct' && chat.peer?.id === senderId) return chat.peer.name;
  return (state.members[chat.id] || []).find((m) => m.id === senderId)?.name || null;
}
const lastFrom = (row, chat) => ({
  id: row.id, sender_id: row.sender_id, sender_name: senderName(chat, row.sender_id),
  body: row.body ? row.body.slice(0, 200) : null, kind: row.attachment?.kind || null, file: row.attachment?.name || null,
  created_at: row.created_at,
});

// ── Read state ───────────────────────────────────────────────────────────────
let viewing = { chatId: null, atBottom: true };
export function setViewing(chatId, atBottom) {
  viewing = { chatId, atBottom };
  if (state.activeId !== chatId) set(() => ({ activeId: chatId }));
  if (chatId && atBottom && document.visibilityState === 'visible') markRead(chatId);
}

export function markRead(chatId) {
  const c = chatById(state, chatId);
  if (!c) return;
  const pending = Number(c.unread) > 0
    || (c.last && c.last.sender_id !== state.me && new Date(c.last.created_at) > new Date(c.last_read_at));
  if (!pending) return;
  patchChat(chatId, { unread: 0, last_read_at: new Date().toISOString() });
  api.markRead(chatId).catch(() => {});
}

// ── Realtime handlers ────────────────────────────────────────────────────────
let notifier = null; // (chat, row) => void, set by the bootstrap hook
let selfEcho = new Set(); // ids I sent, so their INSERT doesn't notify

export const rememberSent = (id) => { selfEcho.add(id); if (selfEcho.size > 200) selfEcho = new Set([...selfEcho].slice(-100)); };

function onMessage(row, type) {
  const chat = chatById(state, row.chat_id);
  const t = state.threads[row.chat_id];
  if (t && (!t.hasNewer || t.items.some((m) => m.id === row.id))) {
    setThread(row.chat_id, (p) => ({ items: mergeRows(p.items, [row]) }));
    if (row.reply_to) fetchRefs([row]);
  }
  if (state.refs[row.id]) set((s) => ({ refs: { ...s.refs, [row.id]: row } }));
  if (!chat) { reloadSoon(); return; }

  if (type === 'INSERT') {
    const mine = row.sender_id === state.me;
    const seen = viewing.chatId === row.chat_id && viewing.atBottom && document.visibilityState === 'visible';
    patchChat(row.chat_id, (c) => ({
      last: lastFrom(row, c),
      last_message_at: row.created_at,
      unread: mine || seen ? (mine ? 0 : c.unread) : (Number(c.unread) || 0) + 1,
      ...(mine ? { last_read_at: row.created_at } : {}),
    }));
    if (!mine && seen) markRead(row.chat_id);
    if (!mine && !selfEcho.has(row.id) && notifier) notifier(chat, row, seen);
    if (!senderName(chat, row.sender_id) && chat.kind === 'group') reloadSoon();
  } else if (chat.last?.id === row.id) {
    if (row.deleted_at) reloadSoon();
    else patchChat(row.chat_id, (c) => ({ last: { ...c.last, body: row.body ? row.body.slice(0, 200) : null } }));
  } else if (row.deleted_at) {
    reloadSoon(); // an unread message may have gone
  }
}

function onMember(row, type) {
  if (type === 'INSERT' && row.user_id === state.me) { reloadSoon(); return; }
  const cached = state.members[row.chat_id];
  if (cached) {
    const has = cached.some((m) => m.id === row.user_id);
    if (has) set((s) => ({ members: { ...s.members, [row.chat_id]: cached.map((m) => (m.id === row.user_id ? { ...m, ...pick(row) } : m)) } }));
    else loadMembers(row.chat_id);
  }
  if (row.user_id === state.me) {
    const c = chatById(state, row.chat_id);
    // Read in another tab or device: recount.
    if (c && new Date(row.last_read_at) > new Date(c.last_read_at) && Number(c.unread) > 0) reloadSoon();
    patchChat(row.chat_id, { role: row.role, can_post: row.can_post, pinned: row.pinned, muted: row.muted, last_read_at: row.last_read_at });
  } else {
    patchChat(row.chat_id, (c) => (c.kind === 'direct' && c.peer?.id === row.user_id
      ? { peer: { ...c.peer, last_read_at: row.last_read_at } } : {}));
    if (type === 'INSERT') patchChat(row.chat_id, (c) => ({ member_count: (Number(c.member_count) || 0) + 1 }));
  }
}
const pick = (row) => ({ role: row.role, can_post: row.can_post, last_read_at: row.last_read_at });

function onChat(row) {
  const c = chatById(state, row.id);
  if (!c) return;
  if (row.archived !== c.archived) reloadSoon();
  patchChat(row.id, {
    title: row.title, description: row.description, only_owner_posts: row.only_owner_posts,
    pinned_message_id: row.pinned_message_id, archived: row.archived, owner_id: row.owner_id,
  });
  if (row.pinned_message_id) fetchRefs([], [row.pinned_message_id]);
}

// ── Typing ───────────────────────────────────────────────────────────────────
let typing = null; // { chatId, channel, lastSent }
const typingTimers = {};
export function joinTyping(chatId) {
  if (typing?.chatId === chatId) return;
  typing?.channel.close();
  typing = null;
  if (!chatId) return;
  typing = {
    chatId,
    lastSent: 0,
    channel: api.typingChannel(chatId, ({ user_id: userId, name, stop }) => {
      if (!userId || userId === state.me) return;
      const key = `${chatId}:${userId}`;
      clearTimeout(typingTimers[key]);
      const drop = () => set((s) => {
        const next = { ...(s.typing[chatId] || {}) };
        delete next[userId];
        return { typing: { ...s.typing, [chatId]: next } };
      });
      if (stop) { drop(); return; }
      set((s) => ({ typing: { ...s.typing, [chatId]: { ...(s.typing[chatId] || {}), [userId]: name || 'Someone' } } }));
      typingTimers[key] = setTimeout(drop, 5000);
    }),
  };
}
export function sendTyping(name, stop = false) {
  if (!typing) return;
  const now = Date.now();
  if (!stop && now - typing.lastSent < 2500) return;
  typing.lastSent = stop ? 0 : now;
  typing.channel.send({ user_id: state.me, name, stop });
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
let running = null;
export function startChat(me, notify) {
  notifier = notify;
  if (running?.me === me) return;
  stopChat();
  state = { ...initial(), me };
  emit();
  reloadChats();
  const pingIfVisible = () => { if (document.visibilityState === 'visible') api.ping().catch(() => {}); };
  pingIfVisible();
  const unsub = api.subscribeRows({
    message: onMessage,
    member: onMember,
    chat: onChat,
    status: (st) => {
      const live = st === 'SUBSCRIBED';
      if (live && !state.live) reloadChats(); // catch up after a reconnect
      set(() => ({ live }));
    },
  });
  // Fallback while realtime is down: poll the open chat and the list.
  const poll = setInterval(() => {
    pingIfVisible();
    reloadChats();
    if (!state.live && viewing.chatId) loadNewerOrLatest(viewing.chatId);
  }, 60000);
  const fast = setInterval(() => {
    if (!state.live && viewing.chatId && document.visibilityState === 'visible') loadNewerOrLatest(viewing.chatId);
  }, 8000);
  const onVis = () => {
    if (document.visibilityState !== 'visible') return;
    pingIfVisible();
    reloadChats();
    if (viewing.chatId && viewing.atBottom) markRead(viewing.chatId);
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('focus', onVis);
  running = {
    me,
    stop: () => {
      unsub();
      clearInterval(poll);
      clearInterval(fast);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    },
  };
}

async function loadNewerOrLatest(chatId) {
  const t = state.threads[chatId];
  if (!t?.items.length) return;
  try {
    const rows = await api.messages(chatId, { after: t.items[t.items.length - 1].created_at, limit: PAGE });
    if (rows.length) rows.forEach((r) => onMessage(r, 'INSERT'));
  } catch { /* next tick */ }
}

export function stopChat() {
  running?.stop();
  running = null;
  typing?.channel.close();
  typing = null;
  viewing = { chatId: null, atBottom: true };
  state = initial();
  emit();
}

// Titles for notifications.
export const describe = (chat, row) => ({
  title: chatTitle(chat),
  body: previewText(lastFrom(row, chat), { me: state.me, group: chat.kind === 'group' }),
});

// Open (or create) a DM with someone and go to it. Used by the student profile page.
export async function messageUser(userId, go) {
  const existing = (state.chats || []).find((c) => c.kind === 'direct' && c.peer?.id === userId);
  const id = existing ? existing.id : await api.openDirect(userId);
  if (!existing) await reloadChats();
  go(`/messages/${id}`);
}
