// Tests a teacher can assign. Each entry carries the exact kind + test_id the
// players record in user_test_results, so completion is detected automatically.
// Loaded only by the teacher's "new assignment" form (it pulls in the manifest).
import { READING_TESTS, LISTENING_TESTS } from '../data/tests/manifest';
import { listeningTestsData } from '../data/listening-tests';
import { writingPrompts } from '../data/writing-prompts';

const SOURCE_LABEL = { volume9: 'Volume 9', cambridge20: 'Cambridge 20', iw_practice: 'IELTS Wiz' };

export const TEST_GROUPS = [
  {
    label: 'Reading · Full tests',
    tests: READING_TESTS.map((t) => ({
      kind: t.kind, test_id: t.id, href: `/reading-test/${t.slug}`,
      label: `Reading: ${SOURCE_LABEL[t.source] || t.source} Test ${t.n}`,
    })),
  },
  {
    label: 'Listening · Full tests',
    tests: LISTENING_TESTS.map((t) => ({
      kind: t.kind, test_id: t.id, href: `/listening-test/${t.slug}`,
      label: `Listening: ${SOURCE_LABEL[t.source] || t.source} Test ${t.n}`,
    })),
  },
  ...['part1', 'part2', 'part3', 'part4'].map((part, i) => ({
    label: `Listening · Part ${i + 1} practice`,
    tests: (listeningTestsData[part] || []).map((t) => ({
      kind: 'listening', test_id: String(t.id), href: `/tests/test_${t.id}.html`,
      label: `Listening Part ${i + 1}: ${t.title}`,
    })),
  })),
];

export const ALL_TESTS = TEST_GROUPS.flatMap((g) => g.tests);
export const testKey = (t) => `${t.kind}:${t.test_id}`;

export const WRITING_PROMPTS = [
  ...writingPrompts.task1.map((p) => ({ ...p, task: 'Task 1' })),
  ...writingPrompts.task2.map((p) => ({ ...p, task: 'Task 2' })),
];
