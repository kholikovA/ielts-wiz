import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { writingPrompts, PROMPT_INDEX } from '../data/writing-prompts';
import SubNav from './ui/SubNav';
import PageHeader from './ui/PageHeader';
import CollapsibleAbout from './ui/CollapsibleAbout';
import Icon from './ui/icons';
import WritingPractice from './writing/WritingPractice';

const TABS = [
  { id: 'practice', label: 'Practice' },
  { id: 'learn',    label: 'Learn'    },
];

// Small generic chart-shape placeholder so the Task 1 prompt card hints at
// what the eventual chart will look like. Replaced by a real <img src=...>
// once authored visuals exist for each prompt.
const ChartPlaceholder = ({ kind }) => {
  const stroke = 'var(--purple-400)';
  const grid = 'var(--border-color)';
  const fill = 'rgba(168, 85, 247, 0.08)';
  const body = (() => {
    switch (kind) {
      case 'task1-line':
        return (
          <>
            <path d="M10 50 L25 35 L40 42 L55 22 L70 28 L85 12" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="50" r="2" fill={stroke} />
            <circle cx="40" cy="42" r="2" fill={stroke} />
            <circle cx="70" cy="28" r="2" fill={stroke} />
          </>
        );
      case 'task1-chart':
        return (
          <>
            <rect x="14" y="28" width="9" height="32" fill={fill} stroke={stroke} strokeWidth="1.5"/>
            <rect x="30" y="20" width="9" height="40" fill={fill} stroke={stroke} strokeWidth="1.5"/>
            <rect x="46" y="34" width="9" height="26" fill={fill} stroke={stroke} strokeWidth="1.5"/>
            <rect x="62" y="14" width="9" height="46" fill={fill} stroke={stroke} strokeWidth="1.5"/>
            <rect x="78" y="40" width="9" height="20" fill={fill} stroke={stroke} strokeWidth="1.5"/>
          </>
        );
      case 'task1-table':
        return (
          <>
            <rect x="10" y="14" width="80" height="46" fill="none" stroke={stroke} strokeWidth="1.5"/>
            <line x1="10" y1="26" x2="90" y2="26" stroke={stroke} strokeWidth="1.5"/>
            <line x1="36" y1="14" x2="36" y2="60" stroke={grid}/>
            <line x1="62" y1="14" x2="62" y2="60" stroke={grid}/>
            <line x1="10" y1="38" x2="90" y2="38" stroke={grid}/>
            <line x1="10" y1="49" x2="90" y2="49" stroke={grid}/>
          </>
        );
      case 'task1-map':
        return (
          <>
            <path d="M5 50 Q20 30 40 38 T80 32 L95 50 L95 65 L5 65 Z" fill={fill} stroke={stroke} strokeWidth="1.5"/>
            <circle cx="30" cy="46" r="3" fill={stroke}/>
            <circle cx="55" cy="40" r="3" fill={stroke}/>
            <circle cx="75" cy="44" r="3" fill={stroke}/>
            <path d="M30 46 L55 40 L75 44" stroke={stroke} strokeWidth="1" strokeDasharray="2 2" fill="none"/>
          </>
        );
      case 'task1-process':
        return (
          <>
            <rect x="10" y="32" width="18" height="14" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5"/>
            <rect x="41" y="32" width="18" height="14" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5"/>
            <rect x="72" y="32" width="18" height="14" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5"/>
            <path d="M28 39 L41 39 M59 39 L72 39" stroke={stroke} strokeWidth="1.5" markerEnd="url(#arrow)"/>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0 0 L6 3 L0 6 Z" fill={stroke}/>
              </marker>
            </defs>
          </>
        );
      default:
        return <rect x="10" y="20" width="80" height="40" fill={fill} stroke={stroke} strokeWidth="1.5"/>;
    }
  })();
  return (
    <svg viewBox="0 0 100 75" style={{ width: '100%', height: 'auto', maxHeight: 90, marginBottom: 'var(--space-3)' }} aria-hidden="true">
      {body}
    </svg>
  );
};

