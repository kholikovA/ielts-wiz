import { READING_TESTS, findReadingTestById, findReadingTestBySlug, slugForId } from './manifest';

// The stable `id`s are storage/Supabase keys — pin them so a refactor can't
// silently rename one and orphan users' stats.
const STABLE_IDS = [
  'volume9_test1', 'volume9_test2', 'volume9_test3', 'volume9_test4',
  'volume9_test5', 'volume9_test6', 'volume9_test7',
  'cam20_t1', 'cam20_t2', 'cam20_t3', 'cam20_t4',
];

test('every test keeps its stable id', () => {
  expect(READING_TESTS.map((t) => t.id).sort()).toEqual([...STABLE_IDS].sort());
});

test('every test has a unique, opaque slug (not derived from its id)', () => {
  const slugs = READING_TESTS.map((t) => t.slug);
  expect(slugs.every(Boolean)).toBe(true);
  expect(new Set(slugs).size).toBe(slugs.length);          // unique
  READING_TESTS.forEach((t) => {
    expect(t.slug).not.toContain(t.id);                    // opaque
    expect(t.slug).not.toMatch(/volume9|cam20|test/i);     // unguessable
  });
});

test('slug resolves to the right test; the stable id never leaks into the URL layer', () => {
  READING_TESTS.forEach((t) => {
    expect(findReadingTestBySlug(t.slug).id).toBe(t.id);
    expect(slugForId(t.id)).toBe(t.slug);
    expect(findReadingTestById(t.id).slug).toBe(t.slug);
  });
});

test('old guessable id-based URLs no longer resolve as slugs', () => {
  STABLE_IDS.forEach((id) => expect(findReadingTestBySlug(id)).toBeNull());
  expect(findReadingTestBySlug('volume9_test5')).toBeNull();
});
