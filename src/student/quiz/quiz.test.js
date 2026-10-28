import { parseGaps, maskGaps, splitTest, joinTest, markTest, markQuestion, numbering, normalize, analyzeQuiz } from './quiz';

const sample = {
  sections: [{
    id: 's1', title: 'Grammar', instructions: 'Answer all questions.',
    questions: [
      { id: 'a', type: 'mcq', prompt: 'She ___ here since 2010.', options: ['lives', 'has lived', 'is living'], answer: [1] },
      { id: 'b', type: 'mcq', prompt: 'Choose TWO.', options: ['A', 'B', 'C', 'D'], answer: [0, 2] },
      { id: 'c', type: 'tfng', prompt: 'The writer agrees.', variant: 'ynng', answer: 'NG' },
      { id: 'd', type: 'gap', text: 'I {have been|\'ve been} waiting for {two hours}.', bank: true, distractors: 'since\nfor ages' },
      { id: 'e', type: 'match', left: ['Paris', 'Rome'], right: ['Italy', 'France'], answer: [1, 0] },
      { id: 'f', type: 'short', prompt: 'Rewrite with "since".', lead: 'I have', accepted: 'I have known her since 2019.\nI\'ve known her since 2019.' },
      { id: 'g', type: 'reorder', accepted: 'Where do you live?' },
      { id: 'h', type: 'open', prompt: 'Describe your town.', points: 4 },
    ],
  }],
};

test('gap syntax', () => {
  expect(parseGaps('I {have been|\'ve been} waiting for {two hours}.')).toEqual([['have been', "'ve been"], ['two hours']]);
  expect(maskGaps('a {b} c {d|e}')).toBe('a {{1}} c {{2}}');
});

test('splitTest keeps answers out of the payload', () => {
  const { payload, key } = splitTest(sample);
  const json = JSON.stringify(payload);
  expect(json).not.toContain('has lived"]'); // options are there, answers are not
  expect(json).not.toMatch(/"answer"|"accepted"/);
  expect(key.a).toEqual([1]);
  expect(key.d).toEqual([['have been', "'ve been"], ['two hours']]);
  const q = payload.sections[0].questions;
  expect(q[3].text).toBe('I {{1}} waiting for {{2}}.');
  expect(q[3].bank.sort()).toEqual(['for ages', 'have been', 'since', 'two hours']);
  expect(q[6].tiles.sort()).toEqual(['Where', 'do', 'live?', 'you']);
  expect(q[1]).toMatchObject({ multi: true, pick: 2, points: 2 });
});

test('joinTest restores the editable test', () => {
  const { payload, key } = splitTest(sample);
  const back = joinTest(payload, key).sections[0].questions;
  expect(back[3].text).toBe("I {have been|'ve been} waiting for {two hours}.");
  expect(back[3].distractors.split('\n').sort()).toEqual(['for ages', 'since']);
  expect(back[5].accepted).toBe("I have known her since 2019.\nI've known her since 2019.");
  expect(splitTest({ sections: joinTest(payload, key).sections }).key).toEqual(key);
});

test('markTest marks every type', () => {
  const { payload, key } = splitTest(sample);
  const answers = {
    a: [1], b: [0, 3], c: 'NG', d: ["'VE BEEN", 'two hours.'], e: [1, 1],
    f: "I've known her since 2019", g: 'where do you live', h: 'My town is small.',
  };
  const r = markTest(payload, key, answers);
  expect(r.items.a.earned).toBe(1);
  expect(r.items.b).toMatchObject({ earned: 1, possible: 2 });
  expect(r.items.c.earned).toBe(1);
  expect(r.items.d).toMatchObject({ earned: 2, possible: 2 });
  expect(r.items.e).toMatchObject({ earned: 1, possible: 2, parts: [true, false] });
  expect(r.items.f.earned).toBe(1);
  expect(r.items.g.earned).toBe(1);
  expect(r).toMatchObject({ earned: 8, possible: 14, pendingManual: 4 });
  expect(markTest(payload, key, answers, { h: 3 })).toMatchObject({ earned: 11, pendingManual: 0 });
});

test('short answers may include the given start', () => {
  const q = { type: 'short', lead: 'I have' };
  expect(markQuestion(q, ['known her since 2019'], 'I have known her since 2019.').earned).toBe(1);
  expect(markQuestion(q, ['known her since 2019'], 'known her since 2019').earned).toBe(1);
  expect(markQuestion(q, ['known her since 2019'], 'knew her since 2019').earned).toBe(0);
});

