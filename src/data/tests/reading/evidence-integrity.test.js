import { READING_TESTS } from '../manifest';

// Anti-fabrication guard: every committed evidence span (and vocab context) must
// be a VERBATIM substring of the passage it cites. If a future edit drifts the
// text or mislabels a paragraph, this fails instead of silently shipping a quote
// that doesn't exist in the passage.

const paraText = (p) => (typeof p === 'string' ? p : p.text || '');

READING_TESTS.forEach(({ id, spec }) => {
  describe(`${id} review data`, () => {
    const partByNum = {};
    const allText = [];
    spec.parts.forEach((part) => {
      partByNum[part.part_number] = part;
      part.passage_paragraphs.forEach((p) => allText.push(paraText(p)));
    });

    test('every structured evidence span is verbatim in its cited paragraph', () => {
      const bad = [];
      Object.entries(spec.explanations || {}).forEach(([q, e]) => {
        if (!e || typeof e !== 'object' || !e.evidence) return; // rationale-only is allowed
        const part = partByNum[e.part];
        const para = part && part.passage_paragraphs[e.paragraph];
        if (!para || !paraText(para).includes(e.evidence)) bad.push(q);
      });
      expect(bad).toEqual([]);
    });

    test('every vocabulary context is verbatim somewhere in the passages', () => {
      const bad = (spec.vocabulary || [])
        .filter((v) => v.context && !allText.some((t) => t.includes(v.context)))
        .map((v) => v.word);
      expect(bad).toEqual([]);
    });
  });
});
