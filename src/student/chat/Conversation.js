import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import Icon from '../../components/ui/icons';
import { Avatar } from '../ui';
import { confirmDialog } from '../dialog';
import * as api from './chatApi';
import * as store from './store';
import { useChatState, findMessage } from './store';
import {
  REACTIONS, reactionByKey, reactionSummary, layoutMessages, linkify, dayLabel, timeLabel, chatTitle,
  lastSeenLabel, isOnline, ATTACHMENT_LABEL, duration as fmtDuration,
} from './format';
import { Attachment, Lightbox, useRecorder, downloadAttachment } from './media';
import { ChatAvatar } from './ChatAvatar';

const drafts = new Map(); // chatId → unsent text, kept while the hub is open
const NONE = [];
const coarse = () => window.matchMedia?.('(pointer: coarse)').matches;

export const canPost = (chat) => Boolean(chat) && !chat.archived
  && (chat.role === 'owner' || (chat.can_post && !chat.only_owner_posts));
export const canPin = (chat) => chat.kind === 'direct' || chat.role === 'owner';

function Text({ text }) {
  return linkify(text).map((t, i) => (t.href
    ? <a key={i} href={t.href} target="_blank" rel="noopener noreferrer">{t.text}</a>
    : <React.Fragment key={i}>{t.text}</React.Fragment>));
}

function snippet(m) {
  if (!m) return 'Message';
  if (m.deleted_at) return 'Deleted message';
  if (m.body) return m.body.slice(0, 120);
  return ATTACHMENT_LABEL[m.attachment?.kind] || 'Message';
}

// ── Subtitle: online / typing / members ──────────────────────────────────────
export function useSubtitle(chat, s) {
  const typing = Object.values(s.typing[chat.id] || {});
  if (typing.length) {
    if (chat.kind === 'direct') return { text: 'typing…', live: true };
    return { text: typing.length === 1 ? `${typing[0].split(' ')[0]} is typing…` : `${typing.length} people are typing…`, live: true };
  }
  if (chat.kind === 'direct') {
    const label = lastSeenLabel(chat.peer?.last_seen_at);
    return { text: label, live: label === 'online' };
  }
  const members = s.members[chat.id];
  const online = members ? members.filter((m) => m.id !== s.me && isOnline(m.last_seen_at)).length : 0;
  const n = Number(chat.member_count) || members?.length || 0;
  return { text: `${n} member${n === 1 ? '' : 's'}${online ? `, ${online} online` : ''}` };
}

// ── Message menu (right-click / long-press / hover button) ───────────────────
function MessageMenu({ menu, chat, me, onClose, actions }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: menu.x, top: menu.y });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(menu.x, window.innerWidth - r.width - 8)),
      top: Math.max(8, Math.min(menu.y, window.innerHeight - r.height - 8)),
    });
  }, [menu.x, menu.y]);
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const m = menu.msg;
  const mine = m.sender_id === me;
  const pending = String(m.id).startsWith('tmp-');
  const myReaction = m.reactions?.[me];
  const pinned = chat.pinned_message_id === m.id;
  const item = (icon, label, fn, danger) => (
    <button type="button" role="menuitem" className={`hub-menu-item${danger ? ' is-danger' : ''}`} onClick={() => { onClose(); fn(); }}>
      <Icon name={icon} size={16} /> {label}
    </button>
  );

  return (
    <div ref={ref} className="chat-menu" style={pos} role="menu">
      {!pending && !m.deleted_at && (
        <div className="chat-menu-reacts">
          {REACTIONS.map((r) => (
            <button key={r.key} type="button" className={`chat-react-btn chat-react--${r.key}${myReaction === r.key ? ' is-on' : ''}`}
              aria-label={r.label} title={r.label} onClick={() => { onClose(); actions.react(m, myReaction === r.key ? null : r.key); }}>
              <Icon name={r.icon} size={18} />
            </button>
          ))}
        </div>
      )}
      {m.failed && item('refresh', 'Try again', () => actions.retry(m))}
      {m.failed && item('trash', 'Discard', () => actions.discard(m), true)}
      {!pending && canPost(chat) && item('reply', 'Reply', () => actions.reply(m))}
      {!pending && mine && !m.forwarded && item('edit', 'Edit', () => actions.edit(m))}
      {m.body && item('copy', 'Copy text', () => navigator.clipboard?.writeText(m.body).catch(() => {}))}
      {!pending && item('forward', 'Forward', () => actions.forward(m))}
      {!pending && canPin(chat) && item('pin', pinned ? 'Unpin' : 'Pin', () => actions.pin(pinned ? null : m))}
      {!pending && m.attachment?.path && item('download', 'Download', () => downloadAttachment(m.attachment))}
      {!pending && (mine || chat.role === 'owner') && item('trash', 'Delete', () => actions.remove(m), true)}
    </div>
  );
}

