import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { readingPassage1Tests } from '../data/reading-passage1';
import { readingPassage2Tests } from '../data/reading-passage2';
import { readingPassage3Tests } from '../data/reading-passage3';
import SubNav from './ui/SubNav';
import PageHeader from './ui/PageHeader';
import CollapsibleAbout from './ui/CollapsibleAbout';
import Icon from './ui/icons';

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

const ReadingPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();
  const initial = PASSAGES.find(p => p.id === subPage)?.id || 'passage1';
  const [active, setActive] = useState(initial);

  const onChange = (id) => {
    setActive(id);
    if (setSubPage) setSubPage(id);
  };

  // Per-passage completion list from localStorage (matches the HTML test pages,
  // which write to the same key on submit).
  const [completedTests, setCompletedTests] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem(`completedReading_${active}`);
    setCompletedTests(saved ? JSON.parse(saved) : []);
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

  const requireAuth = (e) => {
    if (!user) {
      e.preventDefault();
      setCurrentPage('login');
    }
  };

  const current = PASSAGES.find(p => p.id === active);
  const passageNum = PASSAGES.indexOf(current) + 1;
  const totalTests = PASSAGES.reduce((sum, p) => sum + p.tests.length, 0);

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow={`Reading · ${totalTests} Passages`}
          title={<>Build speed, accuracy, <span className="gradient-text">and stamina.</span></>}
          lead="Authentic IELTS reading passages with split-pane test mode, highlighter, drag-and-drop matching headings, and Cambridge-style auto-grading."
        />

        <SubNav
          items={PASSAGES.map(p => ({ id: p.id, label: `${p.label} · ${p.tests.length} tests` }))}
          value={active}
          onChange={onChange}
        />

        <p className="body" style={{ marginTop: '-1rem', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          {current.desc}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {current.tests.map((test, i) => {
            const isCompleted = completedTests.includes(test.id);
            return (
              <a
                key={test.id}
                href={testHref(passageNum, test.id)}
                onClick={requireAuth}
                className="card card-interactive animate-fadeInUp"
                style={{
                  position: 'relative',
                  borderColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : undefined,
                  animationDelay: `${i * 0.02}s`,
                }}
              >
                {isCompleted && (
                  <div style={{
                    position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                  }}>
                    <Icon name="check" size={14} strokeWidth={3} />
                  </div>
                )}
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--purple-400)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  marginBottom: 'var(--space-2)',
                }}>
                  Test {test.id}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                  lineHeight: 1.3,
                  paddingRight: isCompleted ? 'var(--space-8)' : 0,
                }}>
                  {test.title}
                </h3>
                <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
                  {test.subtitle}
                </p>
              </a>
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
