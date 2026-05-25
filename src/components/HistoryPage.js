import React, { useState, useMemo } from 'react';
import PageHeader from './ui/PageHeader';
import Icon from './ui/icons';
import SubNav from './ui/SubNav';
import { getActivity, getStatsByKind, labelForKind, KIND_LABELS } from '../lib/progressStore';

const FILTERS = [
  { id: 'all',        label: 'All' },
  { id: 'listening',  label: 'Listening' },
  { id: 'reading_p1', label: 'Reading 1' },
  { id: 'reading_p2', label: 'Reading 2' },
  { id: 'reading_p3', label: 'Reading 3' },
  { id: 'grammar',    label: 'Grammar' },
];

const formatDate = (iso) => {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return iso; }
};

const scoreColor = (ratio) =>
  ratio >= 0.85 ? 'var(--success)' :
  ratio >= 0.6  ? 'var(--amber-400)' :
                  'var(--error)';

const Sparkline = ({ ratios }) => {
  if (!ratios || ratios.length < 2) return null;
  const w = 80, h = 24, pad = 2;
  const points = ratios.map((r, i) => {
    const x = pad + (i / (ratios.length - 1)) * (w - 2 * pad);
    const y = h - pad - r * (h - 2 * pad);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--purple-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const HistoryPage = ({ setCurrentPage }) => {
  const [filter, setFilter] = useState('all');
  const all = useMemo(() => getActivity().slice().reverse(), []); // newest first

  const filtered = filter === 'all' ? all : all.filter(e => e.t === filter);

  // Per-section stats summary (top strip).
  const sectionStats = useMemo(() => {
    return Object.keys(KIND_LABELS)
      .map(kind => ({ kind, label: KIND_LABELS[kind], ...getStatsByKind(kind) }))
      .filter(s => s.attempts > 0);
  }, []);

  // Sparkline data per kind — chronological order of ratios for the line.
  const trendsByKind = useMemo(() => {
    const out = {};
    sectionStats.forEach(s => {
      const ratios = getActivity()
        .filter(e => e.t === s.kind && e.total > 0)
        .map(e => e.correct / e.total);
      out[s.kind] = ratios;
    });
    return out;
  }, [sectionStats]);

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="page-section" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <PageHeader
            eyebrow="History"
            title={<>Every test you've <span className="gradient-text">put in the bag.</span></>}
            lead="Your complete practice log — filterable by skill, with best score and trend lines per section."
          />
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('dashboard')}>
            <Icon name="arrowLeft" size={16} /> Dashboard
          </button>
        </div>

        {/* Empty state */}
        {all.length === 0 ? (
          <div className="panel panel-info" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Icon name="trending" size={32} style={{ color: 'var(--purple-400)', marginBottom: 'var(--space-3)' }} />
            <h2 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              No tests yet
            </h2>
            <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
              Complete your first practice test and you'll see your full history here — every score, every trend, every streak.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setCurrentPage('listening')}>
              Take your first test <Icon name="arrowRight" size={16} />
            </button>
          </div>
        ) : (
          <>
            {/* Per-section stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {sectionStats.map(s => {
                const bestPct = Math.round(s.best * 100);
                const avgPct = Math.round(s.avg * 100);
                return (
                  <div key={s.kind} className="card">
                    <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>{s.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>BEST</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: scoreColor(s.best), lineHeight: 1 }}>
                          {bestPct}%
                        </div>
                      </div>
                      <Sparkline ratios={trendsByKind[s.kind]} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-2)' }}>
                      <span>Avg {avgPct}%</span>
                      <span>{s.attempts} attempt{s.attempts === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter strip */}
            <SubNav
              items={FILTERS}
              value={filter}
              onChange={setFilter}
            />

            {/* Activity list */}
            <div className="card" style={{ padding: 0, marginTop: 'calc(-1 * var(--space-3))' }}>
              {filtered.length === 0 ? (
                <p className="body" style={{ padding: 'var(--space-6)', textAlign: 'center', margin: 0 }}>
                  No entries match this filter.
                </p>
              ) : (
                <div role="table">
                  {filtered.map((e, i) => {
                    const ratio = e.total > 0 ? e.correct / e.total : 0;
                    return (
                      <div key={i} role="row" style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                        padding: 'var(--space-4) var(--space-5)',
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                      }}>
                        <div style={{ width: 90, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                          {formatDate(e.d)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                            {labelForKind(e.t)}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            Test {e.id}
                          </div>
                        </div>
                        <div style={{ minWidth: 80, textAlign: 'right', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: scoreColor(ratio), fontSize: 'var(--text-lg)' }}>
                            {e.correct}
                          </span>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>/ {e.total}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
