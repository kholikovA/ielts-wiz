import bank from '../../data/revision/q1-revision.json';
import { validateBank, normaliseGap, isCorrect, buildRun, score, saveBest, readBest } from './revision';

describe('Q1 revision bank', () => {
  it('passes every bank check', () => {
    expect(validateBank(bank)).toEqual([]);
  });

  it('has questions for both groups', () => {
    expect(bank.questions.filter((q) => q.group === 'junior')).toHaveLength(42);
    expect(bank.questions.filter((q) => q.group === 'senior')).toHaveLength(40);
  });

  it('catches broken questions', () => {
    const broken = {
      ...bank,
      questions: [
        { id: 'X1', group: 'junior', topic: 'j-future', type: 'mc', prompt: 'a', options: ['x', 'y'], answer: 'z', explain: 'e' },
        { id: 'X1', group: 'junior', topic: 'j-future', type: 'gap', prompt: 'no gap', answer: ['a'], explain: 'e' },
        { id: 'X2', group: 'junior', topic: 'j-reading', type: 'tf', passage: 'nope', prompt: 'a', options: ['True', 'False'], answer: 'True', explain: 'e' },
      ],
    };
    const problems = validateBank(broken).join('\n');
    expect(problems).toMatch(/X1: answer appears 0 times/);
    expect(problems).toMatch(/X1: duplicate id/);
    expect(problems).toMatch(/X1: gap prompt has no ___/);
    expect(problems).toMatch(/X2: passage "nope" does not exist/);
  });
});

describe('gap checking', () => {
  const j04 = bank.questions.find((q) => q.id === 'J04');
  it('normalises case, spaces, curly apostrophes and a final full stop', () => {
    expect(normaliseGap('  Will   RAIN. ')).toBe('will rain');
    expect(normaliseGap('’ll rain')).toBe("'ll rain");
    expect(isCorrect(j04, '  Will   rain.')).toBe(true);
    expect(isCorrect(j04, '’ll rain')).toBe(true);
    expect(isCorrect(j04, 'rains')).toBe(false);
    expect(isCorrect(j04, '')).toBe(false);
  });
});

describe('buildRun', () => {
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  it('keeps reading questions together and in order, and never shuffles tf options', () => {
    for (let i = 0; i < 20; i += 1) {
      const run = buildRun(bank, { group: 'senior', rand });
      const ids = run.map((r) => r.q.id);
      const start = ids.indexOf('S37');
      expect(ids.slice(start, start + 4)).toEqual(['S37', 'S38', 'S39', 'S40']);
      run.filter((r) => r.q.type === 'tfng').forEach((r) => expect(r.options).toEqual(r.q.options));
      run.filter((r) => r.q.type === 'mc').forEach((r) => expect([...r.options].sort()).toEqual([...r.q.options].sort()));
    }
  });

  it('filters by topic and by id', () => {
    expect(buildRun(bank, { group: 'junior', topics: ['j-modals'] }).map((r) => r.q.topic)).toEqual(Array(5).fill('j-modals'));
    expect(buildRun(bank, { group: 'junior', ids: ['J01', 'J40'] })).toHaveLength(2);
  });
});

describe('score', () => {
  it('breaks the score down by topic and lists weak topics', () => {
    const run = buildRun(bank, { group: 'junior', topics: ['j-future', 'j-modals'] });
    const answers = {};
    run.forEach(({ q }) => { if (q.topic === 'j-modals') answers[q.id] = Array.isArray(q.answer) ? q.answer[0] : q.answer; });
    const r = score(bank, run, answers);
    expect(r.correct).toBe(5);
    expect(r.total).toBe(10);
    expect(r.pct).toBe(50);
    expect(r.byTopic.map((t) => [t.key, t.correct, t.total])).toEqual([['j-future', 0, 5], ['j-modals', 5, 5]]);
    expect(r.weak.map((t) => t.key)).toEqual(['j-future']);
    expect(r.wrongIds).toHaveLength(5);
  });
});

describe('best score', () => {
  beforeEach(() => localStorage.clear());
  it('keeps the best result per group', () => {
    expect(saveBest('q1', 'u1', 'junior', { correct: 20, total: 42, pct: 48 })).toBe(true);
    expect(saveBest('q1', 'u1', 'junior', { correct: 10, total: 42, pct: 24 })).toBe(false);
    expect(saveBest('q1', 'u1', 'junior', { correct: 30, total: 42, pct: 71 })).toBe(true);
    expect(readBest('q1', 'u1').junior.pct).toBe(71);
    expect(readBest('q1', 'u2')).toEqual({});
  });
  it('survives blocked storage', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(readBest('q1', 'u1')).toEqual({});
    spy.mockRestore();
  });
});
