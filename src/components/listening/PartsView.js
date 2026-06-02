import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listeningTestsData } from '../../data/listening-tests';
import SubNav from '../ui/SubNav';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import TestCard from '../ui/TestCard';
import ViewToggle, { readViewMode, writeViewMode } from '../ui/ViewToggle';
import { getCompletedIds, getLatestAttempt, hasLastSubmission } from '../../lib/progressStore';

const PARTS = [
  { id: 'part1', label: 'Part 1', desc: 'Everyday social contexts — conversations between two speakers.', range: '1–20' },
  { id: 'part2', label: 'Part 2', desc: 'Everyday social monologue — talks, tours, announcements.', range: '21–40' },
  { id: 'part3', label: 'Part 3', desc: 'Educational and training contexts — academic discussions.', range: '41–60' },
  { id: 'part4', label: 'Part 4', desc: 'Academic monologue — university-style lectures.', range: '61–80' },
];

export default function PartsView({ subPage, setSubPage, setCurrentPage }) {
  const { user } = useAuth();
  // 'parts' falls through to part1. 'part1' through 'part4' deep-link to that tab.
  const initial = PARTS.find(p => p.id === subPage)?.id || 'part1';
  const [selectedPart, setSelectedPart] = useState(initial);
  const [viewMode, setViewMode] = useState(() => readViewMode());

  const onChangePart = (id) => { setSelectedPart(id); if (setSubPage) setSubPage(id); };
  const onChangeView = (m) => { setViewMode(m); writeViewMode(m); };

  const tests = listeningTestsData[selectedPart] || [];
  const activePart = PARTS.find(p => p.id === selectedPart);

  const [completedIds, setCompletedIds] = useState([]);
  useEffect(() => { setCompletedIds(getCompletedIds('listening')); }, []);

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
          <Icon name="arrowLeft" size={14} /> Listening hub
        </button>

        <PageHeader
          eyebrow="Listening · Part Practice"
          title={<>Train your ear, <span className="gradient-text">one test at a time.</span></>}
          lead="Pick a section, drill one test at a time. Each test is 10 questions with auto-grading and a Cambridge-style band conversion at the end."
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
            const canReview = hasLastSubmission('listening', test.id);
            return (
              <TestCard
                key={test.id}
                test={test}
                href={`/tests/test_${test.id}.html`}
                viewMode={viewMode}
                isCompleted={isCompleted}
                latestAttempt={latest}
                canReview={canReview}
                meta="10 questions"
                onAuthRequired={handleAuthRequired}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