const PracticeTab = ({ user, setCurrentPage, setSubPage }) => {
  const handleClick = (e, prompt) => {
    if (!user) {
      e.preventDefault();
      setCurrentPage('login');
      return;
    }
    if (setSubPage) setSubPage(prompt.id);
  };

  const renderPromptCard = (prompt, i) => {
    const isAuthored = prompt.status === 'authored';
    const isTask1 = prompt.type.startsWith('task1');
    return (
      <button
        key={prompt.id}
        type="button"
        onClick={(e) => handleClick(e, prompt)}
        className="card card-interactive animate-fadeInUp"
        style={{ textAlign: 'left', animationDelay: `${i * 0.04}s`, cursor: 'pointer' }}
      >
        {isTask1 && <ChartPlaceholder kind={prompt.type} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--purple-400)', fontWeight: 700, letterSpacing: '0.06em' }}>
            {prompt.id}
          </span>
          {isAuthored && <span className="pill pill-success" style={{ fontSize: 10, padding: '1px 8px' }}>Band 9 model</span>}
        </div>
        <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {prompt.title}
        </h3>
        <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {prompt.prompt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>{prompt.timeLimitMin} min · {prompt.wordTarget}+ words</span>
          <Icon name="arrowRight" size={14} />
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Task 1 group */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <h2 className="h2" style={{ color: 'var(--text-primary)' }}>Task 1</h2>
          <span className="body" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            Describe a graph, chart, process, map, or table. 150+ words · 20 min.
          </span>
        </div>
        <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
          The data first, your opinion never — your job is to summarise what you see.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {writingPrompts.task1.map(renderPromptCard)}
        </div>
      </div>

      {/* Task 2 group */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <h2 className="h2" style={{ color: 'var(--text-primary)' }}>Task 2</h2>
          <span className="body" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            Discursive essay on a contemporary issue. 250+ words · 40 min.
          </span>
        </div>
        <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
          Position, position, position — examiners want to know what you think and why.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {writingPrompts.task2.map(renderPromptCard)}
        </div>
      </div>
    </>
  );
};

const LearnTab = () => (
  <div className="panel panel-info" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
    <Icon name="bookOpen" size={36} style={{ color: 'var(--purple-400)', marginBottom: 'var(--space-4)' }} />
    <h2 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
      Learn — coming soon
    </h2>
    <p className="body-lg" style={{ maxWidth: '52ch', margin: '0 auto var(--space-4)' }}>
      Annotated model essays, paragraph templates, and a structural playbook for every Task 2 question type — discuss-both-views, opinion, advantage-disadvantage, problem-solution, and two-part.
    </p>
    <p className="body" style={{ fontSize: 'var(--text-sm)' }}>
      In the meantime, every Task 1 / Task 2 prompt in <strong>Practice</strong> includes a phrase-by-phrase Band 9 model answer once you submit your draft.
    </p>
  </div>
);

const WritingPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();

  // subPage can be 'practice' / 'learn' (hub) or a specific prompt id ('T1-01', etc).
  const sub = subPage || 'practice';
  const activePrompt = PROMPT_INDEX[sub];

  const [activeTab, setActiveTab] = useState(
    activePrompt ? 'practice' : (TABS.find(t => t.id === sub)?.id || 'practice')
  );

  const onChangeTab = (id) => {
    setActiveTab(id);
    if (setSubPage) setSubPage(id);
  };

  // If a specific prompt is loaded, render the practice flow.
  if (activePrompt) {
    return (
      <WritingPractice
        prompt={activePrompt}
        onBack={() => setSubPage && setSubPage('practice')}
      />
    );
  }

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow="Writing · Academic"
          title={<>Practise <span className="gradient-text">until the structure is automatic.</span></>}
          lead="Real exam prompts with a timer, auto-saving draft, self-grading rubric, and annotated Band 9 model answers — the same loop a band-9 candidate would use."
        />

        <SubNav
          items={TABS}
          value={activeTab}
          onChange={onChangeTab}
        />

        <div style={{ marginTop: 'var(--space-2)' }}>
          {activeTab === 'practice'
            ? <PracticeTab user={user} setCurrentPage={setCurrentPage} setSubPage={setSubPage} />
            : <LearnTab />
          }
        </div>

        <CollapsibleAbout
          title="About IELTS Writing"
          resourceHref="https://www.ielts.org/for-test-takers/test-format"
          resourceLabel="View official IELTS Writing resources"
        >
          <p style={{ marginBottom: 'var(--space-3)' }}>
            The Academic Writing test is 60 minutes long. <strong>Task 1</strong> (20 min, 150+ words) asks you to describe a graph, chart, process diagram, map, or table. <strong>Task 2</strong> (40 min, 250+ words) is a discursive essay worth twice as many marks — manage your time accordingly.
          </p>
          <p style={{ margin: 0 }}>
            Examiners score against four equally weighted criteria: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy. Each prompt here includes a band-by-band rubric so you can self-mark, and Band 9 models include phrase-level annotations showing exactly why they score what they score.
          </p>
        </CollapsibleAbout>
      </div>
    </div>
  );
};

export default WritingPage;
