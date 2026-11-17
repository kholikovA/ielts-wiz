import { addHighlight, subtract } from './SatHighlighter';

test('subtract splits a highlight that straddles the range', () => {
  const list = [{ z: 'passage', s: 0, e: 10, c: 'yellow' }, { z: 'prompt', s: 0, e: 10, c: 'blue' }];
  expect(subtract(list, 'passage', 3, 6)).toEqual([
    { z: 'passage', s: 0, e: 3, c: 'yellow' },
    { z: 'passage', s: 6, e: 10, c: 'yellow' },
    { z: 'prompt', s: 0, e: 10, c: 'blue' },
  ]);
});

test('addHighlight replaces what it covers and keeps order', () => {
  let list = addHighlight([], 'passage', 5, 9, 'yellow');
  list = addHighlight(list, 'passage', 0, 6, 'pink');
  expect(list).toEqual([
    { z: 'passage', s: 0, e: 6, c: 'pink' },
    { z: 'passage', s: 6, e: 9, c: 'yellow' },
  ]);
  expect(addHighlight(list, 'passage', 4, 4, 'blue')).toBe(list);
});
