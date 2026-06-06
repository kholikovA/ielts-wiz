import { clozeRuns } from './cloze';
import { READING_TESTS } from '../../../data/tests/manifest';

const COMPLETION = new Set([
  'note_completion', 'summary_completion', 'sentence_completion',
  'table_completion', 'flowchart_completion', 'diagram_completion', 'short_answer',
]);

const textLen = (frag) => frag.runs.filter((r) => r.html != null || r.text != null)
  .reduce((n, r) => n + (r.html || r.text || '').replace(/<[^>]+>/g, '').trim().length, 0);

// Exhaustive: every completion question in every committed test must yield a
// fragment with exactly one target blank, valid gap→qnum mapping, and real text.
describe('cloze fragments across all reading tests', () => {
  READING_TESTS.forEach(({ id, spec }) => {
    spec.parts.forEach((part) => {
      part.question_groups.forEach((g) => {
        if (!COMPLETION.has(g.type)) return;
        const groupQnums = new Set(g.questions.map((q) => q.number));
        g.questions.forEach((q) => {
          test(`${id} Q${q.number} (${g.type}) → valid filled cloze`, () => {
            const frag = clozeRuns(g, q.number);
            expect(frag).not.toBeNull();
            const gaps = frag.runs.filter((r) => r.gap);
            const targets = gaps.filter((r) => r.target);
            expect(targets).toHaveLength(1);                 // exactly one target blank
            expect(targets[0].qnum).toBe(q.number);          // it's THIS question
            gaps.forEach((r) => expect(groupQnums.has(r.qnum)).toBe(true)); // mapping stays in-group
            expect(textLen(frag)).toBeGreaterThan(3);        // fragment has real surrounding text
            // No stray table-cell separators left dangling at the ends.
            const joined = frag.runs.map((r) => r.html || r.text || (r.gap ? ' X ' : '')).join('').replace(/<[^>]+>/g, '').trim();
            expect(joined).not.toMatch(/(^·|·$)/);
          });
        });
      });
    });
  });
});
