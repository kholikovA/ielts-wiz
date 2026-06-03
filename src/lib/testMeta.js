import META from '../data/test-meta.json';

// Map a standalone-test href (e.g. "/reading/passage1_1.html" or
// "/tests/test_24.html") to its ordered list of question-type labels.
// Regenerate the underlying data with: python3 scripts/gen_test_meta.py
export function typesForHref(href) {
  if (!href || typeof href !== 'string') return [];
  const m = href.match(/\/([^/]+)\.html/);
  return (m && META[m[1]]) || [];
}
