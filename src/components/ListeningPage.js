import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listeningTestsData } from '../data/listening-tests';
import SubNav from './ui/SubNav';
import PageHeader from './ui/PageHeader';
import CollapsibleAbout from './ui/CollapsibleAbout';
import TestCard from './ui/TestCard';
import ViewToggle, { readViewMode, writeViewMode } from './ui/ViewToggle';
import { getCompletedIds, getLatestAttempt } from '../lib/progressStore';

const PARTS = [
  { id: 'part1', label: 'Part 1', desc: 'Everyday social contexts — conversations between two speakers.', range: '1–20' },
  { id: 'part2', label: 'Part 2', desc: 'Everyday social monologue — talks, tours, announcements.', range: '21–40' },
  { id: 'part3', label: 'Part 3', desc: 'Educational and training contexts — academic discussions.', range: '41–60' },
  { id: 'part4', label: 'Part 4', desc: 'Academic monologue — university-style lectures.', range: '61–80' },
];

const ListeningPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();
  // Preserve deep-linkability: the URL's subPage drives which Part is shown.
  // Legacy values ("overview" / "80-tests") fall through to Part 1.
  const initialPart = PARTS.find(p => p.id === subPage)?.id || 'part1';
  const [selectedPart, setSelectedPart] = useState(initialPart);
  const [viewMode, setViewMode] = useState(() => readViewMode());

  const onChangePart = (id) => {
    setSelectedPart(id);
    if (setSubPage) setSubPage(id);
  };

  const onChangeView = (m) => {
    setViewMode(m);
    writeViewMode(m);
  };

  const tests = listeningTestsData[selectedPart] || [];
  const activePart = PARTS.find(p => p.id === selectedPart);

  // Completion list from the versioned progress store (iw.v1.completed.listening).
  // Same key the HTML test pages write on submit.
  const [completedIds, setCompletedIds] = useState([]);
  useEffect(() => { setCompletedIds(getCompletedIds('listening')); }, []);

  const handleAuthRequired = (e) => {
    if (!user) {
      e.preventDefault();
      setCurrentPage('login');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow="Listening · 80 Tests"
          title={<>Train your ear, <span className="gradient-text">one test at a time.</span></>}
          lead="Real exam audio across all four parts. Each test is 10 questions / ~30 minutes with auto-grading and a Cambridge-style band conversion at the end."
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          <SubNav
            items={PARTS.map(p => ({ id: p.id, label: `${p.label} · Tests ${p.range}` }))}
            value={selectedPart}
            onChange={onChangePart}
          />
          <ViewToggle value={viewMode} onChange={onChangeView} />
        </div>

        <p className="body" style={{ marginTop: '-1rem', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          {activePart?.desc}
        </p>

        <div style={viewMode === 'list'
          ? { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }
          : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {tests.map((test) => {
            const isCompleted = completedIds.includes(String(test.id));
            const latest = getLatestAttempt('listening', test.id);
            return (
              <TestCard
                key={test.id}
                test={test}
                href={`/tests/test_${test.id}.html`}
                viewMode={viewMode}
                isCompleted={isCompleted}
                latestAttempt={latest}
                meta="10 questions"
                onAuthRequired={handleAuthRequired}
              />
            );
          })}
        </div>

        <CollapsibleAbout
          title="About IELTS Listening"
          resourceHref="https://www.ielts.org/for-test-takers/test-format"
          resourceLabel="View official IELTS Listening resources"
        >
          <p style={{ marginBottom: 'var(--space-4)' }}>
            The IELTS Listening test takes approximately 30 minutes (plus 10 minutes transfer time) and consists of four recorded sections of increasing difficulty. You hear each recording only once, so strong note-taking and prediction skills are essential.
          </p>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            Section 1 features a conversation between two speakers in an everyday social context. Section 2 is a monologue on a familiar topic. Section 3 is a discussion in an educational setting. Section 4 is an academic lecture.
          </p>
          <p style={{ margin: 0 }}>
            Question types include multiple choice, matching, plan/map labelling, form/note/table completion, and sentence completion. Our practice exposes you to British, American, Australian, and other accents you'll encounter in the real exam.
          </p>
        </CollapsibleAbout>
      </div>
    </div>
  );
};

export default ListeningPage;
