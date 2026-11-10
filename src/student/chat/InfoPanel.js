import React, { useEffect, useState } from 'react';
import Icon from '../../components/ui/icons';
import { Avatar } from '../ui';
import { confirmDialog } from '../dialog';
import * as api from './chatApi';
import * as store from './store';
import { useChatState } from './store';
import { chatTitle, lastSeenLabel, isOnline, fileSize, timeLabel, dayLabel } from './format';
import { ChatAvatar } from './ChatAvatar';
import { downloadAttachment, useFileUrl, Lightbox } from './media';

function Switch({ checked, onChange, label, hint }) {
  return (
    <label className="chat-switch">
      <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="chat-switch-track" aria-hidden="true"><span /></span>
    </label>
  );
}

function MediaThumb({ m, onOpen }) {
  const url = useFileUrl(m.attachment.path);
  return (
    <button type="button" className="chat-media-thumb" onClick={() => url && onOpen({ ...m.attachment, src: url })} aria-label={m.attachment.name || 'Photo'}>
      {url ? <img src={url} alt="" loading="lazy" /> : <Icon name="image" size={18} />}
    </button>
  );
}

function SharedMedia({ chat }) {
  const [rows, setRows] = useState(null);
  const [image, setImage] = useState(null);
  useEffect(() => {
    let live = true;
    api.mediaMessages(chat.id).then((r) => live && setRows(r)).catch(() => live && setRows([]));
    return () => { live = false; };
  }, [chat.id]);
  if (!rows) return <div className="hub-loading"><div className="hub-spinner" /></div>;
  const photos = rows.filter((m) => m.attachment.kind === 'image');
  const others = rows.filter((m) => m.attachment.kind !== 'image');
  if (!rows.length) return <p className="chat-info-empty">No photos or files shared yet.</p>;
  return (
    <>
      {photos.length > 0 && <div className="chat-media-grid">{photos.map((m) => <MediaThumb key={m.id} m={m} onOpen={setImage} />)}</div>}
      {others.map((m) => (
        <button key={m.id} type="button" className="chat-info-file" onClick={() => downloadAttachment(m.attachment)}>
          <Icon name={m.attachment.kind === 'voice' ? 'mic' : m.attachment.kind === 'video' ? 'play' : 'file'} size={16} />
          <span><strong>{m.attachment.name}</strong><small>{fileSize(m.attachment.size)} · {dayLabel(m.created_at)}, {timeLabel(m.created_at)}</small></span>
          <Icon name="download" size={15} />
        </button>
      ))}
      <Lightbox image={image} onClose={() => setImage(null)} />
    </>
  );
}

