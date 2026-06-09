import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Flowchart from './Flowchart';

const SPEC = {
  title: 'Paper production',
  steps: [
    { html: 'get raw materials from ___', qnums: [21] },
    { html: 'remove bark' },
    { html: 'paper produced in machine', emphasis: true },
  ],
};

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('renders one box per step and an arrow between each', () => {
  act(() => root.render(<Flowchart spec={SPEC} answers={{}} onChange={() => {}} />));
  expect(container.querySelectorAll('.fc-box').length).toBe(3);
  expect(container.querySelectorAll('.fc-arrow').length).toBe(2);
});

test('gap steps render a controlled input bound to the qnum', () => {
  act(() => root.render(<Flowchart spec={SPEC} answers={{ 21: 'wood' }} onChange={() => {}} />));
  const gap = container.querySelector('textarea[data-qnum="21"]');
  expect(gap).toBeTruthy();
  expect(gap.value).toBe('wood');
});

test('an emphasis step gets the accent class', () => {
  act(() => root.render(<Flowchart spec={SPEC} answers={{}} onChange={() => {}} />));
  expect(container.querySelector('.fc-box--accent')).toBeTruthy();
});

test('the flowchart is drawn without any images', () => {
  act(() => root.render(<Flowchart spec={SPEC} answers={{}} onChange={() => {}} />));
  expect(container.querySelectorAll('img').length).toBe(0);
  expect(container.querySelectorAll('svg image').length).toBe(0);
});
