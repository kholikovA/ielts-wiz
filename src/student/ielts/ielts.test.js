import {
  normalizeSpec, validateSpec, setKey, keyText, withGroupImage, cleanHtml, compactRanges,
  bankCatalogEntry, bankSlugId, allQuestionNumbers, sanitizeSpec, mergeParts, tidySpec, proofreadSpec,
} from './ielts';
import { gradeTest } from '../../features/test-player/grading';

const reading = () => ({
  title: 'Test',
  parts: [{
    part_number: '1',
    passage_title: 'P',
    passage_paragraphs: ['One.', 'Two.'],
    question_groups: [
      { type: 'tfng', instructions_html: 'x', questions: [{ number: '1', prompt: 'a' }, { number: 2, prompt: 'b' }] },
      { type: 'mcq_multi', instructions_html: 'x', questions: [{ number: 3, prompt: 'Which TWO?', options: [{ letter: 'A', text: 'a' }, { letter: 'B', text: 'b' }, { letter: 'C', text: 'c' }] }, { number: 4 }] },
    ],
  }],
  answer_key: { 1: 'TRUE', 3: ['a', 'c'] },
});

test('normalizeSpec numbers questions, mirrors choose-two answers and flags a partial key', () => {
  const s = normalizeSpec(reading(), 'reading');
  expect(allQuestionNumbers(s)).toEqual([1, 2, 3, 4]);
  expect(s.answer_key).toEqual({ 1: 'TRUE', 3: ['A', 'C'], 4: ['A', 'C'] });
  expect(s.answer_key_status).toBe('partial');
  expect(s.duration_minutes).toBe(60);
  // grades like the built-in tests
  expect(gradeTest(s, { 1: 'TRUE', 3: 'A,C', 4: 'A,C' }).correct).toBe(3);
});

