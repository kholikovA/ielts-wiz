import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

const mockInvoke = jest.fn();
jest.mock('../supabaseClient', () => ({ supabase: { functions: { invoke: (...a) => mockInvoke(...a) } } }));
// eslint-disable-next-line global-require
const { useTelegramLogin } = require('./telegramLogin');

let tg; let container; let root;
const Probe = ({ kind, onDone }) => { tg = useTelegramLogin(kind, { onDone }); return null; };
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => {
  jest.useFakeTimers();
  mockInvoke.mockReset();
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); jest.useRealTimers(); });

test('prepares a bot link, then polls after the click until confirmed', async () => {
  const onDone = jest.fn();
  mockInvoke.mockImplementation(async (_fn, { body }) => {
    if (body.action === 'start') return { data: { code: 'c'.repeat(32), url: 'https://t.me/bot?start=ccc' }, error: null };
    return { data: mockInvoke.pollReply, error: null };
  });
  mockInvoke.pollReply = { status: 'pending' };
  await act(async () => { root.render(<Probe kind="signin" onDone={onDone} />); });
  await flush();
  expect(tg.ready).toBe(true);
  expect(tg.url).toBe('https://t.me/bot?start=ccc');
  expect(mockInvoke).toHaveBeenCalledWith('telegram-auth', { body: { action: 'start', kind: 'signin' } });

  act(() => tg.onOpen());
  expect(tg.waiting).toBe(true);
  await act(async () => { jest.advanceTimersByTime(2000); });
  await flush();
  expect(onDone).not.toHaveBeenCalled();

  mockInvoke.pollReply = { status: 'done', token_hash: 'th' };
  await act(async () => { jest.advanceTimersByTime(2000); });
  await flush();
  expect(onDone).toHaveBeenCalledWith({ status: 'done', token_hash: 'th' });
  expect(tg.waiting).toBe(false);
});

test('an unlinked Telegram shows a clear message', async () => {
  mockInvoke.mockImplementation(async (_fn, { body }) => (body.action === 'start'
    ? { data: { code: 'c'.repeat(32), url: 'u' }, error: null }
    : { data: { status: 'not_linked' }, error: null }));
  await act(async () => { root.render(<Probe kind="signin" />); });
  await flush();
  act(() => tg.onOpen());
  await act(async () => { jest.advanceTimersByTime(2000); });
  await flush();
  expect(tg.waiting).toBe(false);
  expect(tg.error.message).toMatch(/isn't linked/);
});
