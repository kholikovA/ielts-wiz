import React, { useState, useMemo } from 'react';
import { useLiveData, LiveBadge } from '../../hooks/useLiveData';
import { supabase } from '../../supabaseClient';
import Icon from '../ui/icons';

// Product analytics from our own Supabase data — signups, activation, audience
// breakdowns, and test activity. This is the "who are my users and what are
// they doing" view that Vercel's traffic analytics can't give us, because it's
// tied to real accounts and test results.

const DAY = 86400000;
const daysAgo = (iso) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : Infinity);

// Bucket rows into the last `weeks` calendar-week columns (oldest → newest).
const weekBuckets = (rows, field, weeks = 12) => {
  const out = Array.from({ length: weeks }, () => 0);
  rows.forEach((r) => {
    const d = daysAgo(r[field]);
    if (!Number.isFinite(d)) return;
    const w = Math.floor(d / 7);
    if (w >= 0 && w < weeks) out[weeks - 1 - w] += 1;
  });
  return out;
};

const countBy = (rows, keyFn) => {
  const m = {};
  rows.forEach((r) => {
    const k = keyFn(r);
    if (k === null || k === undefined || k === '') return;
    m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};

// --- small presentational pieces ------------------------------------------

const KpiCard = ({ label, value, sub, color = 'var(--text-primary)', icon }) => (
  <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      {icon && <Icon name={icon} size={15} style={{ color: 'var(--text-tertiary)' }} />}
      <span className="eyebrow">{label}</span>
    </div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color, lineHeight: 1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{sub}</div>}
  </div>
);

const BarList = ({ items, color = 'var(--purple-600)', empty = 'No data yet.', max = 8, formatLabel }) => {
  if (!items.length) return <p className="body" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', margin: 0 }}>{empty}</p>;
  const top = items.slice(0, max);
  const peak = Math.max(...top.map((i) => i[1]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {top.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '120px', flexShrink: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formatLabel ? formatLabel(label) : label}
          </div>
          <div style={{ flex: 1, height: '10px', borderRadius: '999px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{ width: `${(value / peak) * 100}%`, height: '100%', background: color, borderRadius: '999px' }} />
          </div>
          <div style={{ width: '40px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

const WeekChart = ({ buckets, color = 'var(--purple-600)' }) => {
  const peak = Math.max(...buckets, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
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

const Panel = ({ title, hint, children, span }) => (
  <div className="card" style={{ padding: 'var(--space-5)', gridColumn: span ? `span ${span}` : undefined }}>
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <h3 className="h4" style={{ color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      {hint && <p className="body" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{hint}</p>}
    </div>
    {children}
  </div>
);

// --- main view -------------------------------------------------------------

const PREP_LABELS = {
  'just-started': 'Just started', 'less-1-month': '< 1 month', '1-3-months': '1–3 months',
  '3-6-months': '3–6 months', '6-months-plus': '6+ months',
};

export default function AdminAnalytics() {
  const [profiles, setProfiles] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // Live: auto-refetch (debounced) when results change + on tab focus.
  const { loading, live } = useLiveData(async () => {
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_test_results').select('user_id, kind, test_id, correct, total, completed_at'),
    ]);
    if (p.error) setError(p.error.message);
    else setProfiles(p.data || []);
    // Results may be empty (or admin-read policy not yet applied) — that's fine.
    if (!r.error) setResults(r.data || []);
  }, { table: 'user_test_results', channel: 'admin-analytics' });

  const m = useMemo(() => {
    const total = profiles.length;
    const activated = profiles.filter((u) => u.last_sign_in_at).length;
    const new30 = profiles.filter((u) => daysAgo(u.created_at) <= 30).length;
    const new7 = profiles.filter((u) => daysAgo(u.created_at) <= 7).length;
    const active7 = profiles.filter((u) => daysAgo(u.last_sign_in_at) <= 7).length;
    const active30 = profiles.filter((u) => daysAgo(u.last_sign_in_at) <= 30).length;

    const recency = [
      ['Active ≤ 7 days', active7],
      ['8–30 days', profiles.filter((u) => { const d = daysAgo(u.last_sign_in_at); return d > 7 && d <= 30; }).length],
      ['31–90 days', profiles.filter((u) => { const d = daysAgo(u.last_sign_in_at); return d > 30 && d <= 90; }).length],
      ['90+ days / never', profiles.filter((u) => daysAgo(u.last_sign_in_at) > 90).length],
    ];

    const goals = {};
    profiles.forEach((u) => (Array.isArray(u.goals) ? u.goals : []).forEach((g) => { goals[g] = (goals[g] || 0) + 1; }));

    // Test results
    const completions = results.length;
    const testers = new Set(results.map((r) => r.user_id)).size;
    const comp7 = results.filter((r) => daysAgo(r.completed_at) <= 7).length;
    const accAll = results.filter((r) => r.total > 0);
    const avgAcc = accAll.length ? Math.round((accAll.reduce((s, r) => s + r.correct / r.total, 0) / accAll.length) * 100) : null;
    const bySection = countBy(results, (r) => (r.kind || '').split('_')[0] || 'other');
    const byTest = countBy(results, (r) => `${r.kind} · ${r.test_id}`);

    return {
      total, activated, new30, new7, active7, active30, recency,
      activationRate: total ? Math.round((activated / total) * 100) : 0,
      signupWeeks: weekBuckets(profiles, 'created_at', 12),
      referrals: countBy(profiles, (u) => u.referral_source || 'unknown'),
      bands: countBy(profiles, (u) => (u.target_score != null ? String(u.target_score) : null)).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])),
      preps: countBy(profiles, (u) => u.prep_duration),
      goals: Object.entries(goals).sort((a, b) => b[1] - a[1]),
      completions, testers, comp7, avgAcc, bySection, byTest,
      compWeeks: weekBuckets(results, 'completed_at', 12),
    };
  }, [profiles, results]);

  if (loading) {
    return <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }
  if (error) {
    return <div className="panel panel-error"><p className="body" style={{ margin: 0 }}>Failed to load: {error}</p></div>;
  }

  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LiveBadge live={live} />
      </div>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--space-4)' }}>
        <KpiCard label="Total users" value={m.total} icon="user" />
        <KpiCard label="Activated" value={`${m.activationRate}%`} sub={`${m.activated} signed in ≥ once`} color="var(--success)" icon="checkCircle" />
        <KpiCard label="New · 30 days" value={m.new30} sub={`${m.new7} in last 7`} color="var(--purple-600)" icon="trending" />
        <KpiCard label="Active · 7 days" value={m.active7} sub={`${m.active30} in last 30`} color="var(--blue-500)" icon="zap" />
        <KpiCard label="Tests completed" value={m.completions} sub={m.testers ? `${m.testers} unique testers` : 'awaiting data'} color="var(--violet-500)" icon="award" />
        <KpiCard label="Avg accuracy" value={m.avgAcc != null ? `${m.avgAcc}%` : '—'} sub={m.comp7 ? `${m.comp7} in last 7 days` : 'awaiting data'} color="var(--amber-400)" icon="target" />
      </div>

      <Panel title="Signups over time" hint="New profiles per week, last 12 weeks (oldest → newest)">
        <WeekChart buckets={m.signupWeeks} />
      </Panel>

      <div style={grid2}>
        <Panel title="Referral sources" hint="How users say they found IELTS Wiz">
          <BarList items={m.referrals} color="var(--purple-600)" />
        </Panel>
        <Panel title="Target band" hint="Self-reported goal at signup">
          <BarList items={m.bands} color="var(--violet-500)" formatLabel={(b) => `Band ${b}`} />
        </Panel>
        <Panel title="Prep timeline" hint="How long they've been preparing">
          <BarList items={m.preps} color="var(--blue-500)" formatLabel={(p) => PREP_LABELS[p] || p} />
        </Panel>
        <Panel title="Last-seen recency" hint="Distribution of last sign-in">
          <BarList items={m.recency} color="var(--green-500)" max={4} />
        </Panel>
      </div>

      {m.goals.length > 0 && (
        <Panel title="Goals" hint="What users picked at signup (multi-select)">
          <BarList items={m.goals} color="var(--purple-600)" max={10} />
        </Panel>
      )}

      {/* Test activity */}
      <div style={{ marginTop: 'var(--space-2)' }}>
        <h3 className="h4" style={{ color: 'var(--text-primary)', margin: '0 0 var(--space-1)' }}>Test activity</h3>
        <p className="body" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '0 0 var(--space-4)' }}>
          From <code>user_test_results</code>. {m.completions === 0 && 'Empty until completed-test results start syncing to Supabase.'}
        </p>
      </div>

      {m.completions === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
          <Icon name="bookOpen" size={28} style={{ marginBottom: 'var(--space-3)' }} />
          <p className="body" style={{ margin: 0 }}>No test results recorded yet.</p>
        </div>
      ) : (
        <>
          <Panel title="Completions over time" hint="Tests submitted per week, last 12 weeks">
            <WeekChart buckets={m.compWeeks} color="var(--violet-500)" />
          </Panel>
          <div style={grid2}>
            <Panel title="By section" hint="Reading / Listening / …">
              <BarList items={m.bySection} color="var(--violet-500)" max={6}
                formatLabel={(s) => s.charAt(0).toUpperCase() + s.slice(1)} />
            </Panel>
            <Panel title="Most-attempted tests" hint="kind · test id">
              <BarList items={m.byTest} color="var(--blue-500)" max={8} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
