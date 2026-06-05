// Registry of reading tests served by the React test player.
//
// `kind` + `id` are COPIED VERBATIM from the standalone-HTML pages these tests
// replace, so every recorded attempt — local (iw.v1.activity / lastSubmission)
// and cloud (user_test_results) — keeps counting and new attempts append to the
// same history. Do NOT "tidy" these strings (e.g. cam20_t1 is intentionally not
// "cambridge20_test1") — changing them orphans users' stats.

import v9t1 from './reading/volume9/test1.json';
import v9t2 from './reading/volume9/test2.json';
import v9t3 from './reading/volume9/test3.json';
import v9t4 from './reading/volume9/test4.json';
import v9t5 from './reading/volume9/test5.json';
import v9t6 from './reading/volume9/test6.json';
import v9t7 from './reading/volume9/test7.json';
import c20t1 from './reading/cambridge20/test1.json';
import c20t2 from './reading/cambridge20/test2.json';
import c20t3 from './reading/cambridge20/test3.json';
import c20t4 from './reading/cambridge20/test4.json';

// source = catalogue folder, n = test number within it.
export const READING_TESTS = [
  { source: 'volume9', n: 1, kind: 'reading_full', id: 'volume9_test1', spec: v9t1 },
  { source: 'volume9', n: 2, kind: 'reading_full', id: 'volume9_test2', spec: v9t2 },
  { source: 'volume9', n: 3, kind: 'reading_full', id: 'volume9_test3', spec: v9t3 },
  { source: 'volume9', n: 4, kind: 'reading_full', id: 'volume9_test4', spec: v9t4 },
  { source: 'volume9', n: 5, kind: 'reading_full', id: 'volume9_test5', spec: v9t5 },
  { source: 'volume9', n: 6, kind: 'reading_full', id: 'volume9_test6', spec: v9t6 },
  { source: 'volume9', n: 7, kind: 'reading_full', id: 'volume9_test7', spec: v9t7 },
  { source: 'cambridge20', n: 1, kind: 'reading_full', id: 'cam20_t1', spec: c20t1 },
  { source: 'cambridge20', n: 2, kind: 'reading_full', id: 'cam20_t2', spec: c20t2 },
  { source: 'cambridge20', n: 3, kind: 'reading_full', id: 'cam20_t3', spec: c20t3 },
  { source: 'cambridge20', n: 4, kind: 'reading_full', id: 'cam20_t4', spec: c20t4 },
];

export const findReadingTest = (source, n) =>
  READING_TESTS.find((t) => t.source === source && t.n === Number(n)) || null;

export const findReadingTestById = (id) =>
  READING_TESTS.find((t) => t.id === id) || null;
