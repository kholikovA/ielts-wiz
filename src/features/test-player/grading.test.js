import { gradeTest, buildGradeIndex, rawToBand } from './grading';
import { READING_TESTS } from '../../data/tests/manifest';

// Reconstruct a perfect user-answer map from a spec's answer key, in the format
// the player stores answers (mcq_multi keeps the comma-joined selection on each
// shared qnum; text answers take the first acceptable alternative).
function perfectAnswers(spec) {
  const index = buildGradeIndex(spec);
  const key = spec.answer_key || {};
  const ua = {};
  for (const [q, info] of index) {
    const k = key[q];
    if (k == null) continue;
    if (info.type === 'mcq_multi') ua[q] = Array.isArray(k) ? k.join(',') : String(k);
    else if (Array.isArray(k)) ua[q] = k.join(',');
    else ua[q] = String(k).split(/\s*[/|]\s*/)[0].trim();
  }
  return ua;
}

describe('reading grading parity', () => {
  test.each(READING_TESTS.map((t) => [t.id, t.spec]))(
    '%s — perfect answers score full marks',
    (id, spec) => {
      const { correct, total, band } = gradeTest(spec, perfectAnswers(spec));
      expect(total).toBe(Object.keys(spec.answer_key).length);
      expect(correct).toBe(total);
      if (total >= 40) expect(band).toBe(9.0);
    }
  );

  test('band table matches the HTML thresholds', () => {
    expect(rawToBand(40)).toBe(9.0);
    expect(rawToBand(39)).toBe(9.0);
    expect(rawToBand(30)).toBe(7.0);
    expect(rawToBand(23)).toBe(6.0);
    expect(rawToBand(3)).toBe(null);
  });

  test('unanswered questions count as wrong and lower the band', () => {
    const spec = READING_TESTS[0].spec;
    const ua = perfectAnswers(spec);
    Object.keys(ua).slice(0, 5).forEach((q) => delete ua[q]);
    const { correct, total, band, results } = gradeTest(spec, ua);
    expect(correct).toBe(total - 5);
    expect(results.filter((r) => r.unanswered).length).toBe(5);
    expect(band).toBeLessThan(9.0);
  });

  test('a wrong letter (not in options) is marked incorrect — the passage2_1 class of bug', () => {
    const spec = READING_TESTS[0].spec;
    const ua = perfectAnswers(spec);
    const firstQ = Object.keys(ua)[0];
    ua[firstQ] = 'ZZZ'; // nonsense answer
    const { correct, total } = gradeTest(spec, ua);
    expect(correct).toBe(total - 1);
  });
});
