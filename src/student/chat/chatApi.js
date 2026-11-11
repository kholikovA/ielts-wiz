import { supabase } from '../../supabaseClient';

// Data layer for the hub chat (migration 20261110080808_hub_chat.sql). Tables are
// read-only to clients; every write is an RPC that checks permissions.

const BUCKET = 'chat-media';
const MSG_COLS = 'id, chat_id, sender_id, body, attachment, reply_to, forwarded, reactions, edited_at, deleted_at, created_at';

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};
const rpc = async (fn, args) => unwrap(await supabase.rpc(fn, args));

// ── Chats ────────────────────────────────────────────────────────────────────
export const listChats = () => rpc('chat_list');
export const chatMembers = (chatId) => rpc('chat_member_list', { p_chat: chatId });
export const contacts = () => rpc('chat_contacts');
export const openDirect = (otherId) => rpc('open_direct_chat', { p_other: otherId });
export const createGroup = (title, memberIds, description = null) =>
  rpc('create_group_chat', { p_title: title, p_members: memberIds, p_description: description });
export const updateChat = (chatId, { title = null, description = null, onlyOwnerPosts = null }) =>
  rpc('update_chat', { p_chat: chatId, p_title: title, p_description: description, p_only_owner_posts: onlyOwnerPosts });
export const addMembers = (chatId, ids) => rpc('add_chat_members', { p_chat: chatId, p_members: ids });
export const removeMember = (chatId, userId) => rpc('remove_chat_member', { p_chat: chatId, p_user: userId });
export const setCanPost = (chatId, userId, can) => rpc('set_chat_member_can_post', { p_chat: chatId, p_user: userId, p_can: can });
export const leaveChat = (chatId) => rpc('leave_chat', { p_chat: chatId });
export const setPrefs = (chatId, { pinned = null, muted = null }) =>
  rpc('set_chat_prefs', { p_chat: chatId, p_pinned: pinned, p_muted: muted });
export const markRead = (chatId) => rpc('mark_chat_read', { p_chat: chatId });
export const ping = () => rpc('chat_ping');
export const pinMessage = (chatId, messageId) => rpc('pin_chat_message', { p_chat: chatId, p_id: messageId });

// The RPCs return attachment paths of what they wiped; remove those files too.
const removeFiles = (paths) => {
  const list = (paths || []).filter(Boolean);
  if (list.length) supabase.storage.from(BUCKET).remove(list).catch(() => { /* left behind; harmless */ });
};
export const deleteChat = async (chatId) => removeFiles(await rpc('delete_chat', { p_chat: chatId }));
export const clearHistory = async (chatId) => removeFiles(await rpc('clear_chat_history', { p_chat: chatId }));

// ── Messages ─────────────────────────────────────────────────────────────────
export const sendMessage = ({ chatId, body, replyTo = null, attachment = null, forwarded = null }) =>
  rpc('send_chat_message', { p_chat: chatId, p_body: body || null, p_reply_to: replyTo, p_attachment: attachment, p_forwarded: forwarded });
export const editMessage = (id, body) => rpc('edit_chat_message', { p_id: id, p_body: body });
export const deleteMessages = async (ids) => removeFiles(await rpc('delete_chat_messages', { p_ids: ids }));
export const react = (id, reaction) => rpc('react_chat_message', { p_id: id, p_reaction: reaction });

// Page of messages, returned oldest first. `before` / `after` are timestamps.
export async function messages(chatId, { before = null, after = null, limit = 50 } = {}) {
  let q = supabase.from('chat_messages').select(MSG_COLS).eq('chat_id', chatId);
  if (before) q = q.lt('created_at', before);
  if (after) q = q.gt('created_at', after);
  q = q.order('created_at', { ascending: Boolean(after) }).limit(limit);
  const rows = unwrap(await q) || [];
  return after ? rows : rows.reverse();
}

export async function messagesByIds(ids) {
  if (!ids.length) return [];
  return unwrap(await supabase.from('chat_messages').select(MSG_COLS).in('id', ids)) || [];
}

