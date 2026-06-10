import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { gradeTest } from './grading';
import ListeningQuestionGroup from './components/ListeningQuestionGroup';
import ListeningReviewView from './review/ListeningReviewView';
import { buildEvidenceIndex } from './review/evidence';
import demo from '../../data/tests/listening/demo1.json';
import test2 from '../../data/tests/listening/iw_listening_2.json';

const groupByType = (t) => {
  for (const part of demo.parts) {
    const g = part.question_groups.find((x) => x.type === t);
    if (g) return g;
  }
  return null;
};

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('the demo grades 40/40 to band 9.0 with the full answer key', () => {
  const g = gradeTest(demo, { ...demo.answer_key });
  expect(g.total).toBe(40);
  expect(g.correct).toBe(40);
  expect(g.band).toBe(9.0);
});

test('grading is case/space-insensitive and counts wrong answers', () => {
  const ans = { ...demo.answer_key, 1: 'brookside', 4: 'wrongword' }; // 1 normalised-correct, 4 wrong
  const g = gradeTest(demo, ans);
  expect(g.correct).toBe(39);
});

test('note completion renders a bound gap for every question number', () => {
  const g = groupByType('note_completion');
  act(() => root.render(<ListeningQuestionGroup group={g} answers={{ 1: 'Brookside' }} onChange={() => {}} />));
  const gaps = container.querySelectorAll('textarea.gap-input');
  expect(gaps.length).toBe(g.questions.length);
  expect(container.querySelector('textarea[data-qnum="1"]').value).toBe('Brookside');
});

test('map labelling renders a secured canvas (no <img>) plus a letter select per question', () => {
  const g = groupByType('map_labelling');
  act(() => root.render(<ListeningQuestionGroup group={g} answers={{}} onChange={() => {}} />));
  expect(container.querySelector('canvas.simg-canvas')).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelectorAll('.lq-select').length).toBe(g.questions.length);
});

test('mcq renders radio options and reports the chosen letter', () => {
  const g = groupByType('mcq');
  const onChange = jest.fn();
  act(() => root.render(<ListeningQuestionGroup group={g} answers={{}} onChange={onChange} />));
  const radios = container.querySelectorAll('input[type="radio"]');
  expect(radios.length).toBe(g.questions.reduce((n, q) => n + q.options.length, 0));
  act(() => radios[1].dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(onChange).toHaveBeenCalled();
});

test('flowchart completion renders native boxes (no images) with bound gaps', () => {
  const g = groupByType('flowchart_completion');
  act(() => root.render(<ListeningQuestionGroup group={g} answers={{ 26: 'sampling' }} onChange={() => {}} />));
  expect(container.querySelectorAll('.fc-box').length).toBe(g.flowchart.steps.length);
  expect(container.querySelectorAll('img').length).toBe(0);
  expect(container.querySelector('textarea[data-qnum="26"]').value).toBe('sampling');
});

test('every answer is located verbatim in the transcript (evidence index)', () => {
  const { byQuestion } = buildEvidenceIndex(demo);
  const unlocated = [];
  for (let n = 1; n <= 40; n++) { if (!byQuestion[n] || !byQuestion[n].located) unlocated.push(n); }
  expect(unlocated).toEqual([]); // a mismatch means an evidence string drifted from the transcript
});

test('authored Test 2 grades 40/40 and every answer locates in its transcript', () => {
  const g = gradeTest(test2, { ...test2.answer_key });
  expect(g.total).toBe(40);
  expect(g.correct).toBe(40);
  const { byQuestion } = buildEvidenceIndex(test2);
  const unlocated = [];
  for (let n = 1; n <= 40; n++) { if (!byQuestion[n] || !byQuestion[n].located) unlocated.push(n); }
  expect(unlocated).toEqual([]);
});

test('transcript review renders the transcript, highlights, and question rows', () => {
  const grade = gradeTest(demo, { ...demo.answer_key, 1: 'wrong' }); // 1 wrong → has a "Correct" line
  act(() => root.render(<ListeningReviewView spec={demo} grade={grade} onExit={() => {}} />));
  expect(container.querySelector('.rv-passage')).toBeTruthy();
  expect(container.querySelectorAll('.ev-span').length).toBeGreaterThan(0); // transcript highlights
  expect(container.querySelectorAll('.rv-q').length).toBeGreaterThan(0);    // question rows
  expect(container.querySelectorAll('.rv-part').length).toBe(demo.parts.length); // section switcher
});
