import { normalizeExplanation, locateEvidence, buildEvidenceIndex } from './evidence';

test('normalizeExplanation accepts both string and structured shapes', () => {
  expect(normalizeExplanation('why text')).toEqual({ evidence: null, part: null, paragraph: null, rationale: 'why text' });
  expect(normalizeExplanation({ evidence: 'e', part: 1, paragraph: 2, rationale: 'r' }))
    .toEqual({ evidence: 'e', part: 1, paragraph: 2, rationale: 'r' });
  expect(normalizeExplanation(null)).toBeNull();
});

test('locateEvidence finds exact and fuzzy (smart quotes / whitespace) matches', () => {
  const para = 'The monks played ‘jeu de paume’,   a game of the palm.';
  expect(locateEvidence(para, 'jeu de paume')).toEqual({ start: 18, end: 30 });
  // straight quote + collapsed whitespace still resolves to a raw range
  const loc = locateEvidence(para, "'jeu de paume', a game");
  expect(loc).not.toBeNull();
  expect(para.slice(loc.start, loc.end).toLowerCase()).toContain('jeu de paume');
});

const SPEC = {
  answer_key: { 1: 'FALSE', 2: 'TRUE', 3: 'NOT GIVEN' },
  parts: [{
    part_number: 1,
    passage_paragraphs: [
      { text: 'No drawings or descriptions of any tennis-like games have been discovered.' },
      { text: 'French monks first played handball against their monastery buildings.' },
    ],
    question_groups: [{ type: 'tfng', questions: [{ number: 1 }, { number: 2 }, { number: 3 }] }],
  }],
  explanations: {
    1: { evidence: 'No drawings or descriptions', part: 1, paragraph: 0, rationale: 'Nothing survives.' },
    2: "True: monks played 'handball against their monastery buildings'.",
    3: { evidence: 'this phrase is not in the passage at all', part: 1, paragraph: 0, rationale: 'Not stated.' },
  },
};

test('buildEvidenceIndex locates structured + legacy-quote evidence, flags misses', () => {
  const { byParagraph, byQuestion } = buildEvidenceIndex(SPEC);

  // structured span located in paragraph 0
  expect(byQuestion[1].located).toBe(true);
  expect(byParagraph.get('1:0').some((s) => s.qnum === 1)).toBe(true);

  // legacy string: quote recovered + located in paragraph 1
  expect(byQuestion[2].located).toBe(true);
  expect(byQuestion[2].rationale).toContain('monks played');
  expect(byParagraph.get('1:1').some((s) => s.qnum === 2)).toBe(true);

  // evidence text absent from passage → rationale kept, no highlight
  expect(byQuestion[3].located).toBe(false);
});
