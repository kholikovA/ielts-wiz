import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import { prefetchPage } from '../../lib/prefetch';
import { typesForHref } from '../../lib/testMeta';
import QuestionTypeChips from '../ui/QuestionTypeChips';
import { CompletedPill, ScoreBadge, ReviewRetake, StartLink } from '../ui/testCardBits';
import { getLatestAttempt } from '../../lib/progressStore';

// Full Test Practice catalogue — complete 60-minute, 3-passage exams (40 Q)
// delivered as the standalone interactive HTML. Tests are grouped into volume
// "folders". Add a test by dropping its built HTML in public/reading/ and
// appending an entry to the relevant volume's `tests` array.

const VOLUMES = [
  {
    id: 'volume9',
    title: 'Volume 9',
    tests: [
      { id: 'full_volume9_test1_f2c7e83a', recordId: 'volume9_test1', title: 'Test 1',
        passages: ['The Baobabs of Madagascar', 'Coins: the first form of money', 'Creating a Better Grapefruit'] },
      { id: 'full_volume9_test2', recordId: 'volume9_test2', title: 'Test 2',
        passages: ['Andrew Carnegie: industrialist and philanthropist', 'Translating: a key to international understanding?', 'The mystery of Easter Island'] },
      { id: 'full_volume9_test3_4bc98d12', recordId: 'volume9_test3', title: 'Test 3',
        passages: ['New Understanding of Giraffes in the Wild', 'Healthy buildings, productive people', "Child's Play in Medieval England"] },
      { id: 'full_volume9_test4_9a1f7c63', recordId: 'volume9_test4', title: 'Test 4',
        passages: ["Traditional Farming in Zambia's Luapula Province", 'Babies cry in their mother tongue', 'Ancient Rome: the early history of the city'] },
      { id: 'full_volume9_test5_b7e2a4d9', recordId: 'volume9_test5', title: 'Test 5',
        passages: ['The origins of tennis', 'Coins: the first form of money', 'Sir Francis Ronalds (1788–1873)'] },
      { id: 'full_volume9_test6_e3f5c1a8', recordId: 'volume9_test6', title: 'Test 6',
        passages: ['Health in the wild', 'Speaking of Nothing', "Changes to the Soviet Union's working week"] },
      { id: 'full_volume9_test7_d4a91b27', recordId: 'volume9_test7', title: 'Test 7',
        passages: ['Seaweed', 'The history of the Celtic language', 'The psychology of new product adoption'] },
    ],
  },
];

const RECORD_KIND = 'reading_full';
const VIEW_KEY = 'iw.v1.reading.fullTestView';
const testHref = (id) => `/reading/${id}.html`;

