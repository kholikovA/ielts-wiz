import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

const mockUpdateProfile = jest.fn();
const mockProfile = { name: 'Jane Doe', onboarded: false };
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: mockProfile, updateProfile: mockUpdateProfile }),
}));
jest.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

// eslint-disable-next-line global-require
const Onboarding = require('./Onboarding').default;

const byText = (sel, re) => Array.from(container.querySelectorAll(sel)).find((el) => re.test(el.textContent));

let container; let root;
beforeEach(() => {
  mockUpdateProfile.mockReset();
  mockUpdateProfile.mockResolvedValue({ error: null });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('greets the user by first name', () => {
  act(() => root.render(<Onboarding />));
  expect(container.querySelector('.onb-title').textContent).toMatch(/Welcome, Jane/);
});

test('Get started saves selected prefs and marks onboarded', async () => {
  act(() => root.render(<Onboarding />));
  // pick band 8.0
  const seg = byText('.onb-seg', /^8\.0$/);
  act(() => seg.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  const finish = byText('.btn', /Get started/);
  await act(async () => { finish.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
  const arg = mockUpdateProfile.mock.calls[0][0];
  expect(arg.onboarded).toBe(true);
  expect(arg.target_score).toBe(8.0);
});

test('Skip for now still marks onboarded', async () => {
  act(() => root.render(<Onboarding />));
  const skip = byText('.onb-skip', /Skip for now/);
  await act(async () => { skip.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  expect(mockUpdateProfile).toHaveBeenCalledWith({ onboarded: true });
});
