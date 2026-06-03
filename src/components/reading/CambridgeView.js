import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import { prefetchPage } from '../../lib/prefetch';

// Cambridge IELTS catalogue — official-book reading tests delivered as the
// standalone, full 3-passage interactive HTML (same engine as Part Practice,
// but a complete 40-question / 60-minute exam per test). For now this holds
// Cambridge 20 Reading; listening/writing/speaking and earlier books follow.

const BOOKS = [
  {
    id: 'cambridge20',
    label: 'Cambridge IELTS 20',
    note: 'Academic · Reading',
    accent: 'var(--violet-500)',
    tests: [
      { id: 1, title: 'Test 1', passages: ['The kākāpō', 'Return of the elm', 'How stress affects our judgement'] },
      { id: 2, title: 'Test 2', passages: ['Manatees', 'Procrastination', 'Invasion of the Robot Umpires'] },
      { id: 3, title: 'Test 3', passages: ['Frozen Food', "Can the planet's coral reefs be saved?", 'Robots and us'] },
      { id: 4, title: 'Test 4', passages: ["Georgia O'Keeffe", 'Adapting to the effects of climate change', 'A new role for livestock guard dogs'] },
    ],
  },
];

const testHref = (bookId, testId) => `/reading/${bookId}_test${testId}.html`;

export default function CambridgeView({ setSubPage, setCurrentPage }) {
  const { user } = useAuth();

  const handleAuthRequired = (e) => {
    if (!user) {
      e.preventDefault();
      // Remember the test the user was about to open so we land back on it
      // after sign-in. AuthPage reads ?next= from the URL on successful login.
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
          eyebrow="Reading · Cambridge IELTS"
          title={<>The real thing, <span className="gradient-text">end to end.</span></>}
          lead="Official Cambridge IELTS reading tests, each a complete 60-minute, 3-passage exam (40 questions) with the full split-pane interface, highlighter, drag-and-drop matching, and Cambridge-style auto-grading."
        />

        {BOOKS.map((book) => (
          <div key={book.id} style={{ marginTop: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: 'var(--r-lg)',
                background: `linear-gradient(135deg, ${book.accent}, var(--purple-700))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              }}>
                <Icon name="bookOpen" size={22} />
              </div>
              <div>
                <h3 className="h3" style={{ color: 'var(--text-primary)', margin: 0 }}>{book.label}</h3>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {book.note} · {book.tests.length} tests
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-3)',
            }}>
              {book.tests.map((test) => (
                <a
                  key={test.id}
                  href={testHref(book.id, test.id)}
                  onClick={handleAuthRequired}
                  onMouseEnter={() => prefetchPage(testHref(book.id, test.id))}
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
                    color: book.accent, fontSize: 'var(--text-sm)', fontWeight: 600,
                  }}>
                    Start test <Icon name="arrowRight" size={15} style={{ marginLeft: '4px' }} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