export default function FullView({ setSubPage, setCurrentPage }) {
  const { user } = useAuth();
  const [openVolumeId, setOpenVolumeId] = React.useState(null);
  const [view, setView] = React.useState(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list'; } catch (e) { return 'list'; }
  });
  const chooseView = (v) => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch (e) {}
  };

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

  const openVolume = VOLUMES.find((v) => v.id === openVolumeId) || null;

  const progressFor = (test) => {
    const latest = getLatestAttempt(RECORD_KIND, test.recordId);
    // Any attempt is reviewable — the test page replays the saved submission
    // (localStorage, falling back to Supabase for cross-device).
    return { latest, done: !!latest, canReview: !!latest };
  };

  // ---- A single test, list-row form ----
  const TestRow = ({ test }) => {
    const href = testHref(test.id);
    const { latest, done, canReview } = progressFor(test);
    return (
      <div className="card" style={{
        padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)',
      }}>
        <a
          href={href}
          onClick={handleAuthRequired}
          onMouseEnter={() => prefetchPage(href)}
          style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h4 className="h4" style={{ color: 'var(--text-primary)', margin: 0 }}>{test.title}</h4>
            {done && <CompletedPill />}
          </div>
          <QuestionTypeChips types={typesForHref(href)} collapsed={3} />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          {latest && <ScoreBadge correct={latest.correct} total={latest.total} />}
          {done
            ? <ReviewRetake href={href} onAuthRequired={handleAuthRequired} canReview={canReview} />
            : <StartLink href={href} onAuthRequired={handleAuthRequired} label="Start" />}
        </div>
      </div>
    );
  };

  // ---- A single test, simplified grid card (no meta line, no passage titles) ----
  const TestCard = ({ test }) => {
    const href = testHref(test.id);
    const { latest, done, canReview } = progressFor(test);
    return (
      <div className="card" style={{
        padding: 'var(--space-5)', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
      }}>
        <a
          href={href}
          onClick={handleAuthRequired}
          onMouseEnter={() => prefetchPage(href)}
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h4 className="h4" style={{ color: 'var(--text-primary)', margin: 0 }}>{test.title}</h4>
            {done && <CompletedPill />}
          </div>
          <QuestionTypeChips types={typesForHref(href)} collapsed={3} />
        </a>
        <div style={{
          marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 'var(--space-2)', flexWrap: 'wrap',
          paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-color)',
        }}>
          {latest ? <ScoreBadge correct={latest.correct} total={latest.total} /> : <span />}
          {done
            ? <ReviewRetake href={href} onAuthRequired={handleAuthRequired} canReview={canReview} />
            : <StartLink href={href} onAuthRequired={handleAuthRequired} label="Start full test" />}
        </div>
      </div>
    );
  };

  const ViewToggle = () => (
    <div style={{ display: 'inline-flex', gap: '4px', border: '1px solid var(--border-color)', borderRadius: 'var(--r-md)', padding: '3px' }}>
      {[['list', 'menu', 'List'], ['grid', 'layout', 'Grid']].map(([v, icon, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => chooseView(v)}
          aria-pressed={view === v}
          className={view === v ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name={icon} size={14} /> {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => (openVolume ? setOpenVolumeId(null) : setSubPage('hub'))}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <Icon name="arrowLeft" size={14} /> {openVolume ? 'All volumes' : 'Reading hub'}
        </button>

        <PageHeader
          eyebrow="Reading · Full Test"
          title={<>The 60-minute mock, <span className="gradient-text">end to end.</span></>}
          lead="A complete Reading test under exam conditions: three passages, 40 questions, one timer, and a Cambridge band score at the end — the full split-pane interface with highlighter and auto-grading."
        />

        {!openVolume ? (
          /* ---- Folder list ---- */
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-3)', marginTop: 'var(--space-6)',
          }}>
            {VOLUMES.map((vol) => {
              const total = vol.tests.length;
              const done = vol.tests.filter((t) => getLatestAttempt(RECORD_KIND, t.recordId)).length;
              return (
                <button
                  key={vol.id}
                  type="button"
                  className="card"
                  onClick={() => setOpenVolumeId(vol.id)}
                  style={{
                    padding: 'var(--space-5)', border: '1px solid var(--border-color)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left',
                  }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '44px', height: '44px', borderRadius: 'var(--r-md)',
                    background: 'var(--accent-soft, rgba(147,51,234,0.1))', color: 'var(--accent, #9333EA)', flexShrink: 0,
                  }}>
                    <Icon name="book" size={22} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span className="h4" style={{ color: 'var(--text-primary)', margin: 0 }}>{vol.title}</span>
                    <span className="body" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                      {total} tests{done ? ` · ${done} completed` : ''}
                    </span>
                  </span>
                  <Icon name="chevronRight" size={18} />
                </button>
              );
            })}
          </div>
        ) : (
          /* ---- Inside a volume folder ---- */
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)',
            }}>
              <h3 className="h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Icon name="book" size={20} /> {openVolume.title}
              </h3>
              <ViewToggle />
            </div>

            {view === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {openVolume.tests.map((test) => <TestRow key={test.id} test={test} />)}
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 'var(--space-3)',
              }}>
                {openVolume.tests.map((test) => <TestCard key={test.id} test={test} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
