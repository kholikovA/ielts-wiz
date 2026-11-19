import { skillReport, classReport, bandOf } from './satDiagnostic';
import { splitTest } from './quiz';

const q = (id, domain, skill, difficulty, answer) => ({
  id, type: 'mcq', prompt: 'p', options: ['a', 'b', 'c', 'd'], answer: [answer],
  bank: { id, test: 'math', domain, skill, difficulty },
});
const { payload, key } = splitTest({ style: 'sat', sections: [{ id: 'sat', questions: [
  q('q1', 'Algebra', 'Linear functions', 'Easy', 0),
  q('q2', 'Algebra', 'Linear equations in one variable', 'Medium', 1),
  q('q3', 'Algebra', 'Linear functions', 'Hard', 2),
  q('q4', 'Geometry and Trigonometry', 'Circles', 'Hard', 3),
] }] });
payload.subject = 'math';

describe('bandOf', () => {
  it('uses 80% and 50% cut-offs', () => {
    expect(bandOf(0.8)).toBe('strong');
    expect(bandOf(0.5)).toBe('developing');
    expect(bandOf(0.49)).toBe('priority');
  });
});

describe('skillReport', () => {
  const items = { q1: { earned: 1, possible: 1 }, q2: { earned: 0, possible: 1 }, q3: { earned: 0, possible: 1 }, q4: { earned: 1, possible: 1 } };
  const r = skillReport(payload, items);
  it('groups skills in College Board order', () => {
    expect(r.domains.map((d) => d.domain)).toEqual(['Algebra', 'Geometry and Trigonometry']);
    expect(r.domains[0].skills.map((s) => s.skill)).toEqual(['Linear equations in one variable', 'Linear functions']);
  });
  it('rates skills and lists priorities', () => {
    expect(r.correct).toBe(2);
    expect(r.skills.find((s) => s.skill === 'Linear functions')).toMatchObject({ correct: 1, total: 2, band: 'developing' });
    expect(r.priorities.map((s) => s.skill)).toEqual(['Linear equations in one variable']);
  });
  it('weights the estimate by difficulty and keeps it in 200-800', () => {
    // weighted share = (1 + 2) / (1 + 1.5 + 2 + 2) = 0.4615 -> 477 -> 480
    expect(r.estimate).toEqual({ low: 440, high: 520 });
    expect(skillReport(payload, {}).estimate).toEqual({ low: 200, high: 240 });
  });
  it('returns null without bank metadata', () => {
    expect(skillReport({ sections: [{ questions: [{ id: 'x' }] }] }, {})).toBeNull();
  });
});

describe('classReport', () => {
  it('marks each student and averages skills, weakest first', () => {
    const c = classReport(payload, key, [
      { id: 's1', name: 'A', answers: { q1: [0], q2: [1], q3: [2], q4: [3] } },
      { id: 's2', name: 'B', answers: {} },
    ]);
    expect(c.students.map((s) => s.report.correct)).toEqual([4, 0]);
    expect(c.skills[0].correct / c.skills[0].total).toBe(0.5);
  });
});
