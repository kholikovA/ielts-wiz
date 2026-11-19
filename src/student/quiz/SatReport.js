import React, { useMemo } from 'react';
import { BANDS, skillReport, classReport } from './satDiagnostic';
import { SAT_TESTS } from './satbank';

const pct = (c, t) => (t ? Math.round((100 * c) / t) : 0);

function Chip({ band }) {
  return <span className={`sdx-chip is-${band}`}>{BANDS[band].label}</span>;
}

function Bar({ correct, total, band }) {
  return <span className="sdx-bar"><span className={`is-${band}`} style={{ width: `${pct(correct, total)}%` }} /></span>;
}

/** Student result: estimate, domains, every skill rated, priorities first. */
export function SatSkillReport({ payload, marks }) {
  const r = useMemo(() => (marks ? skillReport(payload, marks.items) : null), [payload, marks]);
  if (!r) return null;
  const subject = SAT_TESTS[r.test] || 'SAT';
  return (
    <section className="card sdx" aria-label="Diagnostic report">
      <div className="sdx-head">
        <div>
          <span className="eyebrow">Diagnostic report</span>
          <h2 className="h3">{subject}</h2>
        </div>
        <div className="sdx-est">
          <strong className="hub-num">{r.estimate.low}–{r.estimate.high}</strong>
          <small>Estimated section score (out of 800)</small>
        </div>
      </div>

      {r.priorities.length > 0 ? (
        <div className="sdx-focus">
          <strong>Work on these first</strong>
          <ul>{r.priorities.map((s) => <li key={s.skill}>{s.skill} <span className="hub-num">({s.correct}/{s.total})</span></li>)}</ul>
        </div>
      ) : (
        <div className="sdx-focus is-ok"><strong>No priority skills.</strong> Every skill scored 50% or more.</div>
      )}

      <div className="sdx-domains">
        {r.domains.map((d) => (
          <div key={d.domain} className="sdx-domain">
            <div className="sdx-domain-head">
              <h3>{d.domain}</h3>
              <span className="hub-num">{d.correct}/{d.total}</span>
            </div>
            <Bar correct={d.correct} total={d.total} band={d.band} />
            <table className="sdx-skills">
              <tbody>
                {d.skills.map((s) => (
                  <tr key={s.skill}>
                    <td>{s.skill}</td>
                    <td className="hub-num">{s.correct}/{s.total}</td>
                    <td><Chip band={s.band} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <p className="form-help sdx-note">
        Strong = 80% or more · Developing = 50–79% · Priority = below 50%. Most skills have one to three questions,
        so treat each rating as a starting point. The score range is a rough estimate from this short test, not an official SAT score.
      </p>
    </section>
  );
}

/** Teacher assignment page: each student's estimate and priorities, plus class skill averages. */
export function SatClassReport({ a }) {
  const data = useMemo(() => {
    if (!a.quizKey) return null;
    const names = new Map(a.recipients.map((r) => [r.id, r.name || r.email || 'Student']));
    const subs = a.submissions.filter((s) => s.status === 'submitted' && names.has(s.student_id));
    return classReport(a.payload, a.quizKey, subs.map((s) => ({ id: s.student_id, name: names.get(s.student_id), answers: s.data?.answers, manual: s.marking?.manual })));
  }, [a]);
  if (!data) return null;
  if (!data.students.length) {
    return <section className="card sdx"><span className="eyebrow">Diagnostic report</span><p className="body">Each student’s estimated score and priority skills appear here once they submit.</p></section>;
  }
  const students = [...data.students].sort((x, y) => y.report.correct - x.report.correct || x.name.localeCompare(y.name));
  return (
    <section className="card sdx" aria-label="Class diagnostic report">
      <div className="sdx-head">
        <div><span className="eyebrow">Diagnostic report</span><h2 className="h3">{SAT_TESTS[students[0].report.test] || 'SAT'} · {students.length} submitted</h2></div>
      </div>
      <div className="sdx-table-wrap">
        <table className="sdx-class">
          <thead><tr><th>Student</th><th>Correct</th><th>Estimate</th><th>Priority skills</th></tr></thead>
          <tbody>
            {students.map(({ id, name, report }) => (
              <tr key={id}>
                <td><strong>{name}</strong></td>
                <td className="hub-num">{report.correct}/{report.total}</td>
                <td className="hub-num">{report.estimate.low}–{report.estimate.high}</td>
                <td>{report.priorities.length ? report.priorities.map((s) => <span key={s.skill} className="sdx-chip is-priority sdx-tag">{s.skill}</span>) : <span className="sdx-muted">None</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="sdx-sub">Class skill averages <small>(weakest first)</small></h3>
      <div className="sdx-avg">
        {data.skills.map((s) => (
          <div key={s.skill} className="sdx-avg-row">
            <span>{s.skill}</span>
            <span className="hub-num">{pct(s.correct, s.total)}%</span>
            <Bar correct={s.correct} total={s.total} band={s.band} />
          </div>
        ))}
      </div>
    </section>
  );
}
