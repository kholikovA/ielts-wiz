import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { readingPassage1Tests } from '../../data/reading-passage1';
import { readingPassage2Tests } from '../../data/reading-passage2';
import { readingPassage3Tests } from '../../data/reading-passage3';
import SubNav from '../ui/SubNav';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import TestCard from '../ui/TestCard';
import ViewToggle, { readViewMode, writeViewMode } from '../ui/ViewToggle';
import { getCompletedIds, getLatestAttempt, hasLastSubmission } from '../../lib/progressStore';

const PASSAGES = [
  { id: 'passage1', label: 'Passage 1', tests: readingPassage1Tests, desc: 'Factual texts on accessible topics — the warm-up. Mostly T/F/NG, completion, matching, MCQ.' },
  { id: 'passage2', label: 'Passage 2', tests: readingPassage2Tests, desc: 'Slightly more abstract texts — matching headings, MCQ, completion. The difficulty ramps here.' },
  { id: 'passage3', label: 'Passage 3', tests: readingPassage3Tests, desc: 'Long, argumentative texts. The most demanding section — focus on global structure and inference.' },
];

const testHref = (passage, id) => `/reading/passage${passage}_${id}.html`;
const ACCENT_FOR_PASSAGE = {
  passage1: 'var(--violet-500)',
  passage2: 'var(--blue-500)',
  passage3: 'var(--green-500)',
};

export default function PartsView({ subPage, setSubPage, setCurrentPage }) {
  const { user } = useAuth();
  // Accept 'parts' or 'passage1/2/3' as entry points. 'parts' falls through to passage1.
  const initial = PASSAGES.find(p => p.id === subPage)?.id || 'passage1';
  const [active, setActive] = useState(initial);
  const [viewMode, setViewMode] = useState(() => readViewMode());

  const onChange = (id) => {
    setActive(id);
    if (setSubPage) setSubPage(id);
  };
  const onChangeView = (m) => { setViewMode(m); writeViewMode(m); };

  const [completedTests, setCompletedTests] = useState([]);
  useEffect(() => {
    const num = active.replace('passage', '');
    setCompletedTests(getCompletedIds(`reading_p${num}`));
  }, [active]);

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

  const current = PASSAGES.find(p => p.id === active);
  const passageNum = PASSAGES.indexOf(current) + 1;
  const kind = `reading_p${passageNum}`;
  const accent = ACCENT_FOR_PASSAGE[active] || 'var(--purple-600)';

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
          eyebrow="Reading · Part Practice"
          title={<>Build speed, accuracy, <span className="gradient-text">and stamina.</span></>}
          lead="Pick a passage type, drill one test at a time. Each test mirrors the real exam's split-pane layout, with highlighter, matching-headings drag-and-drop, and Cambridge-style auto-grading."
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          <SubNav
            items={PASSAGES.map(p => ({ id: p.id, label: `${p.label} · ${p.tests.length} tests` }))}
            value={active}
            onChange={onChange}
          />
          <ViewToggle value={viewMode} onChange={onChangeView} />
        </div>

        <p className="body" style={{ marginTop: '-1rem', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          {current.desc}
        </p>

        <div style={viewMode === 'list'
          ? { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }
          : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
          {current.tests.map((test) => {
            const isCompleted = completedTests.includes(String(test.id));
            const latest = getLatestAttempt(kind, test.id);
            const canReview = hasLastSubmission(kind, test.id);
            return (
              <TestCard
                key={test.id}
                test={test}
                href={testHref(passageNum, test.id)}
                viewMode={viewMode}
                isCompleted={isCompleted}
                latestAttempt={latest}
                canReview={canReview}
                onAuthRequired={handleAuthRequired}
                accent={accent}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
