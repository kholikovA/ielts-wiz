import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { readingPassage1Tests } from '../data/reading-passage1';
import { readingPassage2Tests } from '../data/reading-passage2';
import { readingPassage3Tests } from '../data/reading-passage3';
import SubNav from './ui/SubNav';
import PageHeader from './ui/PageHeader';
import CollapsibleAbout from './ui/CollapsibleAbout';
import TestCard from './ui/TestCard';
import ViewToggle, { readViewMode, writeViewMode } from './ui/ViewToggle';
import { getCompletedIds, getLatestAttempt } from '../lib/progressStore';

const PASSAGES = [
  {
    id: 'passage1',
    label: 'Passage 1',
    tests: readingPassage1Tests,
    desc: 'Factual texts on accessible topics — the warm-up. Mostly T/F/NG, completion, matching, MCQ.',
  },
  {
    id: 'passage2',
    label: 'Passage 2',
    tests: readingPassage2Tests,
    desc: 'Slightly more abstract texts — matching headings, MCQ, completion. The difficulty ramps here.',
  },
  {
    id: 'passage3',
    label: 'Passage 3',
    tests: readingPassage3Tests,
    desc: 'Long, argumentative texts. The most demanding section — focus on global structure and inference.',
  },
];

const testHref = (passage, id) => `/reading/passage${passage}_${id}.html`;

// Per-passage accent matches the dashboard category colors.
const ACCENT_FOR_PASSAGE = {
  passage1: 'var(--violet-500)',
  passage2: 'var(--blue-500)',
  passage3: 'var(--green-500)',
};

const ReadingPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();
  const initial = PASSAGES.find(p => p.id === subPage)?.id || 'passage1';
  const [active, setActive] = useState(initial);
  const [viewMode, setViewMode] = useState(() => readViewMode());

  const onChange = (id) => {
    setActive(id);
    if (setSubPage) setSubPage(id);
  };

  const onChangeView = (m) => {
    setViewMode(m);
    writeViewMode(m);
  };

  // Per-passage completion list from the versioned progress store. The HTML
  // test pages write to the same store on submit (key: iw.v1.completed.reading.passageN).
  const [completedTests, setCompletedTests] = useState([]);
  useEffect(() => {
    // active is 'passage1' | 'passage2' | 'passage3' → kind is 'reading_p1' etc.
    const num = active.replace('passage', '');
    setCompletedTests(getCompletedIds(`reading_p${num}`));
  }, [active]);

  useEffect(() => {
    const syncFromUrl = () => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts[0] === 'reading' && parts[1]) {
        const found = PASSAGES.find(p => p.id === parts[1]);
        if (found) setActive(found.id);
      }
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const handleAuthRequired = (e) => {
    if (!user) {
      e.preventDefault();
      setCurrentPage('login');
    }
  };

  const current = PASSAGES.find(p => p.id === active);
  const passageNum = PASSAGES.indexOf(current) + 1;
  const totalTests = PASSAGES.reduce((sum, p) => sum + p.tests.length, 0);
  const kind = `reading_p${passageNum}`;
  const accent = ACCENT_FOR_PASSAGE[active] || 'var(--purple-600)';

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow={`Reading · ${totalTests} Passages`}
          title={<>Build speed, accuracy, <span className="gradient-text">and stamina.</span></>}
          lead="Authentic IELTS reading passages with split-pane test mode, highlighter, drag-and-drop matching headings, and Cambridge-style auto-grading."
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
            return (
              <TestCard
                key={test.id}
                test={test}
                href={testHref(passageNum, test.id)}
                viewMode={viewMode}
                isCompleted={isCompleted}
                latestAttempt={latest}
                onAuthRequired={handleAuthRequired}
                accent={accent}
              />
            );
          })}
        </div>

        <CollapsibleAbout
          title="About IELTS Reading"
          resourceHref="https://www.ielts.org/for-test-takers/test-format"
          resourceLabel="View official IELTS Reading resources"
        >
          <p style={{ marginBottom: 'var(--space-4)' }}>
            The IELTS Academic Reading test is 60 minutes long and contains 40 questions across three passages. Each passage is roughly 700–900 words and progressively harder. You're expected to manage your own time — most candidates aim for 20 minutes per passage.
          </p>
          <p style={{ margin: 0 }}>
            Question types include True/False/Not Given, Yes/No/Not Given, matching headings, matching information, matching features, sentence endings, sentence completion, summary completion, note/table/flowchart completion, short answers, and multiple choice (single and multi). Our tests cover every variant.
          </p>
        </CollapsibleAbout>
      </div>
    </div>
  );
};

export default ReadingPage;