// ── One message ──────────────────────────────────────────────────────────────
function Bubble({ row, chat, me, member, group, highlighted, readUpTo, onMenu, onReact, onJump, onOpenImage, onMediaLoad, replyTarget }) {
  const { msg: m, first, last } = row;
  const mine = m.sender_id === me;
  const pressTimer = useRef(null);
  const reacts = reactionSummary(m.reactions, me);
  const pending = String(m.id).startsWith('tmp-');
  const read = mine && readUpTo && new Date(readUpTo) >= new Date(m.created_at);

  const openMenu = (e) => {
    e.preventDefault();
    onMenu(m, e.clientX ?? e.touches?.[0]?.clientX ?? 0, e.clientY ?? e.touches?.[0]?.clientY ?? 0);
  };
  const touchStart = (e) => {
    const t = e.touches[0];
    pressTimer.current = setTimeout(() => onMenu(m, t.clientX, t.clientY), 450);
  };
  const touchEnd = () => clearTimeout(pressTimer.current);

  if (m.deleted_at) return null;

  const showName = group && !mine && first;
  const onlyMedia = !m.body && m.attachment && ['image', 'video'].includes(m.attachment.kind) && !m.reply_to && !m.forwarded;

  return (
    <div className={`chat-row${mine ? ' is-mine' : ''}${first ? ' is-first' : ''}${last ? ' is-last' : ''}${highlighted ? ' is-highlight' : ''}`} data-mid={m.id}>
      {group && !mine && (
        <div className="chat-row-avatar">{last && <Avatar person={member || { name: '?' }} size={30} />}</div>
      )}
      <div
        className={`chat-bubble${onlyMedia ? ' is-media' : ''}${m.failed ? ' is-failed' : ''}`}
        onContextMenu={openMenu}
        onTouchStart={touchStart} onTouchEnd={touchEnd} onTouchMove={touchEnd}
        onDoubleClick={() => !pending && !mine && onReact(m, m.reactions?.[me] === 'like' ? null : 'like')}
      >
        {showName && (
          <div className={`chat-name${member?.role === 'owner' ? ' is-owner' : ''}`}>
            {member?.name || 'Former member'}{member?.role === 'owner' && <span className="chat-tag">Teacher</span>}
          </div>
        )}
        {m.forwarded && <div className="chat-fwd"><Icon name="forward" size={12} /> Forwarded from <strong>{m.forwarded.name || 'someone'}</strong></div>}
        {m.reply_to && (
          <button type="button" className="chat-quote" onClick={() => onJump(m.reply_to)}>
            <strong>{replyTarget?.senderName || 'Message'}</strong>
            <span>{snippet(replyTarget?.msg)}</span>
          </button>
        )}
        {m.attachment && <Attachment a={m.attachment} onOpenImage={onOpenImage} onMediaLoad={onMediaLoad} />}
        {m.body && <div className="chat-text"><Text text={m.body} /></div>}
        <div className="chat-meta">
          {m.edited_at && <span>edited</span>}
          <span>{timeLabel(m.created_at)}</span>
          {mine && (m.failed
            ? <button type="button" className="chat-failed" onClick={(e) => onMenu(m, e.clientX, e.clientY)} aria-label="Not sent. Open options"><Icon name="xCircle" size={14} /></button>
            : <Icon name={pending ? 'clock' : read ? 'checkCheck' : 'check'} size={14} className={read ? 'is-read' : ''} />)}
        </div>
        {!pending && (
          <button type="button" className="chat-more" aria-label="Message options" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onMenu(m, r.left, r.bottom); }}>
            <Icon name="chevronDown" size={14} />
          </button>
        )}
      </div>
      {reacts.length > 0 && (
        <div className="chat-reacts">
          {reacts.map((r) => {
            const def = reactionByKey(r.key);
            return (
              <button key={r.key} type="button" className={`chat-react chat-react--${r.key}${r.mine ? ' is-mine' : ''}`}
                onClick={() => onReact(m, r.mine ? null : r.key)} aria-label={`${def.label}: ${r.count}`} title={def.label}>
                <Icon name={def.icon} size={13} /> {r.count}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Composer ─────────────────────────────────────────────────────────────────
function Composer({ chat, me, myName, reply, editing, onCancel, onSend, onEdit, onEditLast, files, setFiles }) {
  const [text, setText] = useState(() => drafts.get(chat.id) || '');
  const area = useRef(null);
  const fileInput = useRef(null);
  const textRef = useRef(text);
  textRef.current = text;
  const beforeEdit = useRef('');
  const rec = useRecorder();
  const [recError, setRecError] = useState(null);

  // Editing swaps the draft out for the message text, and back afterwards.
  useEffect(() => {
    if (editing) {
      beforeEdit.current = textRef.current;
      setText(editing.body || '');
      area.current?.focus();
    }
  }, [editing]);
  useEffect(() => { if (reply) area.current?.focus(); }, [reply]);
  useEffect(() => { if (!editing) drafts.set(chat.id, text); }, [chat.id, text, editing]);
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);
  useEffect(() => { if (!coarse()) area.current?.focus(); }, [chat.id]);

  const cancel = () => {
    if (editing) setText(beforeEdit.current);
    onCancel();
  };
  const submit = () => {
    const body = text.trim();
    if (editing) {
      if (body !== (editing.body || '') && (body || editing.attachment)) onEdit(editing, body);
      cancel();
      return;
    }
    if (!body && !files.length) return;
    onSend(body, files);
    setText('');
    setFiles([]);
    store.sendTyping(myName, true);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !coarse()) { e.preventDefault(); submit(); return; }
    if (e.key === 'Escape' && (reply || editing)) { e.preventDefault(); cancel(); return; }
    if (e.key === 'ArrowUp' && !text && !editing && onEditLast()) e.preventDefault();
  };
  const onInput = (e) => {
    setText(e.target.value);
    if (e.target.value) store.sendTyping(myName);
  };
  const onPaste = (e) => {
    const pasted = [...(e.clipboardData?.files || [])];
    if (pasted.length) { e.preventDefault(); setFiles((f) => [...f, ...pasted]); }
  };

  const startVoice = async () => {
    setRecError(null);
    try { await rec.start(); } catch { setRecError('Microphone access was blocked. Allow it in your browser to record voice messages.'); }
  };
  const sendVoice = async () => {
    const out = await rec.stop();
    if (out) onSend('', [out.file], { kind: 'voice', duration: out.duration, waveform: out.waveform });
  };

  if (rec.state === 'recording') {
    return (
      <div className="chat-composer">
        <div className="chat-recording">
          <button type="button" className="hub-icon-btn" onClick={rec.cancel} aria-label="Cancel recording"><Icon name="trash" size={18} /></button>
          <span className="chat-rec-dot" aria-hidden="true" />
          <span className="chat-rec-time">{fmtDuration(rec.seconds)}</span>
          <span className="chat-rec-hint">Recording voice message</span>
          <button type="button" className="chat-send" onClick={sendVoice} aria-label="Send voice message"><Icon name="send" size={18} /></button>
        </div>
      </div>
    );
  }

  const bar = editing || reply;
  const empty = !text.trim() && !files.length;
  return (
    <div className="chat-composer">
      {bar && (
        <div className="chat-compose-bar">
          <Icon name={editing ? 'edit' : 'reply'} size={16} />
          <div>
            <strong>{editing ? 'Edit message' : `Reply to ${reply.senderName || 'message'}`}</strong>
            <span>{snippet(editing || reply.msg)}</span>
          </div>
          <button type="button" className="hub-icon-btn" onClick={cancel} aria-label="Cancel"><Icon name="close" size={16} /></button>
        </div>
      )}
      {files.length > 0 && (
        <div className="chat-pending-files">
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="chat-pending-file">
              <Icon name={api.kindOf(f) === 'image' ? 'image' : 'file'} size={14} />
              <span>{f.name}</span>
              <button type="button" onClick={() => setFiles((all) => all.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}><Icon name="close" size={12} /></button>
            </span>
          ))}
        </div>
      )}
      {recError && <div className="chat-compose-error">{recError}</div>}
      <div className="chat-compose-row">
        {!editing && (
          <>
            <button type="button" className="hub-icon-btn" onClick={() => fileInput.current?.click()} aria-label="Attach files" title="Attach files">
              <Icon name="paperclip" size={19} />
            </button>
            <input ref={fileInput} type="file" multiple hidden onChange={(e) => { setFiles((f) => [...f, ...e.target.files]); e.target.value = ''; }} />
          </>
        )}
        <textarea ref={area} className="chat-input" rows={1} value={text} placeholder={files.length ? 'Add a caption' : 'Message'}
          onChange={onInput} onKeyDown={onKey} onPaste={onPaste} maxLength={4000} aria-label="Message" />
        {empty && !editing && navigator.mediaDevices?.getUserMedia && window.MediaRecorder ? (
          <button type="button" className="hub-icon-btn chat-mic" onClick={startVoice} aria-label="Record voice message" title="Record voice message">
            <Icon name="mic" size={19} />
          </button>
        ) : (
          <button type="button" className="chat-send" onClick={submit} disabled={empty && !editing} aria-label={editing ? 'Save' : 'Send'}>
            <Icon name={editing ? 'check' : 'send'} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Search in chat ───────────────────────────────────────────────────────────
function SearchBar({ chat, members, onPick, onClose }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  useEffect(() => {
    if (!q.trim()) { setRes(null); return undefined; }
    let live = true;
    const t = setTimeout(() => api.searchMessages(chat.id, q).then((r) => live && setRes(r)).catch(() => live && setRes([])), 250);
    return () => { live = false; clearTimeout(t); };
  }, [q, chat.id]);
  const name = (id) => members.find((m) => m.id === id)?.name || (chat.peer?.id === id ? chat.peer.name : null) || 'Someone';
  return (
    <div className="chat-search">
      <div className="chat-search-row">
        <Icon name="search" size={16} />
        <input autoFocus className="chat-search-input" placeholder="Search this chat" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()} />
        <button type="button" className="hub-icon-btn" onClick={onClose} aria-label="Close search"><Icon name="close" size={16} /></button>
      </div>
      {res && (
        <div className="chat-search-results">
          {!res.length && <div className="hub-pop-empty">No messages found.</div>}
          {res.map((m) => (
            <button key={m.id} type="button" className="chat-search-hit" onClick={() => onPick(m)}>
              <span><strong>{name(m.sender_id)}</strong><small>{dayLabel(m.created_at)}, {timeLabel(m.created_at)}</small></span>
              <span className="chat-search-body">{m.body}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Conversation ─────────────────────────────────────────────────────────────
export default function Conversation({ chat, profile, onBack, onInfo, infoOpen, onForward, toast }) {
  const s = useChatState();
  const me = s.me;
  const thread = s.threads[chat.id];
  const items = useMemo(() => thread?.items || [], [thread]);
  const members = s.members[chat.id] || NONE;
  const group = chat.kind === 'group';
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const [readMark] = useState(chat.last_read_at); // unread divider stays put while open
  const [reply, setReply] = useState(null);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState(null);
  const [files, setFiles] = useState([]);
  const [image, setImage] = useState(null);
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState(null);
  const [atBottom, setAtBottom] = useState(true);
  const [dragging, setDragging] = useState(false);
  const listRef = useRef(null);
  const bottomRef = useRef(true);
  const prevRef = useRef({ firstId: null, lastId: null, height: 0, top: 0 });
  const jumpRef = useRef(null);
  const forceBottom = useRef(false);

  const nameOf = useCallback((id) => {
    if (id === me) return 'You';
    if (chat.kind === 'direct' && chat.peer?.id === id) return chat.peer.name || chat.peer.email;
    return memberById.get(id)?.name || null;
  }, [me, chat, memberById]);

  useEffect(() => {
    if (!store.getChatState().threads[chat.id]) store.loadLatest(chat.id);
    store.loadMembers(chat.id);
    store.joinTyping(chat.id);
    if (chat.pinned_message_id) store.fetchRefs([], [chat.pinned_message_id]);
    return () => { store.setViewing(null, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id]);
  useEffect(() => () => store.joinTyping(null), []);

  // Scroll: first open → unread divider or bottom; older page → keep place;
  // new message while at bottom → follow; jump → centre the target.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || !items.length) return;
    const p = prevRef.current;
    const firstId = items[0].id;
    const lastId = items[items.length - 1].id;
    if (jumpRef.current) {
      const target = el.querySelector(`[data-mid="${jumpRef.current}"]`);
      if (target) {
        target.scrollIntoView({ block: 'center' });
        setHighlight(jumpRef.current);
        setTimeout(() => setHighlight(null), 1600);
        jumpRef.current = null;
      }
    } else if (forceBottom.current) {
      el.scrollTop = el.scrollHeight;
    } else if (!p.firstId) {
      const divider = el.querySelector('[data-unread]');
      if (divider) el.scrollTop = Math.max(0, divider.offsetTop - 60);
      else el.scrollTop = el.scrollHeight;
    } else if (firstId !== p.firstId && lastId === p.lastId) {
      el.scrollTop = el.scrollHeight - p.height + p.top;
    } else if (lastId !== p.lastId && bottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
    forceBottom.current = false;
    prevRef.current = { firstId, lastId, height: el.scrollHeight, top: el.scrollTop };
    onScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    bottomRef.current = bottom && !thread?.hasNewer;
    prevRef.current.top = el.scrollTop;
    prevRef.current.height = el.scrollHeight;
    setAtBottom(bottomRef.current);
    store.setViewing(chat.id, bottomRef.current);
    if (el.scrollTop < 300 && thread?.hasOlder) store.loadOlder(chat.id);
    if (bottom && thread?.hasNewer) store.loadNewer(chat.id);
  };
  const onMediaLoad = () => {
    const el = listRef.current;
    if (el && bottomRef.current) el.scrollTop = el.scrollHeight;
  };

  const toBottom = async () => {
    if (thread?.hasNewer) { forceBottom.current = true; prevRef.current = { firstId: null }; await store.loadLatest(chat.id); }
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const jumpTo = async (id) => {
    setSearching(false);
    let msg = items.find((m) => m.id === id);
    if (msg) {
      jumpRef.current = id;
      const target = listRef.current?.querySelector(`[data-mid="${id}"]`);
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setHighlight(id);
        setTimeout(() => setHighlight(null), 1600);
        jumpRef.current = null;
      }
      return;
    }
    msg = findMessage(store.getChatState(), id) || (await api.messagesByIds([id]))[0];
    if (!msg || msg.deleted_at) { toast('That message was deleted.'); return; }
    jumpRef.current = id;
    await store.loadAround(chat.id, msg);
  };

  const layout = useMemo(() => layoutMessages(items.filter((m) => !m.deleted_at), { lastReadAt: readMark, me }), [items, readMark, me]);

  // Read receipts: direct → the other person's marker; group → anyone's.
  const readUpTo = chat.kind === 'direct'
    ? chat.peer?.last_read_at
    : members.filter((m) => m.id !== me).reduce((max, m) => (!max || new Date(m.last_read_at) > new Date(max) ? m.last_read_at : max), null);

  // ── Actions ──
  const send = async (body, fileList, voiceMeta) => {
    const replyTo = reply?.msg?.id || null;
    setReply(null);
    forceBottom.current = true;
    const list = fileList?.length ? [...fileList] : [null];
    for (let i = 0; i < list.length; i += 1) {
      const file = list[i];
      const caption = i === 0 ? body : '';
      const tmpId = `tmp-${Date.now()}-${i}`;
      const local = file ? {
        kind: voiceMeta?.kind || api.kindOf(file), name: file.name, size: file.size, uploading: true,
        local: URL.createObjectURL(file), ...(voiceMeta || {}),
      } : null;
      const tmp = {
        id: tmpId, chat_id: chat.id, sender_id: me, body: caption || null, attachment: local,
        reply_to: i === 0 ? replyTo : null, reactions: {}, created_at: new Date().toISOString(),
        retry: { body: caption, file, voiceMeta, replyTo: i === 0 ? replyTo : null },
      };
      store.addLocal(tmp);
      // eslint-disable-next-line no-await-in-loop
      await deliver(tmp);
    }
  };

  const deliver = async (tmp) => {
    const { body, file, voiceMeta, replyTo } = tmp.retry;
    try {
      const attachment = file ? await api.uploadAttachment(chat.id, file, voiceMeta || {}) : null;
      const row = await api.sendMessage({ chatId: chat.id, body, replyTo, attachment });
      store.replaceLocal(chat.id, tmp.id, row);
    } catch (e) {
      store.updateLocal({ id: tmp.id, chat_id: chat.id, failed: true });
      toast(e?.message || 'Message not sent.');
    }
  };

  const actions = {
    react: (m, key) => {
      const next = { ...(m.reactions || {}) };
      if (key) next[me] = key; else delete next[me];
      store.updateLocal({ id: m.id, chat_id: chat.id, reactions: next });
      api.react(m.id, key).catch(() => { store.updateLocal({ id: m.id, chat_id: chat.id, reactions: m.reactions }); });
    },
    reply: (m) => { setEditing(null); setReply({ msg: m, senderName: nameOf(m.sender_id) }); },
    edit: (m) => { setReply(null); setEditing(m); },
    forward: (m) => onForward(m),
    pin: (m) => api.pinMessage(chat.id, m ? m.id : null).catch((e) => toast(e.message)),
    remove: async (m) => {
      const ok = await confirmDialog({
        title: 'Delete message?',
        body: chat.kind === 'direct' ? `It will be deleted for you and ${chatTitle(chat)}.` : 'It will be deleted for everyone in this chat.',
        confirmLabel: 'Delete', danger: true,
      });
      if (!ok) return;
      store.updateLocal({ id: m.id, chat_id: chat.id, deleted_at: new Date().toISOString() });
      api.deleteMessages([m.id]).catch((e) => { store.updateLocal({ id: m.id, chat_id: chat.id, deleted_at: null }); toast(e.message); });
    },
    retry: (m) => { store.updateLocal({ id: m.id, chat_id: chat.id, failed: false }); deliver(m); },
    discard: (m) => store.replaceLocal(chat.id, m.id, null),
  };

  const saveEdit = (m, body) => {
    store.updateLocal({ id: m.id, chat_id: chat.id, body, edited_at: new Date().toISOString() });
    api.editMessage(m.id, body).catch((e) => { store.updateLocal({ id: m.id, chat_id: chat.id, body: m.body, edited_at: m.edited_at }); toast(e.message); });
  };
  const editLast = () => {
    const last = [...items].reverse().find((m) => m.sender_id === me && !m.deleted_at && !m.forwarded && !String(m.id).startsWith('tmp-'));
    if (last) { setEditing(last); return true; }
    return false;
  };

  const sub = useSubtitle(chat, s);
  const pinned = chat.pinned_message_id ? findMessage(s, chat.pinned_message_id) : null;
  const posting = canPost(chat);
  const unreadHere = Number(chat.unread) || 0;

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!posting) return;
    const dropped = [...(e.dataTransfer?.files || [])];
    if (dropped.length) setFiles((f) => [...f, ...dropped]);
  };

  return (
    <section className="chat-thread" aria-label={chatTitle(chat)}
      onDragOver={(e) => { if (posting && e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
      onDrop={onDrop}>
      <header className="chat-head">
        <button type="button" className="hub-icon-btn chat-back" onClick={onBack} aria-label="Back to chats"><Icon name="arrowLeft" size={18} /></button>
        <button type="button" className="chat-head-main" onClick={onInfo}>
          <ChatAvatar chat={chat} size={38} />
          <span>
            <strong>{chatTitle(chat)}{chat.muted && <Icon name="bellOff" size={13} />}</strong>
            <small className={sub.live ? 'is-live' : ''}>{sub.text}</small>
          </span>
        </button>
        <button type="button" className={`hub-icon-btn${searching ? ' is-on' : ''}`} onClick={() => setSearching((v) => !v)} aria-label="Search messages" title="Search"><Icon name="search" size={18} /></button>
        <button type="button" className={`hub-icon-btn${infoOpen ? ' is-on' : ''}`} onClick={onInfo} aria-label="Chat info" title="Info"><Icon name="info" size={18} /></button>
      </header>

      {searching && <SearchBar chat={chat} members={members} onPick={(m) => jumpTo(m.id)} onClose={() => setSearching(false)} />}

      {pinned && !pinned.deleted_at && (
        <div className="chat-pinned">
          <button type="button" className="chat-pinned-main" onClick={() => jumpTo(pinned.id)}>
            <Icon name="pin" size={15} />
            <span><strong>Pinned message</strong><small>{snippet(pinned)}</small></span>
          </button>
          {canPin(chat) && (
            <button type="button" className="hub-icon-btn" onClick={() => actions.pin(null)} aria-label="Unpin"><Icon name="close" size={15} /></button>
          )}
        </div>
      )}

      <div className="chat-scroll" ref={listRef} onScroll={onScroll}>
        {thread?.loading && !items.length && <div className="hub-loading"><div className="hub-spinner" /></div>}
        {thread?.error && !items.length && <div className="chat-empty-thread">Couldn't load messages. <button type="button" className="btn btn-ghost btn-sm" onClick={() => store.loadLatest(chat.id)}>Retry</button></div>}
        {thread && !thread.loading && !thread.error && !layout.length && (
          <div className="chat-empty-thread">
            <Icon name="message" size={28} />
            <p>{posting ? 'No messages yet. Say hello.' : 'No messages yet.'}</p>
          </div>
        )}
        {thread?.hasOlder && items.length > 0 && <div className="chat-older"><span className="hub-spinner" /></div>}
        <div className="chat-list-inner">
          {layout.map((row) => {
            const m = row.msg;
            const target = m.reply_to ? (items.find((x) => x.id === m.reply_to) || s.refs[m.reply_to]) : null;
            return (
              <React.Fragment key={m.id}>
                {row.newDay && <div className="chat-day"><span>{dayLabel(m.created_at)}</span></div>}
                {row.unreadHere && <div className="chat-unread-divider" data-unread><span>Unread messages</span></div>}
                <Bubble row={row} chat={chat} me={me} group={group} member={memberById.get(m.sender_id)}
                  highlighted={highlight === m.id} readUpTo={readUpTo}
                  replyTarget={target ? { msg: target, senderName: nameOf(target.sender_id) } : m.reply_to ? { msg: null } : null}
                  onMenu={(msg, x, y) => setMenu({ msg, x, y })} onReact={actions.react} onJump={jumpTo}
                  onOpenImage={setImage} onMediaLoad={onMediaLoad} />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {!atBottom && (
        <button type="button" className="chat-to-bottom" onClick={toBottom} aria-label="Scroll to latest messages">
          <Icon name="chevronDown" size={20} />
          {unreadHere > 0 && <span className="hub-badge">{unreadHere}</span>}
        </button>
      )}

      {posting ? (
        <Composer key={chat.id} chat={chat} me={me} myName={profile?.name || 'Someone'} reply={reply} editing={editing}
          onCancel={() => { setReply(null); setEditing(null); }} onSend={send} onEdit={saveEdit} onEditLast={editLast}
          files={files} setFiles={setFiles} />
      ) : (
        <div className="chat-readonly">
          <Icon name={chat.archived ? 'archive' : 'megaphone'} size={16} />
          {chat.archived ? 'This class is archived. The chat is read-only.'
            : chat.only_owner_posts ? 'Only the teacher can send messages in this group.'
              : 'The teacher has turned off sending for you in this chat.'}
        </div>
      )}

      {dragging && <div className="chat-drop"><Icon name="upload" size={28} /><span>Drop files to send</span></div>}
      {menu && <MessageMenu menu={menu} chat={chat} me={me} onClose={() => setMenu(null)} actions={actions} />}
      <Lightbox image={image} onClose={() => setImage(null)} />
    </section>
  );
}
