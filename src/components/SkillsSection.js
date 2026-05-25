import React from 'react';
import Card from './ui/Card';
import Icon from './ui/icons';
import useReveal from './ui/useReveal';

const SKILLS = [
  {
    id: 'listening',
    title: 'Listening',
    icon: 'headphones',
    blurb: '80 timed practice tests with audio. Train your ear across Parts 1–4 and every common question type.',
    meta: '80 tests · 30 min each',
  },
  {
    id: 'reading',
    title: 'Reading',
    icon: 'book',
    blurb: '69 authentic passages with split-pane test mode, highlighter, and Cambridge-style auto-grading.',
    meta: '69 passages · 20 min each',
  },
  {
    id: 'writing',
    title: 'Writing',
    icon: 'pen',
    blurb: 'Task 1 & Task 2 with annotated Band 9 models and the structural patterns examiners reward.',
    meta: 'Coming soon',
  },
  {
    id: 'speaking',
    title: 'Speaking',
    icon: 'mic',
    blurb: 'Real exam questions for all three parts with natural Band 9 answers and a built-in vocabulary explainer.',
    meta: 'Part 1 · Part 2 · Part 3',
  },
];

const SkillsSection = ({ setCurrentPage }) => {
  const ref = useReveal();
  return (
  <section className="page-section page-section--lg reveal" ref={ref}>
    <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
      <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>
        Four Skills · One Path
      </div>
      <h2 className="h1" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
        Everything you need, nothing you don't.
      </h2>
      <p className="body-lg" style={{ maxWidth: '52ch', margin: '0 auto' }}>
        Each section is built around the same idea — real exam content, careful structure, and answers you can actually learn from.
      </p>
    </div>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 'var(--space-5)',
    }}>
      {SKILLS.map((skill, i) => (
        <Card
          key={skill.id}
          onClick={() => setCurrentPage(skill.id)}
          className="animate-fadeInUp"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: 'var(--r-lg)',
            background: 'var(--badge-bg)',
            color: 'var(--purple-300)',
            marginBottom: 'var(--space-4)',
          }}>
            <Icon name={skill.icon} size={22} />
          </div>
          <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            {skill.title}
          </h3>
          <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {skill.blurb}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            <span>{skill.meta}</span>
            <Icon name="arrowRight" size={14} />
          </div>
        </Card>
      ))}
    </div>
  </section>
  );
};

export default SkillsSection;
