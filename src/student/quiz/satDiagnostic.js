// SAT diagnostic report: per-domain and per-skill results, priority skills and a rough
// section score estimate. Used when an SAT quiz has payload.diagnostic (questions carry
// bank metadata: { test, domain, skill, difficulty }).
import { SAT_DOMAINS } from './satbank';
import { markTest } from './quiz';

const WEIGHT = { Easy: 1, Medium: 1.5, Hard: 2 };
export const BANDS = {
  strong: { label: 'Strong', min: 0.8 },
  developing: { label: 'Developing', min: 0.5 },
  priority: { label: 'Priority', min: 0 },
};
export const bandOf = (share) => (share >= BANDS.strong.min ? 'strong' : share >= BANDS.developing.min ? 'developing' : 'priority');

/** A question counts as correct only when it earned full marks. */
export const fullMarks = (item) => Boolean(item && item.possible > 0 && item.earned === item.possible);

function ordered(test, found) {
  // Domains and skills in College Board order; anything unknown goes last.
  const out = [];
  const known = SAT_DOMAINS[test] || {};
  Object.entries(known).forEach(([domain, skills]) => {
    const d = found.get(domain);
    if (!d) return;
    const listed = skills.filter((s) => d.skills.has(s)).map((s) => d.skills.get(s));
    const extra = [...d.skills.values()].filter((s) => !skills.includes(s.skill));
    out.push({ ...d, skills: [...listed, ...extra] });
    found.delete(domain);
  });
  found.forEach((d) => out.push({ ...d, skills: [...d.skills.values()] }));
  return out;
}

/** payload + marks.items -> report, or null when the quiz has no bank metadata. */
export function skillReport(payload, items) {
  const qs = (payload?.sections || []).flatMap((s) => s.questions).filter((q) => q.bank?.skill);
  if (!qs.length) return null;
  const test = payload.subject || qs[0].bank.test || 'math';
  const found = new Map();
  let correct = 0; let wc = 0; let wt = 0;
  qs.forEach((q) => {
    const ok = fullMarks(items?.[q.id]);
    const w = WEIGHT[q.bank.difficulty] || 1;
    wt += w; if (ok) { wc += w; correct += 1; }
    const domain = q.bank.domain || 'Other';
    if (!found.has(domain)) found.set(domain, { domain, correct: 0, total: 0, skills: new Map() });
    const d = found.get(domain);
    d.total += 1; if (ok) d.correct += 1;
    if (!d.skills.has(q.bank.skill)) d.skills.set(q.bank.skill, { skill: q.bank.skill, domain, correct: 0, total: 0 });
    const s = d.skills.get(q.bank.skill);
    s.total += 1; if (ok) s.correct += 1;
  });
  const domains = ordered(test, found).map((d) => ({
    ...d, band: bandOf(d.correct / d.total), skills: d.skills.map((s) => ({ ...s, band: bandOf(s.correct / s.total) })),
  }));
  const skills = domains.flatMap((d) => d.skills);
  const mid = Math.round((200 + 600 * (wt ? wc / wt : 0)) / 10) * 10;
  return {
    test, correct, total: qs.length,
    estimate: { low: Math.max(200, mid - 40), high: Math.min(800, mid + 40) },
    domains, skills,
    priorities: skills.filter((s) => s.band === 'priority').sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total),
  };
}

/** Teacher view: one report per submitted student plus class totals per skill. */
export function classReport(payload, key, students) {
  const done = students.map((st) => {
    const marks = markTest(payload, key, st.answers || {}, st.manual || {});
    return { ...st, report: skillReport(payload, marks.items) };
  }).filter((st) => st.report);
  if (!done.length) return { students: [], skills: [] };
  const totals = new Map();
  done.forEach(({ report }) => report.skills.forEach((s) => {
    const t = totals.get(s.skill) || { skill: s.skill, domain: s.domain, correct: 0, total: 0 };
    t.correct += s.correct; t.total += s.total;
    totals.set(s.skill, t);
  }));
  const skills = [...totals.values()].map((s) => ({ ...s, band: bandOf(s.correct / s.total) }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total);
  return { students: done, skills };
}
