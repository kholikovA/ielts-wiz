import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

const mockSignInWithGoogle = jest.fn();
const mockSignInWithTelegram = jest.fn();
let mockTg;
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ signInWithGoogle: mockSignInWithGoogle, signInWithTelegram: mockSignInWithTelegram }),
}));
jest.mock('../lib/telegramLogin', () => ({
  useTelegramLogin: (kind, opts) => { mockTg.kind = kind; mockTg.opts = opts; return mockTg; },
}));

// eslint-disable-next-line global-require
const AuthPage = require('./AuthPage').default;

let container; let root;
beforeEach(() => {
  mockSignInWithGoogle.mockReset();
  mockSignInWithGoogle.mockResolvedValue({ error: null });
  mockTg = { ready: false, url: undefined, waiting: false, error: null, onOpen: jest.fn() };
  mockSignInWithTelegram.mockReset();
  window.history.replaceState({}, '', '/');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('renders a single Continue with Google button — no email/password fields', () => {
  act(() => root.render(<AuthPage />));
  const btn = container.querySelector('.google-btn');
  expect(btn).toBeTruthy();
  expect(btn.textContent).toMatch(/Continue with Google/i);
  expect(container.querySelector('input[type="password"]')).toBeNull();
  expect(container.querySelector('input[type="email"]')).toBeNull();
});

test('clicking the button starts Google OAuth with the next path', async () => {
  window.history.replaceState({}, '', '/login?next=/reading');
  act(() => root.render(<AuthPage />));
  await act(async () => { container.querySelector('.google-btn').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(mockSignInWithGoogle).toHaveBeenCalledWith('/reading');
});

test('surfaces an error if OAuth fails to start', async () => {
  mockSignInWithGoogle.mockResolvedValue({ error: { message: 'provider disabled' } });
  act(() => root.render(<AuthPage />));
  await act(async () => { container.querySelector('.google-btn').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(container.querySelector('.auth-error').textContent).toMatch(/provider disabled/i);
});

test('no Telegram button when Telegram login is not configured', async () => {
  await act(async () => { root.render(<AuthPage />); });
  expect(container.querySelector('.telegram-btn')).toBeNull();
});

test('Telegram button links to the bot and waits for confirmation', async () => {
  mockTg = { ...mockTg, ready: true, url: 'https://t.me/ieltswizbot?start=abc' };
  await act(async () => { root.render(<AuthPage />); });
  const btn = container.querySelector('.telegram-btn');
  expect(mockTg.kind).toBe('signin');
  expect(btn.getAttribute('href')).toBe('https://t.me/ieltswizbot?start=abc');
  expect(btn.textContent).toMatch(/Continue with Telegram/i);
  mockTg = { ...mockTg, waiting: true };
  await act(async () => { root.render(<AuthPage />); });
  expect(container.querySelector('.auth-tg-hint').textContent).toMatch(/tap Start/i);
});

test('confirmed in Telegram: signs in with the token hash, shows errors', async () => {
  mockTg = { ...mockTg, ready: true, url: 'https://t.me/x?start=abc' };
  mockSignInWithTelegram.mockResolvedValue({ error: { message: 'link expired' } });
  await act(async () => { root.render(<AuthPage />); });
  await act(async () => { await mockTg.opts.onDone({ status: 'done', token_hash: 'th' }); });
  expect(mockSignInWithTelegram).toHaveBeenCalledWith('th');
  expect(container.querySelector('.auth-error').textContent).toMatch(/link expired/i);
});
