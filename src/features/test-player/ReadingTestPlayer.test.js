import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import ReadingTestPlayer from './ReadingTestPlayer';
import { recordAttempt } from './recording';
import { buildGradeIndex } from './grading';
import { findReadingTest } from '../../data/tests/manifest';

// Mock only the cloud/record side; keep a real localStorage-backed loader so
// review mode can replay. (Avoids pulling the supabase client into the test.)
jest.mock('./recording', () => ({
  recordAttempt: jest.fn(),
  loadLastSubmission: (kind, id) => {
    try { const raw = global.localStorage.getItem(`iw.v1.lastSubmission.${kind}.${id}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  loadLastSubmissionCloud: () => Promise.resolve(null),
}));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const esc = (s) => String(s).replace(/(["\\])/g, '\\$1');

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.clearAllMocks();
});

const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const setVal = (el, value) => act(() => {
  const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});

// Drive the real UI to a fully-correct state using only on-screen controls.
function answerEverything(spec) {
  const index = buildGradeIndex(spec);
  const key = spec.answer_key;
  for (const [q, info] of index) {
    const k = key[q];
    if (k == null) continue;
    const t = info.type;
    if (t === 'tfng' || t === 'yng' || t === 'mcq') {
      const v = String(Array.isArray(k) ? k[0] : k);
      const r = container.querySelector(`input[type=radio][name="q${q}"][value="${esc(v)}"]`);
      if (r) click(r);
    } else if (t === 'mcq_multi') {
      const letters = (Array.isArray(k) ? k : String(k).split(/[,/|]/)).map((s) => s.trim()).filter(Boolean);
      const host = container.querySelector(`.question[data-qnum="${q}"]`);
      letters.forEach((L) => {
        const cb = host && host.querySelector(`input[type=checkbox][value="${esc(L)}"]`);
        if (cb && !cb.checked) click(cb);
      });
    } else if (t === 'matching_info' || t === 'matching_features') {
      const cell = container.querySelector(`tr[data-qnum="${q}"] .match-cell[data-letter="${esc(String(k))}"]`);
      if (cell) click(cell);
    } else if (t === 'matching_headings') {
      const card = container.querySelector(`.heading-card[data-heading-id="${esc(String(k))}"]`);
      if (card) click(card);                       // select (re-renders)
      const gap = container.querySelector(`.heading-gap[data-qnum="${q}"]`);
      if (gap) click(gap);                         // place (reads fresh selection)
    } else {
      const first = String(Array.isArray(k) ? k[0] : k).split(/\s*[/|]\s*/)[0].trim();
      const sel = container.querySelector(`select.gap-input[data-qnum="${q}"]`);
      if (sel) { setVal(sel, first); continue; }
      const inp = container.querySelector(`input.gap-input[data-qnum="${q}"]`);
      if (inp) setVal(inp, first);
    }
  }
}

test.each([1, 3])(
  'V9T%s — answering correctly through the UI scores band 9 and records under the verbatim id',
  (n) => {
    const test = findReadingTest('volume9', n);
    act(() => root.render(<ReadingTestPlayer test={test} />));

    expect(container.querySelectorAll('.passage-section').length).toBe(3);

    answerEverything(test.spec);

    click(container.querySelector('#submitBtn'));
    click(container.querySelector('#confirmSubmit'));

    expect(container.querySelector('[data-testid="overall-score"]').textContent).toBe('9.0');
    expect(container.querySelector('[data-testid="count-correct"]').textContent).toBe('40');

    expect(recordAttempt).toHaveBeenCalledTimes(1);
    const arg = recordAttempt.mock.calls[0][0];
    expect(arg.kind).toBe('reading_full');
    expect(arg.id).toBe(`volume9_test${n}`);
    expect(arg.correct).toBe(40);
    expect(arg.total).toBe(40);
  }
);

function savedPerfect(spec) {
  const index = buildGradeIndex(spec);
  const key = spec.answer_key;
  const a = {};
  for (const [q, info] of index) {
    const k = key[q];
    if (k == null) continue;
    if (info.type === 'mcq_multi') a[q] = Array.isArray(k) ? k.join(',') : String(k);
    else if (Array.isArray(k)) a[q] = k.join(',');
    else a[q] = String(k).split(/\s*[/|]\s*/)[0].trim();
  }
  return a;
}

test('review mode replays the saved submission read-only and does NOT re-record', () => {
  const test = findReadingTest('volume9', 1);
  localStorage.setItem(
    `iw.v1.lastSubmission.${test.kind}.${test.id}`,
    JSON.stringify({ answers: savedPerfect(test.spec), correctCount: 40, total: 40, ts: '2026-01-01T00:00:00Z' })
  );

  act(() => root.render(<ReadingTestPlayer test={test} review />));

  expect(container.querySelector('[data-testid="overall-score"]').textContent).toBe('9.0');
  expect(container.querySelector('[data-testid="count-correct"]').textContent).toBe('40');
  expect(container.textContent).toMatch(/previous attempt/i);
  expect(recordAttempt).not.toHaveBeenCalled(); // replaying guard

  localStorage.clear();
});
