import React from 'react';
import Icon from '../../components/ui/icons';
import { Avatar } from '../ui';
import { isOnline, chatTitle } from './format';

// Group avatars get a stable colour from the chat id.
const HUES = [234, 262, 199, 152, 28, 340, 12, 187];
const hue = (id) => HUES[[...String(id)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length];

export function ChatAvatar({ chat, size = 44 }) {
  if (chat.kind === 'direct') {
    return (
      <span className="chat-avatar" style={{ width: size, height: size }}>
        <Avatar person={chat.peer || { name: '?' }} size={size} />
        {isOnline(chat.peer?.last_seen_at) && <span className="chat-online" aria-label="online" />}
      </span>
    );
  }
  const initial = chatTitle(chat).trim().charAt(0).toUpperCase();
  return (
    <span className="chat-avatar chat-avatar--group" style={{ width: size, height: size, '--chat-hue': hue(chat.id), fontSize: size * 0.4 }}>
      {initial || <Icon name="users" size={size * 0.45} />}
    </span>
  );
}
