// Pure helpers for the hub chat: text → tokens, labels, grouping. No React here
// so they stay easy to test (format.test.js).

export const REACTIONS = [
  { key: 'like', icon: 'thumbsUp', label: 'Like' },
  { key: 'heart', icon: 'heart', label: 'Love' },
  { key: 'fire', icon: 'flame', label: 'Fire' },
  { key: 'laugh', icon: 'laugh', label: 'Funny' },
  { key: 'wow', icon: 'sparkle', label: 'Wow' },
  { key: 'done', icon: 'checkCircle', label: 'Done' },
];
export const reactionByKey = (k) => REACTIONS.find((r) => r.key === k);

// Someone counts as online if the hub pinged within this window.
export const ONLINE_MS = 2 * 60 * 1000;
// Messages from the same person this close together share one bubble group.
const GROUP_GAP_MS = 5 * 60 * 1000;

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,;:!?)\]}])/gi;

// Split text into plain and link parts: [{ text }, { text, href }].
export function linkify(text) {
  if (!text) return [];
  const out = [];
  let last = 0;
  text.replace(URL_RE, (match, _g, offset) => {
    if (offset > last) out.push({ text: text.slice(last, offset) });
    out.push({ text: match, href: /^https?:\/\//i.test(match) ? match : `https://${match}` });
    last = offset + match.length;
    return match;
  });
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayDiff = (a, b) => Math.round((startOfDay(a) - startOfDay(b)) / 86400000);

export const timeLabel = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

// Day separator: Today / Yesterday / weekday (this week) / date.
export function dayLabel(iso, now = new Date()) {
  const d = new Date(iso);
  const diff = dayDiff(now, d);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) });
}

// Chat list timestamp: time today, weekday this week, else short date.
export function listTime(iso, now = new Date()) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = dayDiff(now, d);
  if (diff === 0) return timeLabel(iso);
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(d.getFullYear() === now.getFullYear() ? {} : { year: '2-digit' }) });
}

export const isOnline = (lastSeen, now = Date.now()) => Boolean(lastSeen) && now - new Date(lastSeen).getTime() < ONLINE_MS;

export function lastSeenLabel(lastSeen, now = new Date()) {
  if (!lastSeen) return 'last seen a long time ago';
  if (isOnline(lastSeen, now.getTime())) return 'online';
  const d = new Date(lastSeen);
  const mins = Math.floor((now - d) / 60000);
  if (mins < 60) return `last seen ${mins} min ago`;
  const diff = dayDiff(now, d);
  if (diff === 0) return `last seen at ${timeLabel(lastSeen)}`;
  if (diff === 1) return `last seen yesterday at ${timeLabel(lastSeen)}`;
  return `last seen ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
}

export function fileSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function duration(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const ATTACHMENT_LABEL = { image: 'Photo', voice: 'Voice message', video: 'Video', file: 'File' };

// One-line preview for the chat list.
export function previewText(last, { me, group } = {}) {
  if (!last) return '';
  const what = last.body || (last.kind === 'file' && last.file) || ATTACHMENT_LABEL[last.kind] || '';
  const withKind = last.body && last.kind ? `${ATTACHMENT_LABEL[last.kind] || 'File'}, ${last.body}` : what;
  if (last.sender_id === me) return `You: ${withKind}`;
  if (group && last.sender_name) return `${last.sender_name.split(' ')[0]}: ${withKind}`;
  return withKind;
}

// Annotate a sorted message list for rendering: day separators, the start and
// end of each same-sender run (avatar / name placement), the unread divider.
export function layoutMessages(items, { lastReadAt, me } = {}) {
  const out = [];
  let unreadPlaced = !lastReadAt;
  items.forEach((m, i) => {
    const prev = items[i - 1];
    const next = items[i + 1];
    const day = new Date(m.created_at).toDateString();
    const newDay = !prev || new Date(prev.created_at).toDateString() !== day;
    const joins = (a, b) => a && b && a.sender_id === b.sender_id && !a.deleted_at === !b.deleted_at
      && Math.abs(new Date(b.created_at) - new Date(a.created_at)) < GROUP_GAP_MS
      && new Date(a.created_at).toDateString() === new Date(b.created_at).toDateString();
    let unreadHere = false;
    if (!unreadPlaced && m.sender_id !== me && new Date(m.created_at) > new Date(lastReadAt)) {
      unreadHere = true;
      unreadPlaced = true;
    }
    out.push({
      msg: m,
      newDay,
      unreadHere,
      first: newDay || unreadHere || !joins(prev, m),
      last: !joins(m, next),
    });
  });
  return out;
}

// Reaction summary: [{ key, count, mine }] in the fixed REACTIONS order.
export function reactionSummary(reactions, me) {
  const counts = new Map();
  Object.entries(reactions || {}).forEach(([uid, key]) => {
    const c = counts.get(key) || { key, count: 0, mine: false, users: [] };
    c.count += 1;
    c.users.push(uid);
    if (uid === me) c.mine = true;
    counts.set(key, c);
  });
  return REACTIONS.filter((r) => counts.has(r.key)).map((r) => counts.get(r.key));
}

// Display name for a chat.
export function chatTitle(chat) {
  if (!chat) return '';
  if (chat.kind === 'direct') return chat.peer?.name || chat.peer?.email || 'Deleted account';
  return chat.title || 'Group';
}

// Pinned first, then most recent activity.
export function sortChats(chats) {
  return [...chats].sort((a, b) => (Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
    || (new Date(b.last?.created_at || b.last_message_at) - new Date(a.last?.created_at || a.last_message_at)));
}
