import { GAMES, gapSentence, normalise, scramble, shortMeaning } from './gameRounds';

const words = [
  { term: 'mitigate', meaning: 'to make less severe', example: 'Trees mitigate the effects of flooding.' },
  { term: 'ubiquitous', meaning: 'found everywhere', example: 'Phones are ubiquitous now.' },
  { term: 'scrutinise', meaning: 'to examine closely', example: 'Officials scrutinised the report.' },
  { term: 'ambiguous', meaning: 'open to more than one meaning', example: 'The answer was ambiguous.' },
  { term: 'well-being', meaning: 'health and happiness', example: null },
  { term: 'curb', meaning: 'to restrain', example: null },
];
const byId = (id) => GAMES.find((g) => g.id === id);

test('multiple-choice rounds have one correct option and no duplicates', () => {
  ['meaning', 'reverse', 'gap'].forEach((id) => {
    const round = byId(id).build(words);
    expect(round.length).toBeGreaterThan(0);
    round.forEach((q) => {
      expect(q.options.length).toBe(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    });
  });
});

test('gap fill blanks the word and inflections', () => {
  expect(gapSentence('Officials scrutinised the report.', 'scrutinise')).toBe('Officials _____ the report.');
  expect(gapSentence('Nothing here.', 'mitigate')).toBeNull();
});

test('pairs builds boards of five with a shuffled meaning order', () => {
  const round = byId('pairs').build(words);
  expect(round).toHaveLength(1);
  expect(round[0].pairs).toHaveLength(5);
  expect([...round[0].meaningOrder].sort()).toEqual([0, 1, 2, 3, 4]);
});

test('unscramble only uses single words and keeps the letters', () => {
  byId('scramble').build(words).forEach((q) => {
    expect(q.term).not.toMatch(/[\s-]/);
    expect([...q.letters].sort().join('')).toBe([...q.term].sort().join(''));
  });
  expect(scramble('abcd').join('')).not.toBe('abcd');
});

test('typed answers ignore case, accents and punctuation', () => {
  expect(normalise(' Well-Being ')).toBe(normalise('well being'));
  expect(normalise('Café')).toBe('cafe');
});

test('availability rules', () => {
  expect(byId('meaning').available(words.slice(0, 3))).toBe(false);
  expect(byId('gap').available(words)).toBe(true);
  expect(byId('gap').available(words.map((w) => ({ ...w, example: null })))).toBe(false);
});

test('shortMeaning takes the first line and truncates', () => {
  expect(shortMeaning('first line\nsecond')).toBe('first line');
  expect(shortMeaning('x'.repeat(200), 10)).toHaveLength(10);
});