test('validateSpec: missing answers warn, unsupported types block saving', () => {
  const s = normalizeSpec(reading(), 'reading');
  const ok = validateSpec(s, 'reading');
  expect(ok.errors).toEqual([]);
  expect(ok.warnings.join(' ')).toMatch(/No answer for question 2/);
  const bad = { ...s, parts: [{ ...s.parts[0], question_groups: [{ type: 'matching', questions: [{ number: 1 }] }] }] };
  expect(validateSpec(bad, 'reading').errors.join(' ')).toMatch(/isn't a reading question type/);
});

test('validateSpec asks for listening audio and labelling pictures', () => {
  const s = normalizeSpec({
    title: 'L',
    parts: [{ part_number: 2, question_groups: [{ type: 'map_labelling', needs_image: true, image_url: '', bank: ['A', 'B'], questions: [{ number: 11, prompt: 'cafe' }] }] }],
    answer_key: { 11: 'B' },
  }, 'listening');
  const w = validateSpec(s, 'listening').warnings.join(' ');
  expect(w).toMatch(/audio/);
  expect(w).toMatch(/picture/);
  const fixed = withGroupImage(s, 'listening', 0, 0, 'https://x/map.png');
  expect(fixed.parts[0].question_groups[0].image_url).toBe('https://x/map.png');
  expect(validateSpec(fixed, 'listening').warnings.join(' ')).not.toMatch(/picture/);
});

test('setKey edits one answer, or every number of a choose-two group', () => {
  let s = normalizeSpec(reading(), 'reading');
  s = setKey(s, 2, 'NOT GIVEN');
  expect(s.answer_key['2']).toBe('NOT GIVEN');
  s = setKey(s, 4, 'b, c');
  expect(s.answer_key['3']).toEqual(['B', 'C']);
  expect(keyText(s.answer_key['4'])).toBe('B, C');
  s = setKey(s, 1, '  ');
  expect(s.answer_key['1']).toBeUndefined();
});

test('cleanHtml keeps the test text and answer scripts, drops the rest', () => {
  const out = cleanHtml(`<html><head><style>.a{}</style><script src="x.js"></script>
    <script>const correctAnswers = {1:"TRUE"};</script><script>track()</script></head>
    <body><div class="question-part" style="color:red" onclick="x()">Questions 1-5<img src="data:image/png;base64,AAA" alt="map"></div></body></html>`);
  expect(out).toContain('correctAnswers');
  expect(out).not.toContain('track()');
  expect(out).not.toContain('style=');
  expect(out).not.toContain('onclick');
  expect(out).not.toContain('base64');
  expect(out).toContain('[image: map]');
  expect(out).toContain('class="question-part"');
});

test('ids and catalog entries match the player routes', () => {
  const e = bankCatalogEntry({ id: 'abc', skill: 'listening', title: 'Test 1' });
  expect(e).toEqual({ kind: 'listening_full', test_id: 'bank_abc', href: '/listening-test/bank-abc', label: 'Listening: Test 1' });
  expect(bankSlugId('bank-abc')).toBe('abc');
  expect(bankSlugId('k7m2qf9xln1ptr6z')).toBeNull();
  expect(compactRanges([5, 1, 2, 3, 9])).toBe('1–3, 5, 9');
});

test('sanitizeSpec strips scripts, handlers and unsafe URLs but keeps formatting', () => {
  const s = sanitizeSpec({
    instructions_html: 'Write <strong>ONE WORD</strong><img src=x onerror="alert(1)"><script>alert(2)</script>',
    layout: { body_html: "<table><tr><td style='border:1px solid' onclick='x()'>a ___</td></tr></table><a href='javascript:1'>link</a>" },
    image_url: 'javascript:alert(1)', // eslint-disable-line no-script-url
    audio_url: 'https://cdn.example.com/a.mp3',
    questions: [{ number: 1, prompt: 'Plain & simple, a < b' }],
  });
  expect(s.instructions_html).toBe('Write <strong>ONE WORD</strong>');
  expect(s.layout.body_html).toContain('style="border:1px solid"');
  expect(s.layout.body_html).not.toMatch(/onclick|href|<a/);
  expect(s.layout.body_html).toContain('link');
  expect(s.image_url).toBe('');
  expect(s.audio_url).toBe('https://cdn.example.com/a.mp3');
  expect(s.questions[0].prompt).toBe('Plain & simple, a < b');
});

test('mergeParts joins parts in order, keeps notes and reports failed parts', () => {
  const part = (n, q) => ({ found: true, test_title: 'Cam 18 Test 2', part: { part_number: n, passage_paragraphs: ['x'], question_groups: [{ type: 'tfng', questions: [{ number: q, prompt: 'p' }] }] }, answer_key: { [q]: 'TRUE' }, notes: n === 2 ? ['answer 14 unclear'] : [] });
  const { spec, notes } = mergeParts('reading', 'cam.pdf', [
    { status: 'fulfilled', value: part(2, 14) },
    { status: 'fulfilled', value: part(1, 1) },
    { status: 'rejected', reason: new Error('Part 3: AI error (529). Try again.') },
  ]);
  expect(spec.parts.map((p) => p.part_number)).toEqual([1, 2]);
  expect(spec.title).toBe('Cam 18 Test 2');
  expect(spec.answer_key).toEqual({ 1: 'TRUE', 14: 'TRUE' });
  expect(spec.duration_minutes).toBe(40);
  expect(notes).toEqual(['Passage 2: answer 14 unclear', 'Part 3: AI error (529). Try again.']);
  expect(() => mergeParts('reading', 'x.pdf', [{ status: 'fulfilled', value: { found: false } }])).toThrow(/No test/);
});

test('tidySpec drops a copied "Questions x–y" heading and evens out option punctuation', () => {
  const t = tidySpec({ parts: [{ question_groups: [
    { type: 'tfng', instructions_html: '<p><strong>Questions 1 - 6</strong></p><p>Do the following statements agree?</p>', questions: [{ number: 1 }] },
    { type: 'note_completion', instructions_html: '<strong>Questions 7–13</strong><br>Complete the notes below.', questions: [{ number: 7 }] },
    { type: 'mcq', instructions_html: 'Choose the correct letter, <strong>A</strong>, B, C or D.', questions: [
      { number: 27, prompt: 'because', options: [{ letter: 'A', text: 'fossils are scarce.' }, { letter: 'B', text: 'evidence was destroyed,' }, { letter: 'C', text: 'it is contradictory.' }] },
      { number: 28, prompt: 'x', options: [{ letter: 'A', text: 'apples,' }, { letter: 'B', text: 'pears' }] },
    ] },
  ] }] });
  const [g1, g2, g3] = t.parts[0].question_groups;
  expect(g1.instructions_html).toBe('<p>Do the following statements agree?</p>');
  expect(g2.instructions_html).toBe('Complete the notes below.');
  expect(g3.instructions_html).toBe('Choose the correct letter, <strong>A</strong>, B, C or D.');
  expect(g3.questions[0].options[1].text).toBe('evidence was destroyed.');
  expect(g3.questions[1].options[0].text).toBe('apples,'); // no full stops at all: left as written
});

test('proofreadSpec flags copying typos and leaves clean text alone', () => {
  const clean = { parts: [{ part_number: 1, passage_title: 'P', passage_paragraphs: [
    'Thomas Gruter, Martina Gruter’s husband, is not convinced. ‘I don’t know,’ he says. The students’ results – and the ’80s data – agree.',
  ], question_groups: [{ type: 'mcq', instructions_html: 'Choose <strong>A</strong>, <strong>B</strong>, C or D.', questions: [{ number: 1, prompt: 'Which one?', options: [{ letter: 'A', text: 'a box of pins' }] }] }] }] };
  expect(proofreadSpec(clean)).toEqual([]);
  const bad = { parts: [{ part_number: 1, passage_title: 'P', passage_paragraphs: [
    'Thomas Gruter, Martina Gruter’s husband,, who works there, s not convinced it will work. I don’t know how you can have more training. he says. ‘Humans spend all day looking at faces',
    'The food chain - micro-organisms , fish and otters.',
  ], question_groups: [] }] };
  const out = proofreadSpec(bad).join('\n');
  expect(out).toMatch(/doubled punctuation/);
  expect(out).toMatch(/stray letter/);
  expect(out).toMatch(/lowercase after a full stop/);
  expect(out).toMatch(/hyphen used as a dash/);
  expect(out).toMatch(/space before punctuation/);
  expect(out).toMatch(/never closed/);
});
