import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../supabaseClient', () => ({ supabase: {} }));
jest.mock('../ui', () => ({ useHub: () => ({ go: () => {}, preview: false, isTeacher: true, profile: { id: 'me' } }), EmptyPanel: () => null, Avatar: () => null }));
const mockNow = new Date().toISOString();
const mockChats = [
  { id: 'a', kind: 'direct', peer: { id: 'p', name: 'Abdulloh' }, role: 'member', can_post: true, last_message_at: mockNow, last_read_at: mockNow, unread: 0 },
  { id: 'b', kind: 'group', title: 'Junior', class_id: 'c', role: 'owner', can_post: true, last_message_at: mockNow, last_read_at: mockNow, unread: 0, member_count: 13 },
];
jest.mock('./chatApi', () => ({
  listChats: () => Promise.resolve(mockChats),
  contacts: () => Promise.resolve([]),
  chatMembers: () => Promise.resolve([]),
  messages: (id) => Promise.resolve(id === 'a' ? [
    { id: 'm1', chat_id: 'a', sender_id: 'p', body: 'Hello teacher', created_at: mockNow, reactions: {} },
  ] : []),
  mediaMessages: () => Promise.resolve([]),
  messagesByIds: () => Promise.resolve([]),
  ping: () => Promise.resolve(),
  markRead: () => Promise.resolve(),
  subscribeRows: () => () => {},
  typingChannel: () => ({ send: () => {}, close: () => {} }),
}));

const store = require('./store');
const Messages = require('./Messages').default;

// Regression: with the info panel open, switching chats left the old thread on
// screen (thread and panel shared a React key).
test('switching chats with the info panel open shows only the new thread', async () => {
  window.HTMLElement.prototype.scrollIntoView = () => {};
  localStorage.setItem('iw.v1.hub.chatInfo', '1');
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => { store.startChat('me', () => {}); });
  await act(async () => { root.render(<Messages chatId="a" />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(el.querySelectorAll('.chat-thread')).toHaveLength(1);
  await act(async () => { root.render(<Messages chatId="b" />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  const threads = [...el.querySelectorAll('.chat-thread')];
  expect(threads.map((x) => x.getAttribute('aria-label'))).toEqual(['Junior']);
  act(() => root.unmount());
});
