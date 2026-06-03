import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import { prefetchPage } from '../../lib/prefetch';

// Full Test Practice catalogue — complete 60-minute, 3-passage exams (40 Q)
// delivered as the standalone interactive HTML (same engine as Part Practice
// and Cambridge, but a full mock). Add a test by dropping its built HTML in
// public/reading/ and appending an entry here.

const TESTS = [
  {
    id: 'full_volume9_test2',
    title: 'Volume 9 — Test 2',
    note: 'Academic · Reading',
    passages: [
      'Andrew Carnegie: industrialist and philanthropist',
      'Translating: a key to international understanding?',
      'The mystery of Easter Island',
    ],
  },
];

const testHref = (id) => `/reading/${id}.html`;

export default function FullView({ setSubPage, setCurrentPage }) {
  const { user } = useAuth();

  const handleAuthRequired = (e) => {
    if (!user) {
      e.preventDefault();
      const next = e.currentTarget.getAttribute('href') || '';
      setCurrentPage('login');
      if (next.startsWith('/')) {
        window.history.replaceState({}, '', `/login?next=${encodeURIComponent(next)}`);
      }
    }
  };

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setSubPage('hub')}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <Icon name="arrowLeft" size={14} /> Reading hub
        </button>

        <PageHeader
          eyebrow="Reading · Full Test"
          title={<>The 60-minute mock, <span className="gradient-text">end to end.</span></>}
          lead="A complete Reading test under exam conditions: three passages, 40 questions, one timer, and a Cambridge band score at the end — the full split-pane interface with highlighter and auto-grading."
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-6)',
        }}>
          {TESTS.map((test) => (
            <a
              key={test.id}
              href={testHref(test.id)}
              onClick={handleAuthRequired}
              onMouseEnter={() => prefetchPage(testHref(test.id))}
              className="card card-interactive"
              style={{
                textDecoration: 'none',
                padding: 'var(--space-5)',
                border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 className="h4" style={{ color: 'var(--text-primary)', margin: 0 }}>{test.title}</h4>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  40 Q · 60 min
                </span>
              </div>
              <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {test.passages.map((p, i) => (
                  <li key={i} className="body" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p}</li>
                ))}
              </ol>
              <div style={{
                marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-color)',
                color: 'var(--purple-600)', fontSize: 'var(--text-sm)', fontWeight: 600,
              }}>
                Start full test <Icon name="arrowRight" size={15} style={{ marginLeft: '4px' }} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