export async function searchMessages(chatId, text) {
  const q = text.trim().replace(/[%_\\]/g, (c) => `\\${c}`);
  if (!q) return [];
  return unwrap(await supabase.from('chat_messages').select(MSG_COLS)
    .eq('chat_id', chatId).is('deleted_at', null).ilike('body', `%${q}%`)
    .order('created_at', { ascending: false }).limit(50)) || [];
}

export async function mediaMessages(chatId) {
  return unwrap(await supabase.from('chat_messages').select(MSG_COLS)
    .eq('chat_id', chatId).is('deleted_at', null).not('attachment', 'is', null)
    .order('created_at', { ascending: false }).limit(200)) || [];
}

// ── Files ────────────────────────────────────────────────────────────────────
const safeName = (n) => (n || 'file').normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(-80) || 'file';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function kindOf(file) {
  const t = file.type || '';
  if (/^image\/(png|jpe?g|gif|webp|avif)$/.test(t)) return 'image';
  if (t.startsWith('video/')) return 'video';
  return 'file';
}

const imageSize = (file) => new Promise((resolve) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
  img.onerror = () => { resolve({}); URL.revokeObjectURL(url); };
  img.src = url;
});

// Upload a file into the chat's folder and return the attachment json.
export async function uploadAttachment(chatId, file, extra = {}) {
  if (file.size > MAX_FILE_BYTES) throw new Error('Files can be up to 25 MB.');
  const kind = extra.kind || kindOf(file);
  const path = `${chatId}/${uid()}/${safeName(file.name)}`;
  unwrap(await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false }));
  const dims = kind === 'image' ? await imageSize(file) : {};
  return { path, kind, name: file.name || 'file', mime: file.type || null, size: file.size, ...dims, ...extra };
}

// Forwarding a file copies it into the target chat's folder (members of the
// target chat can't read the source chat's files).
export async function copyAttachment(attachment, toChatId) {
  if (!attachment?.path) return null;
  const path = `${toChatId}/${uid()}/${attachment.path.split('/').pop()}`;
  unwrap(await supabase.storage.from(BUCKET).copy(attachment.path, path));
  return { ...attachment, path };
}

// Signed URLs, cached until shortly before they expire.
const urlCache = new Map(); // path → { url, exp }
const TTL = 3600;
export async function fileUrl(path, { download = null } = {}) {
  if (!path) return null;
  const key = download ? `${path}::dl` : path;
  const hit = urlCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.url;
  const opts = download ? { download } : undefined;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL, opts);
  if (error) throw error;
  urlCache.set(key, { url: data.signedUrl, exp: Date.now() + (TTL - 120) * 1000 });
  return data.signedUrl;
}

// ── Realtime ─────────────────────────────────────────────────────────────────
// Row changes (RLS-filtered by Realtime, so only chats you're in arrive).
export function subscribeRows(handlers) {
  const ch = supabase.channel(`hub-chat-rows-${uid()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (p) => handlers.message?.(p.new, 'INSERT'))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (p) => handlers.message?.(p.new, 'UPDATE'))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members' }, (p) => handlers.member?.(p.new, 'INSERT'))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members' }, (p) => handlers.member?.(p.new, 'UPDATE'))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats' }, (p) => handlers.chat?.(p.new))
    .subscribe((status) => handlers.status?.(status));
  return () => { supabase.removeChannel(ch); };
}

// Typing indicators: private broadcast channel per chat (members only).
export function typingChannel(chatId, onTyping) {
  const ch = supabase.channel(`chat:${chatId}`, { config: { private: true, broadcast: { self: false } } })
    .on('broadcast', { event: 'typing' }, ({ payload }) => onTyping(payload))
    .subscribe();
  return {
    send: (payload) => ch.send({ type: 'broadcast', event: 'typing', payload }).catch(() => {}),
    close: () => { supabase.removeChannel(ch); },
  };
}
