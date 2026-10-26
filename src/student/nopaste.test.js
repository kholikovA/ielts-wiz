import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { NoPaste } from './ui';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('blocks paste and drop into inputs, shows a notice, leaves other elements alone', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  act(() => { createRoot(host).render(<NoPaste><textarea aria-label="answer" /><button type="button">ok</button></NoPaste>); });
  const box = host.querySelector('textarea');
  const fire = (el, type) => {
    let notPrevented;
    act(() => { notPrevented = el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true })); });
    return notPrevented;
  };
  expect(fire(box, 'paste')).toBe(false);
  expect(host.textContent).toMatch(/Pasting is turned off/);
  expect(fire(box, 'drop')).toBe(false);
  expect(fire(host.querySelector('button'), 'paste')).toBe(true);
});
