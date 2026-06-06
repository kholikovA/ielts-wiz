import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import ReviewView from './ReviewView';
import { gradeTest } from '../grading';
import { buildLabelResolver } from '../components/review';
import spec from '../../../data/tests/reading/volume9/test5.json';

// Render the review against a real spec with a partial answer set, to exercise
// the full pipeline (evidence index, question list, passage badges) headlessly.
test('ReviewView renders rows, evidence badges, and Explain More without crashing', () => {
  const answers = { 1: 'TRUE', 2: 'TRUE', 7: 'glass' }; // a few right/wrong/blank
  const grade = gradeTest(spec, answers);
  const resolver = buildLabelResolver(spec);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<ReviewView spec={spec} grade={grade} resolver={resolver} onExit={() => {}} />));

  // Question rows exist (Part 1 has 13 questions; one row each here).
  expect(container.querySelectorAll('.rv-q').length).toBeGreaterThan(0);
  // At least one evidence span got injected into the passage (legacy-quote fuzzy match).
  expect(container.querySelectorAll('.ev-span').length).toBeGreaterThan(0);
  // Explain More toggles are present.
  expect(container.querySelectorAll('.rv-explain').length).toBeGreaterThan(0);
  // Part switcher shows all three passages.
  expect(container.querySelectorAll('.rv-part').length).toBe(spec.parts.length);

  act(() => root.unmount());
  container.remove();
});
