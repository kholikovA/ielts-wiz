import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

const mockSignInWithGoogle = jest.fn();
const mockSignInWithTelegram = jest.fn();
const mockPrepareTelegram = jest.fn();
const mockRequestTelegramAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ signInWithGoogle: mockSignInWithGoogle, signInWithTelegram: mockSignInWithTelegram }),
}));
jest.mock('../lib/telegramLogin', () => ({
  prepareTelegram: (...a) => mockPrepareTelegram(...a),
  requestTelegramAuth: (...a) => mockRequestTelegramAuth(...a),
}));
jest.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

// eslint-disable-next-line global-require
const AuthPage = require('./AuthPage').default;

let container; let root;
beforeEach(() => {
  mockSignInWithGoogle.mockReset();
  mockSignInWithGoogle.mockResolvedValue({ error: null });
  mockPrepareTelegram.mockReset().mockResolvedValue(null);
  mockRequestTelegramAuth.mockReset();
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

test('Telegram button signs in with the signed widget payload', async () => {
  mockPrepareTelegram.mockResolvedValue(123);
  mockRequestTelegramAuth.mockResolvedValue({ id: 1, hash: 'x' });
  mockSignInWithTelegram.mockResolvedValue({ error: { message: 'not linked yet' } });
  await act(async () => { root.render(<AuthPage />); });
  const btn = container.querySelector('.telegram-btn');
  expect(btn.textContent).toMatch(/Continue with Telegram/i);
  await act(async () => { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(mockRequestTelegramAuth).toHaveBeenCalledWith(123);
  expect(mockSignInWithTelegram).toHaveBeenCalledWith({ id: 1, hash: 'x' });
  expect(container.querySelector('.auth-error').textContent).toMatch(/not linked yet/i);
});
