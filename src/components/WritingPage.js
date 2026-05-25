import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { writingPrompts, PROMPT_INDEX } from '../data/writing-prompts';
import SubNav from './ui/SubNav';
import PageHeader from './ui/PageHeader';
import CollapsibleAbout from './ui/CollapsibleAbout';
import Icon from './ui/icons';
import WritingPractice from './writing/WritingPractice';

const TASKS = [
  { id: 'task1', label: 'Task 1', desc: 'Describe a graph, chart, process, map, or table — 150+ words in 20 minutes.', tip: 'The data first, your opinion never. Your job is to summarise what you see.' },
  { id: 'task2', label: 'Task 2', desc: 'Discursive essay on a contemporary issue — 250+ words in 40 minutes.', tip: 'Position, position, position. Examiners want to know what you think and why.' },
];

const WritingPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();

  // subPage can be 'task1' / 'task2' (hub) or a specific prompt id ('T1-01', etc).
  const sub = subPage || 'task1';
  const activePrompt = PROMPT_INDEX[sub];

  const [selectedTask, setSelectedTask] = useState(activePrompt ? (activePrompt.type.startsWith('task1') ? 'task1' : 'task2') : (TASKS.find(t => t.id === sub)?.id || 'task1'));

  const onChangeTask = (id) => {
    setSelectedTask(id);
    if (setSubPage) setSubPage(id);
  };

  // If a specific prompt is loaded, render the practice flow.
  if (activePrompt) {
    return (
      <WritingPractice
        prompt={activePrompt}
        onBack={() => setSubPage && setSubPage(activePrompt.type.startsWith('task1') ? 'task1' : 'task2')}
      />
    );
  }

  const handleClick = (e, prompt) => {
    if (!user) {
      e.preventDefault();
      setCurrentPage('login');
      return;
    }
    if (setSubPage) setSubPage(prompt.id);
  };

  const prompts = writingPrompts[selectedTask] || [];
  const activeTask = TASKS.find(t => t.id === selectedTask);

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow="Writing · Academic"
          title={<>Practise <span className="gradient-text">until the structure is automatic.</span></>}
          lead="Real exam prompts with a timer, auto-saving draft, self-grading rubric, and annotated Band 9 model answers — the same loop a band-9 candidate would use."
        />

        <SubNav
          items={TASKS.map(t => ({ id: t.id, label: `${t.label} · ${writingPrompts[t.id].length} prompts` }))}
          value={selectedTask}
          onChange={onChangeTask}
        />

        <p className="body" style={{ marginTop: '-1rem', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          {activeTask?.desc} <em style={{ color: 'var(--text-tertiary)' }}>{activeTask?.tip}</em>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {prompts.map((prompt, i) => {
            const isAuthored = prompt.status === 'authored';
            return (
              <button
                key={prompt.id}
                type="button"
                onClick={(e) => handleClick(e, prompt)}
                className="card card-interactive animate-fadeInUp"
                style={{ textAlign: 'left', animationDelay: `${i * 0.04}s`, cursor: 'pointer' }}
              >
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
          })}
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
