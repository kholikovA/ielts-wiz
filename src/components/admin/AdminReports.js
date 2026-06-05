import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// Student problem reports filed from the reading results page (test_reports).
// Admin-only read is enforced by RLS (is_admin_user).
const fmtDate = (s) => { try { return new Date(s).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return s; } };

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [emails, setEmails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [r, p] = await Promise.all([
        supabase.from('test_reports').select('id, created_at, user_id, kind, test_id, message, context').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, email'),
      ]);
      if (r.error) setError(r.error.message);
      else setReports(r.data || []);
      if (!p.error) { const m = {}; (p.data || []).forEach((u) => { m[u.id] = u.email; }); setEmails(m); }
      setLoading(false);
    })();
  }, []);

  const muted = { color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' };
  if (loading) return <div style={{ padding: 'var(--space-6)', ...muted }}>Loading reports…</div>;
  if (error) return <div style={{ padding: 'var(--space-6)', color: '#dc2626' }}>Couldn't load reports: {error}</div>;
  if (!reports.length) return <div style={{ padding: 'var(--space-6)', ...muted }}>No reports yet. When a student hits “Report” on a result, it shows up here.</div>;

  return (
    <div>
      <p style={{ ...muted, marginBottom: 'var(--space-4)' }}>{reports.length} report{reports.length === 1 ? '' : 's'}, newest first.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {reports.map((r) => {
          const meta = [r.test_id, r.kind, r.context?.band != null ? `band ${r.context.band}` : null, r.context?.correct != null ? `${r.context.correct}/${r.context.total}` : null].filter(Boolean).join(' · ');
          return (
            <div key={r.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: 'var(--space-4)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{meta || '—'}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{fmtDate(r.created_at)}</span>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{r.message}</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{emails[r.user_id] || (r.user_id ? `${r.user_id.slice(0, 8)}…` : 'anonymous')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
