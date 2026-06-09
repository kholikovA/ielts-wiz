import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import SecuredImage from './SecuredImage';

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('renders a canvas (never an <img>) with an accessible label', () => {
  act(() => root.render(<SecuredImage src="/map.png" alt="Campus map" />));
  expect(container.querySelector('canvas.simg-canvas')).toBeTruthy();
  expect(container.querySelector('img')).toBeNull(); // no grabbable image element
  expect(container.querySelector('[role="img"]').getAttribute('aria-label')).toBe('Campus map');
});

test('right-click is blocked on the canvas', () => {
  act(() => root.render(<SecuredImage src="/map.png" alt="m" />));
  const canvas = container.querySelector('canvas');
  const ev = new Event('contextmenu', { bubbles: true, cancelable: true });
  canvas.dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(true);
});

test('drag-out is blocked on the canvas', () => {
  act(() => root.render(<SecuredImage src="/map.png" alt="m" />));
  const canvas = container.querySelector('canvas');
  const ev = new Event('dragstart', { bubbles: true, cancelable: true });
  canvas.dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(true);
});
