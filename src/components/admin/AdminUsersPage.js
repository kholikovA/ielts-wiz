import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import SendEmailDialog from './SendEmailDialog';
import AdminAnalytics from './AdminAnalytics';
import AdminTeacher from './AdminTeacher';

// Admin-only view of every signup row, with filters + CSV export + (optional)
// transactional-email batch send. RLS already prevents non-admins from reading
// other rows, but we ALSO render an in-app "not authorised" panel for clarity.

const TARGET_BANDS = ['', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5+'];
const REFERRAL_SOURCES = ['', 'google', 'youtube', 'instagram', 'tiktok', 'friend', 'teacher', 'other'];
const PREP_DURATIONS = ['', 'just-started', 'less-1-month', '1-3-months', '3-6-months', '6-months-plus'];
const INACTIVE_DAYS = [
  { value: '',   label: 'Any activity' },
  { value: '7',  label: 'Inactive ≥ 7 days' },
  { value: '14', label: 'Inactive ≥ 14 days' },
  { value: '30', label: 'Inactive ≥ 30 days' },
  { value: '60', label: 'Inactive ≥ 60 days' },
  { value: '90', label: 'Inactive ≥ 90 days' },
];

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  } catch { return iso; }
};

const toCsv = (rows) => {
  const cols = ['email', 'name', 'target_score', 'prep_duration', 'referral_source', 'goals', 'created_at', 'last_sign_in_at', 'is_admin'];
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = Array.isArray(v) ? v.join('; ') : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => esc(r[c])).join(',')).join('\n');
  return header + '\n' + body;
};