test('single-answer MCQ needs exactly the right option', () => {
  const q = { type: 'mcq', multi: false };
  expect(markQuestion(q, [1], [1]).earned).toBe(1);
  expect(markQuestion(q, [1], [0]).earned).toBe(0);
  expect(markQuestion(q, [1], undefined).earned).toBe(0);
});

test('numbering counts gaps and matches as separate questions', () => {
  const { payload } = splitTest(sample);
  const n = numbering(payload);
  expect(n.a).toEqual({ from: 1, to: 1 });
  expect(n.b).toEqual({ from: 2, to: 3 });
  expect(n.d).toEqual({ from: 5, to: 6 });
  expect(n.e).toEqual({ from: 7, to: 8 });
  expect(n.h).toEqual({ from: 11, to: 11 });
});

test('normalize ignores case, spacing and edge punctuation', () => {
  expect(normalize('  Two  Hours. ')).toBe('two hours');
  expect(normalize('I’ve')).toBe("i've");
});

describe('analyzeQuiz', () => {
  const { payload, key } = splitTest({ sections: [{ id: 's', questions: [
    { id: 'g', type: 'gap', text: 'He {is} here and {was} there.' },
    { id: 'm', type: 'mcq', prompt: 'Pick', options: ['a', 'b', 'c'], answer: [1] },
    { id: 'o', type: 'open', prompt: 'Write', points: 5 },
  ] }] });
  const sub = (answers, status = 'submitted') => ({ status, data: { answers } });
  const res = analyzeQuiz(payload, key, [
    sub({ g: ['is', 'was'], m: [1] }),
    sub({ g: ['Are', ''], m: [0] }),
    sub({ g: ['are', 'was'], m: [0] }),
    sub({ g: ['x', 'x'], m: [2] }, 'in_progress'),
  ]);
  test('counts only submitted quizzes', () => expect(res.students).toBe(3));
  test('per-part wrong, blank and common wrong answers', () => {
    expect(res.questions.g.parts[0]).toEqual({ correct: 1, wrong: 2, blank: 0, answers: [['Are', 2]] });
    expect(res.questions.g.parts[1]).toEqual({ correct: 2, wrong: 0, blank: 1, answers: [] });
    expect(res.questions.g.wrong).toBe(2);
  });
  test('mcq answers are shown as option text', () => {
    expect(res.questions.m.parts[0].answers).toEqual([['a', 2]]);
    expect(res.questions.m.rate).toBeCloseTo(2 / 3);
  });
  test('open questions have no parts', () => expect(res.questions.o.parts).toEqual([]));
});

describe('SAT: numeric answers, style and explanations', () => {
  const satTest = { style: 'sat', sections: [{ id: 's', questions: [
    { id: 'n', type: 'short', numeric: true, prompt: 'r?', accepted: '24.5\n49/2', explanation: 'Because \\(2r=49\\).' },
    { id: 'k', type: 'short', numeric: true, prompt: 'slope?', accepted: '.3846\n0.385\n5/13' },
    { id: 'm', type: 'mcq', prompt: 'Pick', options: ['a', 'b'], answer: [1], explanation: 'B.' },
  ] }] };
  const { payload, key } = splitTest(satTest);
  it('keeps the style and hides explanations in the key', () => {
    expect(payload.style).toBe('sat');
    expect(JSON.stringify(payload)).not.toContain('Because');
    expect(key._rationale).toEqual({ n: 'Because \\(2r=49\\).', m: 'B.' });
  });
  it('accepts equal values in any listed form', () => {
    const mark = (id, v) => markTest(payload, key, { [id]: v }).items[id].earned;
    expect(mark('n', '49/2')).toBe(1);
    expect(mark('n', '24.50')).toBe(1);
    expect(mark('n', '24')).toBe(0);
    expect(mark('n', 'abc')).toBe(0);
    expect(mark('k', '0.3846')).toBe(1);
    expect(mark('k', '.385')).toBe(1);
    expect(mark('k', '3846')).toBe(0);
  });
  it('round-trips through joinTest', () => {
    const back = joinTest(payload, key);
    expect(back.style).toBe('sat');
    expect(back.sections[0].questions[0].explanation).toBe('Because \\(2r=49\\).');
  });
});
