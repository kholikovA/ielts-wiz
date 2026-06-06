import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

const mockSignInWithGoogle = jest.fn();
jest.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ signInWithGoogle: mockSignInWithGoogle }) }));
jest.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

// eslint-disable-next-line global-require
const AuthPage = require('./AuthPage').default;

let container; let root;
beforeEach(() => {
  mockSignInWithGoogle.mockReset();
  mockSignInWithGoogle.mockResolvedValue({ error: null });
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
