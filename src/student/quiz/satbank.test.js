import { bankToQuiz, usedBankIds, satPaceMinutes } from './satbank';
import { splitTest, markTest } from './quiz';

const url = (s) => `https://cdn/x/${s}`;
const math = {
  id: '9d4270fe', test: 'math', domain: 'Algebra', skill: 'Linear functions', difficulty: 'Medium', type: 'mcq',
  content: { prompt_img: [{ src: '9d4270fe-q.png', w: 500, h: 40 }], options: [0, 1, 2, 3].map((i) => ({ img: [{ src: `o${i}.png`, w: 50, h: 10 }] })) },
  key: { answer: 2, rationale_img: [{ src: 'r-abc.png', w: 560, h: 120 }], note: 'Note: x' },
};
const rw = {
  id: '0147b080', test: 'rw', domain: 'Information and Ideas', skill: 'Command of Evidence', difficulty: 'Easy', type: 'mcq',
  content: { prompt: [{ img: [{ src: 't.png', w: 300, h: 90 }] }, 'Passage one.', 'Which choice?'], options: ['a', 'b', 'c', 'd'].map((t) => ({ text: t })) },
  key: { answer: 1, rationale: ['Choice B is the best answer.'] },
};
const spr = { ...math, id: 'f8fa0cf0', type: 'spr', content: { prompt_img: [{ src: 'p.png', w: 400, h: 30 }] }, key: { accepted: ['24.5', '49/2'], rationale_img: [] } };

test('math mcq: images with point widths, answer, note before the explanation', () => {
  const q = bankToQuiz(math, url);
  expect(q.id).toBe('q9d4270fe');
  expect(q.prompt).toBe('![](https://cdn/x/9d4270fe-q.png#w=500)');
  expect(q.options[2]).toBe('![](https://cdn/x/o2.png#w=50)');
  expect(q.answer).toEqual([2]);
  expect(q.explanation.startsWith('Note: x\n\n![](https://cdn/x/r-abc.png#w=560)')).toBe(true);
  expect(q.bank.skill).toBe('Linear functions');
});

test('reading and writing: passage and question split', () => {
  const q = bankToQuiz(rw, url);
  expect(q.passage).toBe('![](https://cdn/x/t.png#w=300)\n\nPassage one.');
  expect(q.prompt).toBe('Which choice?');
  expect(q.options).toEqual(['a', 'b', 'c', 'd']);
});

test('spr is a numeric short answer and marks by value', () => {
  const { payload, key } = splitTest({ style: 'sat', sections: [{ id: 's', questions: [bankToQuiz(spr, url), bankToQuiz(rw, url)] }] });
  expect(payload.sections[0].questions[0].bank.id).toBe('f8fa0cf0');
  expect(payload.sections[0].questions[1].passage).toContain('Passage one.');
  const m = markTest(payload, key, { qf8fa0cf0: '24.50', q0147b080: [1] });
  expect(m.earned).toBe(2);
});

test('used ids: assigned vs submitted', () => {
  const as = [{ kind: 'quiz', payload: { sections: [{ questions: [{ id: 'q9d4270fe' }, { id: 'x', bank: { id: '0147b080' } }] }] },
    assignment_recipients: [{ student_id: 's1' }], submissions: [] }];
  expect([...usedBankIds(as, ['s1'])].sort()).toEqual(['0147b080', '9d4270fe']);
  expect(usedBankIds(as, ['s2']).size).toBe(0);
  expect(usedBankIds(as, ['s1'], 'submitted').size).toBe(0);
});

test('pace', () => { expect(satPaceMinutes(20, 'math')).toBe(32); expect(satPaceMinutes(27, 'rw')).toBe(32); });
