import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

const mockUpdateProfile = jest.fn();
const mockProfile = { name: 'Jane Doe', email: 'jane@example.com', onboarded: false };
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: mockProfile, updateProfile: mockUpdateProfile }),
}));

// eslint-disable-next-line global-require
const Onboarding = require('./Onboarding').default;

const byText = (sel, re) => Array.from(container.querySelectorAll(sel)).find((el) => re.test(el.textContent));
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const stepCount = () => container.querySelector('.step-count').textContent;

let container; let root;
function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Onboarding />));
}
beforeEach(() => {
  mockUpdateProfile.mockReset();
  mockUpdateProfile.mockResolvedValue({ error: null });
  window.scrollTo = () => {};
});
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = null; container = null; });

test('greets the user by first name on step 1', () => {
  mount();
  expect(container.querySelector('.step-title').textContent).toMatch(/Welcome, Jane/);
  expect(stepCount()).toMatch(/Step\s*1\s*of\s*4/);
});

test('is academic-only — no General Training / Not sure test-type question', () => {
  mount();
  expect(container.textContent).not.toMatch(/General Training/i);
  expect(container.textContent).not.toMatch(/Not sure/i);
});

test('step 1 blocks advancing until band + timeframe are chosen', async () => {
  mount();
  await click(container.querySelector('.btn--primary')); // Continue with nothing picked
  expect(container.querySelectorAll('.field.is-error').length).toBe(2);
  expect(stepCount()).toMatch(/Step\s*1\s*of\s*4/); // still on step 1
});

test('timeframe spectrum includes the new 3–6 mo and 6 mo+ stops', () => {
  mount();
  const segs = Array.from(container.querySelectorAll('.spectrum__seg')).map((s) => s.textContent);
  expect(segs).toEqual(expect.arrayContaining(['3–6 mo', '6 mo+']));
});

test('picking band + timeframe advances to the goal step', async () => {
  mount();
  await click(byText('.pill.band', /^7\.0$/));
  await click(byText('.spectrum__seg', /^1 month$/));
  await click(container.querySelector('.btn--primary'));
  expect(stepCount()).toMatch(/Step\s*2\s*of\s*4/);
  expect(container.textContent).toMatch(/What.s the IELTS for/);
});

test('full flow saves the questionnaire then marks onboarded on finish', async () => {
  mount();
  // step 1
  await click(byText('.pill.band', /^7\.0$/));
  await click(byText('.spectrum__seg', /^1–3 mo$/));
  await click(container.querySelector('.btn--primary'));
  // step 2
  await click(byText('.opt', /Studying abroad/));
  await click(container.querySelector('.btn--primary'));
  // step 3 (nothing required)
  await click(container.querySelector('.btn--primary'));
  // step 4 → build
  await click(container.querySelector('.btn--primary'));

  // persist() ran with the typed cols + the onboarding payload
  const saveCall = mockUpdateProfile.mock.calls[0][0];
  expect(saveCall.target_score).toBe(7);
  expect(saveCall.onboarding).toMatchObject({ testType: 'academic', targetBand: '7.0', purpose: 'study', timeframe: '1to3m' });
  expect(saveCall.onboarding.onboarded).toBeUndefined(); // not flipped yet

  // completion screen
  expect(container.querySelector('.complete')).toBeTruthy();
  expect(container.textContent).toMatch(/You.re all set, Jane/);

  // Start practising flips the gate
  await click(byText('.btn--primary', /Start practising/));
  expect(mockUpdateProfile).toHaveBeenLastCalledWith({ onboarded: true });
});

test('Skip for now marks onboarded without saving answers', async () => {
  mount();
  await click(byText('.skip', /Skip for now/));
  expect(mockUpdateProfile).toHaveBeenCalledWith({ onboarded: true });
  expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
});
