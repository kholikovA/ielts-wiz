// Registry of reading tests served by the React test player.
//
// `kind` + `id` are COPIED VERBATIM from the standalone-HTML pages these tests
// replace, so every recorded attempt — local (iw.v1.activity / lastSubmission)
// and cloud (user_test_results) — keeps counting and new attempts append to the
// same history. Do NOT "tidy" these strings (e.g. cam20_t1 is intentionally not
// "cambridge20_test1") — changing them orphans users' stats.
//
// `slug` is the OPAQUE, unguessable token used in the URL (/reading-test/<slug>)
// so the catalogue isn't enumerable by guessing /reading-test/volume9_test5.
// It's a pure URL alias — resolved back to the stable `id` at the route boundary
// — so it can be rotated freely without touching any stored stats. Keep it
// random; never derive it from `id`.

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
  { source: 'volume9', n: 1, kind: 'reading_full', id: 'volume9_test1', slug: '17diso21so1v821j', spec: v9t1 },
  { source: 'volume9', n: 2, kind: 'reading_full', id: 'volume9_test2', slug: 'o3xci1520xtc2v3z', spec: v9t2 },
  { source: 'volume9', n: 3, kind: 'reading_full', id: 'volume9_test3', slug: 'lsk26v8osbtgqaux', spec: v9t3 },
  { source: 'volume9', n: 4, kind: 'reading_full', id: 'volume9_test4', slug: 'wu940c78f4jnqu3t', spec: v9t4 },
  { source: 'volume9', n: 5, kind: 'reading_full', id: 'volume9_test5', slug: 'mhdu12bmb2rspdif', spec: v9t5 },
  { source: 'volume9', n: 6, kind: 'reading_full', id: 'volume9_test6', slug: 'ppj4yi22gxgkf25t', spec: v9t6 },
  { source: 'volume9', n: 7, kind: 'reading_full', id: 'volume9_test7', slug: 'qnficd9eobkjh66p', spec: v9t7 },
  { source: 'cambridge20', n: 1, kind: 'reading_full', id: 'cam20_t1', slug: '78tqw88hiz1p5s1z', spec: c20t1 },
  { source: 'cambridge20', n: 2, kind: 'reading_full', id: 'cam20_t2', slug: 'd2xuenq31yrgekwc', spec: c20t2 },
  { source: 'cambridge20', n: 3, kind: 'reading_full', id: 'cam20_t3', slug: 'zoe47s2neymlvxao', spec: c20t3 },
  { source: 'cambridge20', n: 4, kind: 'reading_full', id: 'cam20_t4', slug: '1yta8xnt9gpznt6y', spec: c20t4 },
];

export const findReadingTest = (source, n) =>
  READING_TESTS.find((t) => t.source === source && t.n === Number(n)) || null;

// Internal lookups (stats, recording) key on the stable `id`.
export const findReadingTestById = (id) =>
  READING_TESTS.find((t) => t.id === id) || null;

// URL → test. The opaque `slug` is the ONLY accepted public identifier; old
// guessable `id`-based URLs intentionally no longer resolve.
export const findReadingTestBySlug = (slug) =>
  READING_TESTS.find((t) => t.slug === slug) || null;

// id → slug, for building catalogue links from a manifest `id`/recordId.
export const slugForId = (id) => findReadingTestById(id)?.slug || null;
