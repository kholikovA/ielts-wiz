import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import Icon from '../ui/icons';

// Teacher dashboard — student performance across the cohort, from
// user_test_results joined to profiles. Test scores, per-section accuracy,
// score distribution, where students struggle, and a sortable roster with a
// per-student drill-down.
//
// NOTE: "question types missed" and "time spent" need richer capture than the
// results table currently stores (type_stats jsonb + duration_seconds). Those
// panels read those fields if present and otherwise show an "awaiting capture"
// state — see the team note in the PR.

const DAY = 86400000;
const daysAgo = (iso) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : Infinity);
const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch { return '—'; }
};
const fmtDuration = (s) => {
  if (s == null) return '—';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

// Standard IELTS Academic band conversions for a 40-question section.
const READING_BAND = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5]];
const LISTENING_BAND = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [11, 4], [8, 3.5], [6, 3], [4, 2.5]];
const sectionOf = (kind) => (kind || '').split('_')[0] || 'other';
const bandFor = (r) => {
  if (r.total !== 40) return null;
  const table = sectionOf(r.kind) === 'listening' ? LISTENING_BAND : READING_BAND;
  for (const [thr, band] of table) if (r.correct >= thr) return band;
  return null;
};

const weekBuckets = (rows, field, weeks = 12) => {
  const out = Array.from({ length: weeks }, () => 0);
  rows.forEach((r) => { const d = daysAgo(r[field]); if (Number.isFinite(d) && d < weeks * 7) out[weeks - 1 - Math.floor(d / 7)] += 1; });
  return out;
};

// --- primitives ------------------------------------------------------------

const Kpi = ({ label, value, sub, color = 'var(--text-primary)', icon }) => (
  <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      {icon && <Icon name={icon} size={15} style={{ color: 'var(--text-tertiary)' }} />}
      <span className="eyebrow">{label}</span>
    </div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{sub}</div>}
  </div>
);

