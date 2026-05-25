import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listeningTestsData } from '../data/listening-tests';
import SubNav from './ui/SubNav';
import PageHeader from './ui/PageHeader';
import CollapsibleAbout from './ui/CollapsibleAbout';
import Icon from './ui/icons';
import { getCompletedIds } from '../lib/progressStore';

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

  const onChangePart = (id) => {
    setSelectedPart(id);
    if (setSubPage) setSubPage(id);
  };

  const tests = listeningTestsData[selectedPart] || [];
  const activePart = PARTS.find(p => p.id === selectedPart);

  // Completion list from the versioned progress store (iw.v1.completed.listening).
  // Same key the HTML test pages write on submit.
  const [completedIds, setCompletedIds] = useState([]);
  useEffect(() => { setCompletedIds(getCompletedIds('listening')); }, []);

  const handleCardClick = (e) => {
    if (!user) {
      e.preventDefault();
      setCurrentPage('login');
    }
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow="Listening · 80 Tests"
          title={<>Train your ear, <span className="gradient-text">one test at a time.</span></>}
          lead="Real exam audio across all four parts. Each test is 10 questions / ~30 minutes with auto-grading and a Cambridge-style band conversion at the end."
        />

        <SubNav
          items={PARTS.map(p => ({ id: p.id, label: `${p.label} · Tests ${p.range}` }))}
          value={selectedPart}
          onChange={onChangePart}
        />

        <p className="body" style={{ marginTop: '-1rem', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          {activePart?.desc}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          {tests.map((test, index) => {
            const isCompleted = completedIds.includes(String(test.id));
            return (
            <a
              key={test.id}
              href={`/tests/test_${test.id}.html`}
              onClick={handleCardClick}
              className="card card-interactive animate-fadeInUp"
              style={{
                position: 'relative',
                padding: 'var(--space-5)',
                textAlign: 'center',
                animationDelay: `${index * 0.015}s`,
                borderColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : undefined,
              }}
            >
              {isCompleted && (
                <div style={{
                  position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'var(--success)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                }}>
                  <Icon name="check" size={12} strokeWidth={3} />
                </div>
              )}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--r-md)',
                background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-3)',
                fontSize: 'var(--text-md)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'white',
              }}>
                {test.id}
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                {test.title && test.title.length > 22 ? `${test.title.slice(0, 22)}…` : test.title}
              </p>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                10 questions
              </div>
            </a>
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
