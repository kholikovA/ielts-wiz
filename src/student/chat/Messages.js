import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Icon from '../../components/ui/icons';
import { useHub, EmptyPanel, Avatar } from '../ui';
import * as api from './chatApi';
import * as store from './store';
import { useChatState, chatById } from './store';
import { chatTitle, previewText, listTime, sortChats } from './format';
import { ChatAvatar } from './ChatAvatar';
import Conversation, { canPost } from './Conversation';
import InfoPanel from './InfoPanel';
import { notificationPermission, askNotificationPermission, notificationsSupported } from './bootstrap';
import './chat.css';

// Messages: Telegram-style chat for the hub. Students see DMs with their
// teachers and their class / group chats; teachers can message any of their
// students, make groups and manage every chat they own.

const INFO_KEY = 'iw.v1.hub.chatInfo';

function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="hub-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`hub-dialog chat-modal${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="chat-modal-head">
          <h2>{title}</h2>
          <button type="button" className="hub-icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        </div>
        {children}
        {footer && <div className="hub-dialog-actions">{footer}</div>}
      </div>
    </div>
  );
}

const matches = (q, ...fields) => !q || fields.filter(Boolean).join(' ').toLowerCase().includes(q);

// Pick people: one (new message) or many (new group / add members).
function PeoplePicker({ title, people, multi, exclude = [], askTitle, confirmLabel, onDone, onClose, emptyText }) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const query = q.trim().toLowerCase();
  const list = (people || []).filter((p) => !exclude.includes(p.id) && matches(query, p.name, p.email, ...(p.classes || [])));
  const toggle = (id) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const done = async (ids) => {
    setBusy(true);
    try { await onDone(ids, name.trim()); } finally { setBusy(false); }
  };
  // Teachers' quick pick: everyone in a class.
  const classes = multi ? [...new Set((people || []).flatMap((p) => p.classes || []))].sort() : [];
  const pickClass = (c) => setPicked((x) => [...new Set([...x, ...(people || []).filter((p) => (p.classes || []).includes(c)).map((p) => p.id)])]);

  return (
    <Modal title={title} onClose={onClose} wide={multi}
      footer={multi && (
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={busy || !picked.length || (askTitle && !name.trim())} onClick={() => done(picked)}>
            {busy ? 'Working…' : `${confirmLabel}${picked.length ? ` (${picked.length})` : ''}`}
          </button>
        </>
      )}>
      {askTitle && <input className="form-input" placeholder="Group name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoFocus />}
      <input className="form-input" placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={!askTitle} />
      {classes.length > 1 && (
        <div className="chat-chips">
          {classes.map((c) => <button key={c} type="button" className="chat-chip" onClick={() => pickClass(c)}><Icon name="plus" size={12} /> {c}</button>)}
        </div>
      )}
      <div className="chat-people">
        {!people && <div className="hub-loading"><div className="hub-spinner" /></div>}
        {people && !list.length && <div className="hub-pop-empty">{emptyText || 'No one found.'}</div>}
        {list.map((p) => (
          <button key={p.id} type="button" className={`chat-person${picked.includes(p.id) ? ' is-picked' : ''}`} disabled={busy}
            onClick={() => (multi ? toggle(p.id) : done([p.id]))}>
            <Avatar person={p} size={36} />
            <span><strong>{p.name || p.email}</strong><small>{p.is_teacher ? 'Teacher' : (p.classes || []).join(', ') || p.email}</small></span>
            {multi && <span className="chat-check" aria-hidden="true">{picked.includes(p.id) && <Icon name="check" size={14} />}</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ForwardPicker({ chats, onPick, onClose }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const list = sortChats(chats.filter(canPost)).filter((c) => matches(query, chatTitle(c)));
  return (
    <Modal title="Forward to…" onClose={onClose}>
      <input className="form-input" placeholder="Search chats" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="chat-people">
        {!list.length && <div className="hub-pop-empty">No chats found.</div>}
        {list.map((c) => (
          <button key={c.id} type="button" className="chat-person" onClick={() => onPick(c)}>
            <ChatAvatar chat={c} size={36} />
            <span><strong>{chatTitle(c)}</strong><small>{c.kind === 'group' ? `${c.member_count} members` : 'Direct message'}</small></span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ChatRow({ chat, me, active, onOpen, onMenu }) {
  const unread = Number(chat.unread) || 0;
  const mineLast = chat.last && chat.last.sender_id === me;
  const read = mineLast && chat.kind === 'direct' && chat.peer?.last_read_at && new Date(chat.peer.last_read_at) >= new Date(chat.last.created_at);
  const typing = Object.values(store.getChatState().typing[chat.id] || {});
  return (
    <button type="button" className={`chat-row-item${active ? ' is-active' : ''}`} onClick={onOpen}
      onContextMenu={(e) => { e.preventDefault(); onMenu(chat, e.clientX, e.clientY); }} aria-current={active ? 'true' : undefined}>
      <ChatAvatar chat={chat} />
      <span className="chat-row-main">
        <span className="chat-row-top">
          <strong>{chat.kind === 'group' && <Icon name={chat.only_owner_posts ? 'megaphone' : 'users'} size={13} />}{chatTitle(chat)}</strong>
          {chat.muted && <Icon name="bellOff" size={12} className="chat-row-muted" />}
          <span className="chat-row-time">
            {mineLast && <Icon name={read ? 'checkCheck' : 'check'} size={14} className={read ? 'is-read' : ''} />}
            {listTime(chat.last?.created_at || (chat.last ? chat.last_message_at : null))}
          </span>
        </span>
        <span className="chat-row-bottom">
          <span className={`chat-row-preview${typing.length ? ' is-live' : ''}`}>
            {typing.length ? 'typing…' : chat.last ? previewText(chat.last, { me, group: chat.kind === 'group' }) : (chat.kind === 'group' ? 'No messages yet' : 'Start the conversation')}
          </span>
          {chat.pinned && !unread && <Icon name="pin" size={13} className="chat-row-pin" />}
          {unread > 0 && <span className={`chat-unread${chat.muted ? ' is-muted' : ''}`}>{unread > 999 ? '999+' : unread}</span>}
        </span>
      </span>
      <span className="chat-row-more" role="presentation" onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onMenu(chat, r.left, r.bottom); }}>
        <Icon name="moreVertical" size={15} />
      </span>
    </button>
  );
}

function RowMenu({ menu, onClose, toast }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  const c = menu.chat;
  const act = (fn) => () => { onClose(); fn().catch((e) => toast(e.message)); };
  const style = { left: Math.min(menu.x, window.innerWidth - 220), top: Math.min(menu.y, window.innerHeight - 160) };
  return (
    <div ref={ref} className="chat-menu" style={style} role="menu">
      <button type="button" className="hub-menu-item" onClick={act(() => api.setPrefs(c.id, { pinned: !c.pinned }).then(store.reloadChats))}>
        <Icon name="pin" size={16} /> {c.pinned ? 'Unpin' : 'Pin to top'}
      </button>
      <button type="button" className="hub-menu-item" onClick={act(() => api.setPrefs(c.id, { muted: !c.muted }).then(store.reloadChats))}>
        <Icon name={c.muted ? 'bell' : 'bellOff'} size={16} /> {c.muted ? 'Unmute' : 'Mute'}
      </button>
      {Number(c.unread) > 0 && (
        <button type="button" className="hub-menu-item" onClick={act(async () => store.markRead(c.id))}>
          <Icon name="checkCheck" size={16} /> Mark as read
        </button>
      )}
    </div>
  );
}

function NotificationsPrompt() {
  const [perm, setPerm] = useState(notificationPermission);
  if (!notificationsSupported() || perm !== 'default') return null;
  return (
    <button type="button" className="chat-notify-prompt" onClick={() => askNotificationPermission().then(setPerm)}>
      <Icon name="bell" size={15} />
      <span>Turn on desktop alerts for new messages</span>
    </button>
  );
}

export default function Messages({ chatId }) {
  const { go, preview, isTeacher, profile } = useHub();
  const s = useChatState();
  const [people, setPeople] = useState(null);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // { type: 'direct' | 'group' | 'add' | 'forward', msg? }
  const [rowMenu, setRowMenu] = useState(null);
  const [newMenu, setNewMenu] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [toastText, setToastText] = useState(null);
  const toastTimer = useRef(null);
  const [infoOpen, setInfoOpen] = useState(() => {
    try { return localStorage.getItem(INFO_KEY) === '1'; } catch { return false; }
  });

  const toast = useCallback((text) => {
    setToastText(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(null), 3200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadPeople = useCallback(() => api.contacts().then(setPeople).catch(() => setPeople([])), []);
  useEffect(() => { if (!preview) loadPeople(); }, [preview, loadPeople]);

  const toggleInfo = () => setInfoOpen((v) => {
    try { localStorage.setItem(INFO_KEY, v ? '0' : '1'); } catch { /* storage off */ }
    return !v;
  });

  const chat = chatId ? chatById(s, chatId) : null;
  const all = useMemo(() => s.chats || [], [s.chats]);
  const query = q.trim().toLowerCase();
  const visible = useMemo(() => sortChats(all.filter((c) => !c.archived && matches(query, chatTitle(c), c.peer?.email))), [all, query]);
  const archived = useMemo(() => sortChats(all.filter((c) => c.archived)), [all]);
  const directPeers = new Set(all.filter((c) => c.kind === 'direct').map((c) => c.peer?.id));
  // People you can message who don't have a chat yet: always for students
  // (their teachers), only while searching for teachers (could be many).
  const newPeople = (people || []).filter((p) => !directPeers.has(p.id) && (query ? matches(query, p.name, p.email) : !isTeacher));

  if (preview) {
    return <EmptyPanel icon="message" title="Messages are private" lead="Chats aren't shown in student view. Switch back to teacher view to message this student." />;
  }

  const openDirect = async (userId) => {
    const existing = all.find((c) => c.kind === 'direct' && c.peer?.id === userId);
    if (existing) { setModal(null); go(`/messages/${existing.id}`); return; }
    try {
      const id = await api.openDirect(userId);
      await store.reloadChats();
      setModal(null);
      go(`/messages/${id}`);
    } catch (e) { toast(e.message); }
  };

  const createGroup = async (ids, title) => {
    try {
      const id = await api.createGroup(title, ids);
      await store.reloadChats();
      setModal(null);
      go(`/messages/${id}`);
    } catch (e) { toast(e.message); }
  };

  const addMembers = async (ids) => {
    try {
      await api.addMembers(chat.id, ids);
      await store.loadMembers(chat.id);
      store.reloadChats();
      setModal(null);
      toast(`Added ${ids.length} ${ids.length === 1 ? 'person' : 'people'}.`);
    } catch (e) { toast(e.message); }
  };

  const forward = async (target) => {
    const m = modal.msg;
    setModal(null);
    try {
      const from = m.forwarded || {
        sender_id: m.sender_id,
        name: m.sender_id === s.me ? profile?.name
          : (s.members[m.chat_id] || []).find((x) => x.id === m.sender_id)?.name || chatById(s, m.chat_id)?.peer?.name || 'someone',
        at: m.created_at,
      };
      const attachment = m.attachment ? await api.copyAttachment(m.attachment, target.id) : null;
      const row = await api.sendMessage({ chatId: target.id, body: m.body, attachment, forwarded: from });
      store.rememberSent(row.id);
      store.reloadChats();
      toast(`Forwarded to ${chatTitle(target)}.`);
    } catch (e) { toast(e.message); }
  };

  const loading = s.chats === null;
  const notFound = chatId && !loading && !chat;

  return (
    <div className={`chat-app${chatId ? ' has-thread' : ''}${chat && infoOpen ? ' has-info' : ''}`}>
      <aside className="chat-side" aria-label="Chats">
        <div className="chat-side-head">
          <div className="chat-side-search">
            <Icon name="search" size={15} />
            <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search chats" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><Icon name="close" size={14} /></button>}
          </div>
          <div className="hub-pop-wrap">
            <button type="button" className="hub-icon-btn" aria-label="New chat" title="New chat"
              onClick={() => (isTeacher ? setNewMenu((v) => !v) : setModal({ type: 'direct' }))}>
              <Icon name="edit" size={18} />
            </button>
            {newMenu && (
              <div className="hub-pop chat-new-pop" role="menu" onMouseLeave={() => setNewMenu(false)}>
                <button type="button" className="hub-menu-item" onClick={() => { setNewMenu(false); setModal({ type: 'direct' }); }}><Icon name="message" size={16} /> New message</button>
                <button type="button" className="hub-menu-item" onClick={() => { setNewMenu(false); setModal({ type: 'group' }); }}><Icon name="users" size={16} /> New group</button>
              </div>
            )}
          </div>
        </div>
        <NotificationsPrompt />
        <div className="chat-side-list">
          {loading && <div className="hub-loading"><div className="hub-spinner" /></div>}
          {s.error && <div className="chat-side-empty">Couldn't load chats. <button type="button" className="btn btn-ghost btn-sm" onClick={store.reloadChats}>Retry</button></div>}
          {!loading && !visible.length && !newPeople.length && (
            <div className="chat-side-empty">
              {query ? 'No chats found.' : isTeacher ? 'No chats yet. Class chats appear here automatically; start a message with the pencil button.' : 'No chats yet. Join a class to chat with your teacher and classmates.'}
            </div>
          )}
          {visible.map((c) => (
            <ChatRow key={c.id} chat={c} me={s.me} active={c.id === chatId} onOpen={() => go(`/messages/${c.id}`)}
              onMenu={(ch, x, y) => setRowMenu({ chat: ch, x, y })} />
          ))}
          {newPeople.length > 0 && (
            <>
              <div className="chat-side-label">{isTeacher ? 'People' : 'Your teachers'}</div>
              {newPeople.map((p) => (
                <button key={p.id} type="button" className="chat-row-item" onClick={() => openDirect(p.id)}>
                  <span className="chat-avatar" style={{ width: 44, height: 44 }}><Avatar person={p} size={44} /></span>
                  <span className="chat-row-main">
                    <span className="chat-row-top"><strong>{p.name || p.email}</strong></span>
                    <span className="chat-row-bottom"><span className="chat-row-preview">{p.is_teacher ? 'Teacher · Send a message' : (p.classes || []).join(', ') || p.email}</span></span>
                  </span>
                </button>
              ))}
            </>
          )}
          {archived.length > 0 && !query && (
            <>
              <button type="button" className="chat-side-label chat-side-toggle" onClick={() => setShowArchived((v) => !v)}>
                <Icon name="archive" size={13} /> Archived classes ({archived.length})
                <Icon name="chevronDown" size={13} style={{ transform: showArchived ? 'rotate(180deg)' : 'none' }} />
              </button>
              {showArchived && archived.map((c) => (
                <ChatRow key={c.id} chat={c} me={s.me} active={c.id === chatId} onOpen={() => go(`/messages/${c.id}`)}
                  onMenu={(ch, x, y) => setRowMenu({ chat: ch, x, y })} />
              ))}
            </>
          )}
        </div>
        {!s.live && s.chats && <div className="chat-offline"><Icon name="refresh" size={13} /> Reconnecting… messages may be delayed.</div>}
      </aside>

      {chat ? (
        <Conversation key={`thread:${chat.id}`} chat={chat} profile={profile} infoOpen={infoOpen}
          onBack={() => go('/messages')} onInfo={toggleInfo} onForward={(m) => setModal({ type: 'forward', msg: m })} toast={toast} />
      ) : (
        <div className="chat-placeholder">
          {loading && chatId ? <div className="hub-spinner" /> : (
            <>
              <Icon name="message" size={36} />
              <p>{notFound ? 'This chat doesn\'t exist or you\'re no longer in it.' : 'Select a chat to start messaging.'}</p>
            </>
          )}
        </div>
      )}

      {chat && infoOpen && (
        <InfoPanel key={`info:${chat.id}`} chat={chat} onClose={toggleInfo} onMessage={openDirect} isTeacher={isTeacher} go={go} toast={toast}
          onAddMembers={() => setModal({ type: 'add' })} onLeft={() => go('/messages')} />
      )}

      {modal?.type === 'direct' && (
        <PeoplePicker title="New message" people={people} onDone={([id]) => openDirect(id)} onClose={() => setModal(null)}
          emptyText={isTeacher ? 'No students yet. Students appear once they join one of your classes.' : 'You can message your teachers once you join a class.'} />
      )}
      {modal?.type === 'group' && (
        <PeoplePicker title="New group" multi askTitle confirmLabel="Create group" people={(people || []).filter((p) => !p.is_teacher || isTeacher)}
          onDone={createGroup} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'add' && chat && (
        <PeoplePicker title="Add members" multi confirmLabel="Add" people={people}
          exclude={(s.members[chat.id] || []).map((m) => m.id)} onDone={addMembers} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'forward' && <ForwardPicker chats={all} onPick={forward} onClose={() => setModal(null)} />}
      {rowMenu && <RowMenu menu={rowMenu} onClose={() => setRowMenu(null)} toast={toast} />}
      {toastText && <div className="chat-toast" role="status">{toastText}</div>}
    </div>
  );
}