const Panel = ({ title, hint, children }) => (
  <div className="card" style={{ padding: 'var(--space-5)' }}>
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <h3 className="h4" style={{ color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      {hint && <p className="body" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{hint}</p>}
    </div>
    {children}
  </div>
);

const BarList = ({ items, color = 'var(--purple-600)', max = 8, empty = 'No data yet.', fmt, suffix = '' }) => {
  if (!items.length) return <p className="body" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>{empty}</p>;
  const top = items.slice(0, max);
  const peak = Math.max(...top.map((i) => i[1]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {top.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '150px', flexShrink: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmt ? fmt(label) : label}</div>
          <div style={{ flex: 1, height: '10px', borderRadius: '999px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{ width: `${(value / peak) * 100}%`, height: '100%', background: color, borderRadius: '999px' }} />
          </div>
          <div style={{ width: '52px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{value}{suffix}</div>
        </div>
      ))}
    </div>
  );
};

const WeekChart = ({ buckets, color = 'var(--violet-500)' }) => {
  const peak = Math.max(...buckets, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '110px' }}>
      {buckets.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div title={`${v}`} style={{ width: '100%', height: `${(v / peak) * 100}%`, minHeight: v > 0 ? '3px' : '0', background: color, borderRadius: '4px 4px 0 0' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)' }}>{v}</div>
        </div>
      ))}
    </div>
  );
};

const th = { textAlign: 'left', padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
const td = { padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' };

// --- main ------------------------------------------------------------------

export default function AdminTeacher() {
  const [profiles, setProfiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ key: 'attempts', dir: 'desc' });
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, r] = await Promise.all([
        supabase.from('profiles').select('id, name, email, target_score'),
        supabase.from('user_test_results').select('*').order('completed_at', { ascending: false }),
      ]);
      if (p.error) setError(p.error.message); else setProfiles(p.data || []);
      if (!r.error) setResults(r.data || []);
      setLoading(false);
    })();
  }, []);

  const model = useMemo(() => {
    const pById = Object.fromEntries(profiles.map((p) => [p.id, p]));
    const withPct = results.map((r) => ({ ...r, pct: r.total ? r.correct / r.total : 0, band: bandFor(r), section: sectionOf(r.kind) }));

    // Per-student rollup
    const byUser = {};
    withPct.forEach((r) => {
      const u = (byUser[r.user_id] = byUser[r.user_id] || { user_id: r.user_id, attempts: [], });
      u.attempts.push(r);
    });
    const students = Object.values(byUser).map((u) => {
      const a = u.attempts;
      const prof = pById[u.user_id] || {};
      const avgPct = a.reduce((s, r) => s + r.pct, 0) / a.length;
      const bands = a.map((r) => r.band).filter((b) => b != null);
      const last = a.reduce((m, r) => (r.completed_at > m ? r.completed_at : m), '');
      return {
        user_id: u.user_id,
        name: prof.name || '(no name)',
        email: prof.email || u.user_id.slice(0, 8),
        target: prof.target_score,
        attempts: a.length,
        avgPct,
        bestBand: bands.length ? Math.max(...bands) : null,
        last,
        rows: a.slice().sort((x, y) => (y.completed_at > x.completed_at ? 1 : -1)),
      };
    });

    // Cohort
    const attempts7 = withPct.filter((r) => daysAgo(r.completed_at) <= 7).length;
    const cohortAvg = withPct.length ? Math.round((withPct.reduce((s, r) => s + r.pct, 0) / withPct.length) * 100) : null;
    const fullBands = withPct.map((r) => r.band).filter((b) => b != null);
    const avgBand = fullBands.length ? (fullBands.reduce((s, b) => s + b, 0) / fullBands.length) : null;

    // Distributions
    const buckets = [['< 50%', 0], ['50–59%', 0], ['60–69%', 0], ['70–79%', 0], ['80–89%', 0], ['90–100%', 0]];
    withPct.forEach((r) => {
      const p = r.pct * 100;
      const i = p < 50 ? 0 : p < 60 ? 1 : p < 70 ? 2 : p < 80 ? 3 : p < 90 ? 4 : 5;
      buckets[i][1] += 1;
    });

    // By section: average accuracy
    const secAgg = {};
    withPct.forEach((r) => { (secAgg[r.section] = secAgg[r.section] || []).push(r.pct); });
    const bySection = Object.entries(secAgg)
      .map(([k, arr]) => [k.charAt(0).toUpperCase() + k.slice(1), Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 100)])
      .sort((a, b) => b[1] - a[1]);

    // Per test: attempts + avg accuracy (lowest = hardest)
    const testAgg = {};
    withPct.forEach((r) => { const k = `${r.kind} · ${r.test_id}`; (testAgg[k] = testAgg[k] || []).push(r.pct); });
    const popular = Object.entries(testAgg).map(([k, arr]) => [k, arr.length]).sort((a, b) => b[1] - a[1]);
    const hardest = Object.entries(testAgg)
      .filter(([, arr]) => arr.length >= 1)
      .map(([k, arr]) => [k, Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 100)])
      .sort((a, b) => a[1] - b[1]);

    // Optional enriched fields (present once the capture pipeline is live)
    const durations = withPct.map((r) => r.duration_seconds).filter((d) => d != null);
    const avgDuration = durations.length ? durations.reduce((s, d) => s + d, 0) / durations.length : null;
    const typeMiss = {};
    let haveTypeStats = false;
    withPct.forEach((r) => {
      if (!r.type_stats) return;
      haveTypeStats = true;
      const ts = typeof r.type_stats === 'string' ? JSON.parse(r.type_stats) : r.type_stats;
      Object.entries(ts || {}).forEach(([type, st]) => {
        const cur = (typeMiss[type] = typeMiss[type] || { missed: 0, total: 0 });
        cur.missed += (st.total - st.correct) || 0;
        cur.total += st.total || 0;
      });
    });
    const typeMissed = Object.entries(typeMiss)
      .map(([t, v]) => [t, v.total ? Math.round((v.missed / v.total) * 100) : 0])
      .sort((a, b) => b[1] - a[1]);

    return {
      students, attempts7, cohortAvg, avgBand,
      buckets, bySection, popular, hardest,
      signupWeeks: weekBuckets(withPct, 'completed_at', 12),
      avgDuration, haveTypeStats, typeMissed,
      totalAttempts: withPct.length,
    };
  }, [profiles, results]);

  const sortedStudents = useMemo(() => {
    const s = model.students.slice();
    const { key, dir } = sort;
    s.sort((a, b) => {
      let av = a[key], bv = b[key];
      if (key === 'name') { av = (av || '').toLowerCase(); bv = (bv || '').toLowerCase(); }
      av = av == null ? -Infinity : av; bv = bv == null ? -Infinity : bv;
      return (av < bv ? -1 : av > bv ? 1 : 0) * (dir === 'asc' ? 1 : -1);
    });
    return s;
  }, [model.students, sort]);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

  if (loading) return <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (error) return <div className="panel panel-error"><p className="body" style={{ margin: 0 }}>Failed to load: {error}</p></div>;

  if (model.totalAttempts === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
        <Icon name="graduation" size={28} style={{ marginBottom: 'var(--space-3)' }} />
        <p className="body" style={{ margin: 0 }}>No test results yet. As students complete tests, their performance appears here.</p>
      </div>
    );
  }

  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--space-4)' }}>
        <Kpi label="Active students" value={model.students.length} sub="have taken ≥ 1 test" icon="user" />
        <Kpi label="Tests taken" value={model.totalAttempts} sub={`${model.attempts7} in last 7 days`} color="var(--violet-500)" icon="award" />
        <Kpi label="Cohort accuracy" value={model.cohortAvg != null ? `${model.cohortAvg}%` : '—'} sub="mean across all attempts" color="var(--blue-500)" icon="target" />
        <Kpi label="Avg band" value={model.avgBand != null ? model.avgBand.toFixed(1) : '—'} sub="full (40Q) tests only" color="var(--success)" icon="graduation" />
        <Kpi label="Avg time / test" value={fmtDuration(model.avgDuration)} sub={model.avgDuration == null ? 'awaiting capture' : 'per attempt'} color="var(--amber-400)" icon="clock" />
      </div>

      <Panel title="Tests taken over time" hint="Submissions per week, last 12 weeks">
        <WeekChart buckets={model.signupWeeks} />
      </Panel>

      <div style={grid2}>
        <Panel title="Score distribution" hint="Accuracy across all attempts">
          <BarList items={model.buckets} color="var(--violet-500)" max={6} suffix="" />
        </Panel>
        <Panel title="Accuracy by section" hint="Mean % correct per skill">
          <BarList items={model.bySection} color="var(--blue-500)" max={5} suffix="%" />
        </Panel>
        <Panel title="Where students struggle" hint="Lowest average score — hardest tests">
          <BarList items={model.hardest} color="var(--wrong, #dc2626)" max={6} suffix="%" />
        </Panel>
        <Panel title="Most-attempted tests" hint="Where the cohort spends its reps">
          <BarList items={model.popular} color="var(--purple-600)" max={6} />
        </Panel>
      </div>

      <Panel title="Question types missed most" hint={model.haveTypeStats ? '% of questions missed, by type' : 'Awaiting capture — see PR note'}>
        {model.haveTypeStats
          ? <BarList items={model.typeMissed} color="var(--wrong, #dc2626)" max={12} suffix="%" />
          : (
            <p className="body" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>
              Per-question-type results aren't stored yet. Add <code>type_stats</code> to the results pipeline
              (one DB column + a few lines in the test pages) and this populates automatically.
            </p>
          )}
      </Panel>

      {/* Roster */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: 'var(--space-5) var(--space-5) 0' }}>
          <h3 className="h4" style={{ color: 'var(--text-primary)', margin: 0 }}>Student roster</h3>
          <p className="body" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 var(--space-3)' }}>Click a row for their attempt history. Click a column to sort.</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={th} onClick={() => toggleSort('name')}>Student</th>
              <th style={{ ...th, textAlign: 'right' }} onClick={() => toggleSort('attempts')}>Tests</th>
              <th style={{ ...th, textAlign: 'right' }} onClick={() => toggleSort('avgPct')}>Avg %</th>
              <th style={{ ...th, textAlign: 'right' }} onClick={() => toggleSort('bestBand')}>Best band</th>
              <th style={{ ...th, textAlign: 'right' }} onClick={() => toggleSort('target')}>Target</th>
              <th style={{ ...th, textAlign: 'right' }} onClick={() => toggleSort('last')}>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((s) => (
              <React.Fragment key={s.user_id}>
                <tr
                  onClick={() => setOpenId(openId === s.user_id ? null : s.user_id)}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: openId === s.user_id ? 'var(--bg-secondary)' : 'transparent' }}
                >
                  <td style={{ ...td, color: 'var(--text-primary)' }}>
                    <Icon name={openId === s.user_id ? 'chevronDown' : 'chevronRight'} size={13} style={{ marginRight: 6, color: 'var(--text-tertiary)' }} />
                    {s.name}
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: 8, fontSize: 'var(--text-xs)' }}>{s.email}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{s.attempts}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: s.avgPct >= 0.7 ? 'var(--success)' : s.avgPct >= 0.5 ? 'var(--amber-400)' : 'var(--wrong, #dc2626)' }}>{Math.round(s.avgPct * 100)}%</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{s.bestBand != null ? s.bestBand.toFixed(1) : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{s.target != null ? s.target : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{fmtDate(s.last)}</td>
                </tr>
                {openId === s.user_id && (
                  <tr>
                    <td colSpan={6} style={{ padding: 0, background: 'var(--bg-secondary)' }}>
                      <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-4)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            {s.rows.map((r, i) => (
                              <tr key={i}>
                                <td style={{ ...td, color: 'var(--text-secondary)' }}>{r.kind} · {r.test_id}</td>
                                <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.correct}/{r.total}</td>
                                <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{Math.round(r.pct * 100)}%</td>
                                <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{r.band != null ? `band ${r.band.toFixed(1)}` : ''}</td>
                                <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{r.duration_seconds != null ? fmtDuration(r.duration_seconds) : ''}</td>
                                <td style={{ ...td, textAlign: 'right', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{fmtDate(r.completed_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
