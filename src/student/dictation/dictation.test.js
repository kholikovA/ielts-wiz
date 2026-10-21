import { checkDictation, tokenize, normWord, editDistance } from './diff';
import { sentencesFromWhisper, alignTranscript, refineEnds, chunkCues, endsSentence } from './cues';

const kinds = (ops) => ops.map((o) => `${o.t}:${o.said ?? ''}>${o.ref ?? ''}`);

test('normWord ignores case, punctuation and number spelling', () => {
  expect(normWord('Hello,')).toBe('hello');
  expect(normWord('Five')).toBe('5');
  expect(normWord('1,000')).toBe('1000');
  expect(normWord('9.30')).toBe('9.30');
  expect(normWord('a.m.')).toBe('am');
  expect(normWord('it’s')).toBe("it's");
  expect(normWord('—')).toBe('');
});

test('tokenize splits hyphenated words', () => {
  expect(tokenize('a part-time job').map((t) => t.n)).toEqual(['a', 'part', 'time', 'job']);
});

test('editDistance counts transpositions as one edit', () => {
  expect(editDistance('recieve', 'receive')).toBe(1);
  expect(editDistance('kitten', 'sitting')).toBe(3);
});

test('perfect dictation scores 100%', () => {
  const r = checkDictation('good morning dave smith speaking', 'Good morning, Dave Smith speaking.');
  expect(r.score).toMatchObject({ accuracy: 100, correct: 5, total: 5, extra: 0, missing: 0, typos: 0 });
});

test('misspellings, missing and extra words are told apart', () => {
  const r = checkDictation('I would like to recieve the the form please', 'I would like to receive the application form.');
  expect(kinds(r.ops)).toEqual([
    'ok:I>I', 'ok:would>would', 'ok:like>like', 'ok:to>to', 'typo:recieve>receive', 'extra:the>',
    'ok:the>the', 'miss:>application', 'ok:form>form.', 'extra:please>',
  ]);
  expect(r.score).toMatchObject({ correct: 6, total: 8, typos: 1, missing: 1, extra: 2, accuracy: 75 });
});

test('unrelated words are extra + missing, not a misspelling', () => {
  const r = checkDictation('the cat sat', 'the dog sat');
  expect(kinds(r.ops)).toEqual(['ok:the>the', 'extra:cat>', 'miss:>dog', 'ok:sat>sat']);
});

test('numbers must be exact; digits match number words', () => {
  expect(checkDictation('it costs 5 pounds', 'It costs five pounds.').score.accuracy).toBe(100);
  const r = checkDictation('call 0777', 'Call 0771.');
  expect(r.ops.map((o) => o.t)).toEqual(['ok', 'extra', 'miss']);
});

test('empty answer misses everything', () => {
  const r = checkDictation('', 'Two words.');
  expect(r.score).toMatchObject({ correct: 0, total: 2, missing: 2, accuracy: 0 });
});

test('endsSentence handles abbreviations and times', () => {
  expect(endsSentence('speaking.', 'Hi')).toBe(true);
  expect(endsSentence('Mr.', 'Smith')).toBe(false);
  expect(endsSentence('a.m.', 'and')).toBe(false);
  expect(endsSentence('p.m.', 'Then')).toBe(true);
  expect(endsSentence('No.', 'I')).toBe(true);
  expect(endsSentence('really?', undefined)).toBe(true);
  expect(endsSentence('4.30', 'Is')).toBe(false);
});

const whisper = {
  segments: [
    { start: 0, end: 3.1, text: ' Good morning, Dave Smith speaking.' },
    { start: 3.4, end: 6.0, text: ' Hi, could I speak to Mr. Jones? Sure.' },
  ],
  words: [
    { word: 'Good', start: 0.0, end: 0.4 }, { word: 'morning', start: 0.4, end: 0.9 },
    { word: 'Dave', start: 1.0, end: 1.4 }, { word: 'Smith', start: 1.4, end: 1.9 },
    { word: 'speaking', start: 2.0, end: 2.9 }, { word: 'Hi', start: 3.4, end: 3.6 },
    { word: 'could', start: 3.7, end: 3.9 }, { word: 'I', start: 3.9, end: 4.0 },
    { word: 'speak', start: 4.0, end: 4.3 }, { word: 'to', start: 4.3, end: 4.4 },
    { word: 'Mr', start: 4.4, end: 4.6 }, { word: 'Jones', start: 4.6, end: 5.1 },
    { word: 'Sure', start: 5.5, end: 5.9 },
  ],
};

test('sentencesFromWhisper cuts at sentence ends, using word times', () => {
  const cues = sentencesFromWhisper(whisper);
  expect(cues).toEqual([
    { s: 0, e: 2.9, text: 'Good morning, Dave Smith speaking.' },
    { s: 3.4, e: 5.1, text: 'Hi, could I speak to Mr. Jones?' },
    { s: 5.5, e: 5.9, text: 'Sure.' },
  ]);
});

test('alignTranscript puts the teacher wording on the timed cues', () => {
  const cues = sentencesFromWhisper(whisper);
  const out = alignTranscript('Good morning, Dave Smyth speaking. Hello, could I speak to Mr Jones? Sure thing.', cues);
  expect(out.map((c) => c.text)).toEqual([
    'Good morning, Dave Smyth speaking.',
    'Hello, could I speak to Mr Jones?',
    'Sure thing.',
  ]);
  expect(out.map((c) => c.s)).toEqual([0, 3.4, 5.5]);
});

test('refineEnds trims trailing silence before the next cue', () => {
  const rate = 1000;
  const samples = new Float32Array(10 * rate);
  for (let i = 0; i < 2 * rate; i += 1) samples[i] = Math.sin(i) * 0.5; // speech 0–2 s
  for (let i = 6 * rate; i < 7 * rate; i += 1) samples[i] = Math.sin(i) * 0.5; // speech 6–7 s
  const out = refineEnds(samples, rate, [{ s: 0 }, { s: 6 }]);
  expect(out[0].e).toBeGreaterThan(2);
  expect(out[0].e).toBeLessThan(2.5);
  expect(out[1].e).toBeGreaterThan(7);
  expect(out[1].e).toBeLessThan(7.5);
});

test('chunkCues groups consecutive sentences', () => {
  const cues = [{ s: 0, e: 1 }, { s: 1, e: 2 }, { s: 2, e: 3 }, { s: 3, e: 4 }, { s: 4, e: 5 }];
  expect(chunkCues(cues, 2)).toEqual([
    { s: 0, e: 2, from: 0, to: 1 }, { s: 2, e: 4, from: 2, to: 3 }, { s: 4, e: 5, from: 4, to: 4 },
  ]);
});
