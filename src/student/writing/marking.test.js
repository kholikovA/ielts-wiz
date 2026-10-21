import { overallBand, placeCorrections, draftFeedback } from './marking';

test('overallBand follows IELTS rounding', () => {
  expect(overallBand([6, 6, 6, 6])).toBe(6);
  expect(overallBand([6, 6, 6, 7])).toBe(6.5); // 6.25 rounds up
  expect(overallBand([6, 7, 7, 7])).toBe(7); // 6.75 rounds up
  expect(overallBand([6, 6.5, 6, 6])).toBe(6); // 6.125
  expect(overallBand([])).toBe(null);
});

test('placeCorrections finds quotes in order and keeps the rest of the text', () => {
  const text = 'People is happy. People is busy.';
  const { parts, missing } = placeCorrections(text, [
    { quote: 'People is', fix: 'People are' },
    { quote: 'People is', fix: 'People are' },
    { quote: 'not here', fix: 'x' },
  ]);
  expect(parts.map((p) => (p.c ? `[${p.text}]` : p.text)).join('')).toBe('[People is] happy. [People is] busy.');
  expect(parts.filter((p) => p.c).map((p) => p.n)).toEqual([1, 2]);
  expect(missing).toHaveLength(1);
});

test('placeCorrections falls back to an earlier occurrence when listed out of order', () => {
  const { parts } = placeCorrections('a teh b recieve c', [{ quote: 'recieve', fix: 'receive' }, { quote: 'teh', fix: 'the' }]);
  expect(parts.map((p) => p.text)).toEqual(['a ', 'teh', ' b ', 'recieve', ' c']);
  expect(parts[1].n).toBe(2);
});

test('draftFeedback joins summary and next steps', () => {
  expect(draftFeedback({ summary: 'Good.', next_steps: ['Add an overview', 'Vary linkers'] }))
    .toBe('Good.\n\nNext steps:\n• Add an overview\n• Vary linkers');
});