export default function InfoPanel({ chat, onClose, onMessage, onAddMembers, onLeft, toast, go, isTeacher }) {
  const s = useChatState();
  const members = s.members[chat.id] || [];
  const owner = chat.role === 'owner';
  const group = chat.kind === 'group';
  const custom = group && !chat.class_id;
  const [tab, setTab] = useState(group ? 'members' : 'media');
  const [title, setTitle] = useState(chat.title || '');
  const [desc, setDesc] = useState(chat.description || '');
  const [saving, setSaving] = useState(false);
  const [memberMenu, setMemberMenu] = useState(null);

  useEffect(() => { setTitle(chat.title || ''); setDesc(chat.description || ''); }, [chat.id, chat.title, chat.description]);
  useEffect(() => { setTab(group ? 'members' : 'media'); }, [chat.id, group]);

  const dirty = title.trim() !== (chat.title || '') || desc.trim() !== (chat.description || '');
  const save = async () => {
    setSaving(true);
    try {
      await api.updateChat(chat.id, { title: title.trim(), description: desc.trim() });
      toast('Group updated.');
    } catch (e) { toast(e.message); }
    setSaving(false);
  };
  const run = (fn, done) => async () => {
    try { await fn(); if (done) toast(done); } catch (e) { toast(e.message); }
  };

  const setOnlyOwner = run(() => api.updateChat(chat.id, { onlyOwnerPosts: !chat.only_owner_posts }));
  const toggleMute = run(() => api.setPrefs(chat.id, { muted: !chat.muted }));

  const clear = async () => {
    if (!await confirmDialog({ title: 'Clear chat history?', body: 'Every message in this chat will be deleted for everyone. This cannot be undone.', confirmLabel: 'Clear history', danger: true })) return;
    await run(() => api.clearHistory(chat.id), 'History cleared.')();
    store.loadLatest(chat.id);
  };
  const del = async () => {
    if (!await confirmDialog({ title: `Delete "${chatTitle(chat)}"?`, body: 'The group and all its messages will be deleted for everyone.', confirmLabel: 'Delete group', danger: true })) return;
    try { await api.deleteChat(chat.id); await store.reloadChats(); onLeft(); } catch (e) { toast(e.message); }
  };
  const leave = async () => {
    if (!await confirmDialog({ title: `Leave "${chatTitle(chat)}"?`, confirmLabel: 'Leave group', danger: true })) return;
    try { await api.leaveChat(chat.id); await store.reloadChats(); onLeft(); } catch (e) { toast(e.message); }
  };
  const memberAction = (fn, msg) => async () => {
    setMemberMenu(null);
    try { await fn(); await store.loadMembers(chat.id); store.reloadChats(); if (msg) toast(msg); } catch (e) { toast(e.message); }
  };

  const peer = chat.peer;
  const online = members.filter((m) => isOnline(m.last_seen_at)).length;

  return (
    <aside className="chat-info" aria-label="Chat info">
      <header className="chat-info-head">
        <strong>{group ? 'Group info' : 'Profile'}</strong>
        <button type="button" className="hub-icon-btn" onClick={onClose} aria-label="Close info"><Icon name="close" size={18} /></button>
      </header>
      <div className="chat-info-body">
        <div className="chat-info-hero">
          <ChatAvatar chat={chat} size={72} />
          <h3>{chatTitle(chat)}</h3>
          <small>
            {group
              ? `${members.length || chat.member_count} members${online ? `, ${online} online` : ''}${chat.class_id ? ' · Class chat' : ''}`
              : lastSeenLabel(peer?.last_seen_at)}
          </small>
        </div>

        {!group && peer?.email && <div className="chat-info-row"><Icon name="user" size={16} /><span>{peer.email}</span></div>}
        {!group && isTeacher && peer && (
          <button type="button" className="chat-info-row chat-info-link" onClick={() => go(`/teach/students/${peer.id}`)}>
            <Icon name="graduation" size={16} /><span>Open student profile</span><Icon name="chevronRight" size={15} />
          </button>
        )}
        {group && !owner && chat.description && <p className="chat-info-desc">{chat.description}</p>}

        {group && owner && (
          <div className="chat-info-section">
            <label className="chat-field"><span>Name</span>
              <input className="form-input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
            </label>
            {chat.class_id && <small className="chat-hint">Renaming the class renames this chat too.</small>}
            <label className="chat-field"><span>Description</span>
              <textarea className="form-input" rows={2} value={desc} maxLength={500} onChange={(e) => setDesc(e.target.value)} placeholder="Rules, links, schedule…" />
            </label>
            {dirty && <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving || !title.trim()}>{saving ? 'Saving…' : 'Save'}</button>}
            <Switch checked={chat.only_owner_posts} onChange={setOnlyOwner} label="Only teachers can send"
              hint="Announcement mode: students can read and react, but not write." />
          </div>
        )}

        <div className="chat-info-section">
          <Switch checked={!chat.muted} onChange={toggleMute} label="Notifications" hint={chat.muted ? 'Muted: no sound or alerts, unread count greyed out.' : null} />
        </div>

        <div className="hub-seg chat-info-tabs" role="tablist">
          {group && <button type="button" role="tab" aria-selected={tab === 'members'} className={tab === 'members' ? 'is-active' : ''} onClick={() => setTab('members')}>Members</button>}
          <button type="button" role="tab" aria-selected={tab === 'media'} className={tab === 'media' ? 'is-active' : ''} onClick={() => setTab('media')}>Media and files</button>
        </div>

        {tab === 'members' && group && (
          <div className="chat-members">
            {owner && custom && (
              <button type="button" className="chat-member chat-member-add" onClick={onAddMembers}>
                <span className="chat-member-plus"><Icon name="userPlus" size={16} /></span><span>Add members</span>
              </button>
            )}
            {members.map((m) => (
              <div key={m.id} className="chat-member">
                <span className="chat-avatar" style={{ width: 36, height: 36 }}>
                  <Avatar person={m} size={36} />
                  {isOnline(m.last_seen_at) && <span className="chat-online" />}
                </span>
                <span className="chat-member-main">
                  <strong>{m.name || m.email}{m.id === s.me && ' (you)'}</strong>
                  <small className={isOnline(m.last_seen_at) ? 'is-live' : ''}>
                    {!m.can_post && m.role !== 'owner' ? 'Can\'t send messages · ' : ''}{lastSeenLabel(m.last_seen_at)}
                  </small>
                </span>
                {m.role === 'owner' && <span className="chat-tag">Teacher</span>}
                {m.id !== s.me && (owner || isTeacher) && (
                  <div className="hub-pop-wrap">
                    <button type="button" className="hub-icon-btn" aria-label={`Options for ${m.name || 'member'}`} onClick={() => setMemberMenu((v) => (v === m.id ? null : m.id))}>
                      <Icon name="moreVertical" size={16} />
                    </button>
                    {memberMenu === m.id && (
                      <div className="hub-pop chat-member-pop" role="menu">
                        <button type="button" className="hub-menu-item" onClick={() => { setMemberMenu(null); onMessage(m.id); }}><Icon name="message" size={16} /> Message privately</button>
                        {isTeacher && m.role !== 'owner' && <button type="button" className="hub-menu-item" onClick={() => { setMemberMenu(null); go(`/teach/students/${m.id}`); }}><Icon name="graduation" size={16} /> Student profile</button>}
                        {owner && m.role !== 'owner' && (
                          <button type="button" className="hub-menu-item" onClick={memberAction(() => api.setCanPost(chat.id, m.id, !m.can_post), m.can_post ? `${m.name || 'Member'} can no longer send messages here.` : `${m.name || 'Member'} can send messages again.`)}>
                            <Icon name={m.can_post ? 'ban' : 'check'} size={16} /> {m.can_post ? 'Stop from sending' : 'Allow sending'}
                          </button>
                        )}
                        {owner && custom && m.role !== 'owner' && (
                          <button type="button" className="hub-menu-item is-danger" onClick={memberAction(() => api.removeMember(chat.id, m.id), 'Removed from the group.')}>
                            <Icon name="logout" size={16} /> Remove from group
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {owner && chat.class_id && <small className="chat-hint">Members follow the class list. Add or remove students in Classes.</small>}
          </div>
        )}
        {tab === 'media' && <SharedMedia chat={chat} />}

        <div className="chat-info-section chat-info-danger">
          {owner && <button type="button" className="chat-info-row is-danger" onClick={clear}><Icon name="trash" size={16} /><span>Clear history</span></button>}
          {owner && custom && <button type="button" className="chat-info-row is-danger" onClick={del}><Icon name="trash" size={16} /><span>Delete group</span></button>}
          {!owner && custom && <button type="button" className="chat-info-row is-danger" onClick={leave}><Icon name="logout" size={16} /><span>Leave group</span></button>}
        </div>
      </div>
    </aside>
  );
}
