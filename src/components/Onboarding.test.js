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
const selectOption = (sel, value) => act(() => {
  const s = container.querySelector(sel);
  s.value = value;
  s.dispatchEvent(new Event('change', { bubbles: true }));
});
const primary = () => container.querySelector('.btn--primary');
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

test('"When\'s your test?" is a slider with Not booked first, incl. 3–6 mo and 6 mo+', () => {
  mount();
  expect(container.querySelector('.slider')).toBeTruthy();
  const ticks = Array.from(container.querySelectorAll('.slider-ticks span')).map((s) => s.textContent);
  expect(ticks[0]).toBe('Not booked');
  expect(ticks).toEqual(expect.arrayContaining(['3–6 mo', '6 mo+']));
});

test('there is no "Skip for now" — onboarding is mandatory', () => {
  mount();
  expect(container.querySelector('.skip')).toBeNull();
  expect(container.textContent).not.toMatch(/Skip for now/i);
});

test('step 1 requires a target band before advancing', async () => {
  mount();
  await click(primary());
  expect(container.querySelectorAll('.field.is-error').length).toBe(1); // band only (slider is always set)
  expect(stepCount()).toMatch(/Step\s*1\s*of\s*4/);
  await click(byText('.pill.band', /^7\.0$/));
  await click(primary());
  expect(stepCount()).toMatch(/Step\s*2\s*of\s*4/);
});

test('step 3 requires taken-before and first language', async () => {
  mount();
  await click(byText('.pill.band', /^7\.0$/));
  await click(primary());                        // → step 2
  await click(byText('.opt', /Personal goal/));
  await click(primary());                        // → step 3
  await click(primary());                        // blocked
  expect(stepCount()).toMatch(/Step\s*3\s*of\s*4/);
  expect(container.querySelectorAll('.field.is-error').length).toBe(2); // takenBefore + language
});

test('full flow saves the questionnaire then marks onboarded on finish', async () => {
  mount();
  // step 1
  await click(byText('.pill.band', /^7\.0$/));
  await click(primary());
  // step 2
  await click(byText('.opt', /Personal goal/));
  await click(primary());
  // step 3
  await click(byText('.opt', /First time/));
  selectOption('.select-wrap select', 'Russian');
  await click(primary());
  // step 4
  await click(byText('.pill', /Listening/));
  await click(primary()); // Build my study plan

  const saveCall = mockUpdateProfile.mock.calls[0][0];
  expect(saveCall.target_score).toBe(7);
  expect(saveCall.onboarding).toMatchObject({
    testType: 'academic', targetBand: '7.0', purpose: 'personal',
    timeframe: 'not_booked', firstLanguage: 'Russian', focusAreas: ['listening'],
  });
  expect(saveCall.onboarding.onboarded).toBeUndefined();

  expect(container.querySelector('.complete')).toBeTruthy();
  expect(container.textContent).toMatch(/You.re all set, Jane/);

  await click(byText('.btn--primary', /Start practising/));
  expect(mockUpdateProfile).toHaveBeenLastCalledWith({ onboarded: true });
});