const downloadCsv = (rows) => {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ielts-wiz-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminUsersPage = ({ setCurrentPage }) => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [view, setView] = useState('analytics'); // 'analytics' | 'users'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState('');
  const [referral, setReferral] = useState('');
  const [prep, setPrep] = useState('');
  const [neverSignedIn, setNeverSignedIn] = useState(false);
  const [inactiveDays, setInactiveDays] = useState('');

  // Email dialog
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    (async () => {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) setError(err.message);
      else setUsers(data || []);
      setLoading(false);
    })();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (search) {
        const s = search.toLowerCase();
        if (!(u.email?.toLowerCase().includes(s) || u.name?.toLowerCase().includes(s))) return false;
      }
      if (target && String(u.target_score) !== target) return false;
      if (referral && u.referral_source !== referral) return false;
      if (prep && u.prep_duration !== prep) return false;
      if (neverSignedIn && u.last_sign_in_at) return false;
      if (inactiveDays) {
        // Match if either: never signed in, OR last sign-in was N+ days ago.
        const n = parseInt(inactiveDays, 10);
        const cutoffMs = Date.now() - n * 24 * 60 * 60 * 1000;
        const lastMs = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
        if (lastMs > cutoffMs) return false;
      }
      return true;
    });
  }, [users, search, target, referral, prep, neverSignedIn, inactiveDays]);

  // Aggregate stats for the current filter result.
  const stats = useMemo(() => {
    const total = filtered.length;
    const confirmed = filtered.filter(u => u.last_sign_in_at).length;
    const sources = filtered.reduce((acc, u) => {
      const k = u.referral_source || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return { total, confirmed, sources };
  }, [filtered]);

  if (authLoading) {
    return (
      <div style={{ paddingTop: 200, textAlign: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page-shell">
        <div className="page-section" style={{ maxWidth: '600px' }}>
          <div className="panel panel-error" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Icon name="xCircle" size={32} style={{ color: 'var(--error)', marginBottom: 'var(--space-3)' }} />
            <h1 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              Not authorised
            </h1>
            <p className="body" style={{ marginBottom: 'var(--space-5)' }}>
              This page is admin-only. If you should have access, ask the project owner to set <code>is_admin = true</code> on your row in <code>public.profiles</code>.
            </p>
            <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('dashboard')}>
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <PageHeader
            eyebrow={view === 'analytics' ? 'Admin · Analytics' : view === 'teacher' ? 'Admin · Students' : 'Admin · Users'}
            title={view === 'analytics' ? 'How IELTS Wiz is doing.' : view === 'teacher' ? 'How your students are doing.' : 'Every signup, with filters.'}
            lead={view === 'analytics'
              ? 'Product analytics from your own data — signups, activation, audience, and test activity.'
              : view === 'teacher'
              ? 'Student performance — test scores, accuracy by section, where they struggle, and a per-student drill-down.'
              : 'Filter by target band, referral source, or sign-in status. Export the current view to CSV or hand it straight to the email batch.'}
          />
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('dashboard')}>
            <Icon name="arrowLeft" size={16} /> Dashboard
          </button>
        </div>

        {/* View tabs */}
        <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-lg)', marginBottom: 'var(--space-5)' }}>
          {[['analytics', 'Analytics', 'trending'], ['teacher', 'Students', 'graduation'], ['users', 'Users', 'user']].map(([key, label, icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className="btn btn-sm"
              style={{
                background: view === key ? 'var(--surface-1, var(--bg-card))' : 'transparent',
                color: view === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: view === key ? '1px solid var(--border-color)' : '1px solid transparent',
                boxShadow: view === key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Icon name={icon} size={14} /> {label}
            </button>
          ))}
        </div>

        {view === 'analytics' && <AdminAnalytics />}

        {view === 'teacher' && <AdminTeacher />}

        {view === 'users' && (<>
        {/* Stats strip */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-5)' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>In view</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {stats.total}<span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-base)', fontWeight: 500 }}> / {users.length}</span>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Signed in ≥ once</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--success)', lineHeight: 1 }}>
                {stats.confirmed}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Never signed in</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--amber-400)', lineHeight: 1 }}>
                {stats.total - stats.confirmed}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Top source</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {Object.entries(stats.sources).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Filters + actions */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              <label className="form-label">Search</label>
              <input type="text" className="form-input" placeholder="email or name…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Target band</label>
              <select className="form-select" value={target} onChange={(e) => setTarget(e.target.value)}>
                {TARGET_BANDS.map(t => <option key={t} value={t}>{t || 'Any'}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Referral source</label>
              <select className="form-select" value={referral} onChange={(e) => setReferral(e.target.value)}>
                {REFERRAL_SOURCES.map(s => <option key={s} value={s}>{s || 'Any'}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Prep duration</label>
              <select className="form-select" value={prep} onChange={(e) => setPrep(e.target.value)}>
                {PREP_DURATIONS.map(d => <option key={d} value={d}>{d || 'Any'}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Inactivity</label>
              <select className="form-select" value={inactiveDays} onChange={(e) => setInactiveDays(e.target.value)}>
                {INACTIVE_DAYS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={neverSignedIn} onChange={(e) => setNeverSignedIn(e.target.checked)} />
              Never signed in only
            </label>
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary" onClick={() => downloadCsv(filtered)} disabled={filtered.length === 0}>
              <Icon name="arrowRight" size={14} /> CSV ({filtered.length})
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setEmailOpen(true)} disabled={filtered.length === 0}>
              <Icon name="edit" size={14} /> Email {filtered.length}
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : error ? (
          <div className="panel panel-error">
            <p className="body" style={{ margin: 0 }}>Failed to load: {error}</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prep</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Joined</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No users match these filters.
                  </td></tr>
                ) : filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-primary)' }}>
                      {u.email}
                      {u.is_admin && <span className="pill" style={{ marginLeft: 8, fontSize: 10, padding: '1px 6px' }}>admin</span>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>{u.name || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{u.target_score || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>{u.referral_source || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>{u.prep_duration || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{formatDate(u.created_at)}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: u.last_sign_in_at ? 'var(--text-tertiary)' : 'var(--amber-400)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                      {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>)}
      </div>

      {emailOpen && (
        <SendEmailDialog
          recipients={filtered}
          onClose={() => setEmailOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
