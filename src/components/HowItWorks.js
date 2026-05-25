import React from 'react';
import Icon from './ui/icons';
import useReveal from './ui/useReveal';

const STEPS = [
  {
    n: '01',
    icon: 'compass',
    title: 'Diagnose where you are.',
    blurb: 'Sit a timed Listening or Reading test. See your raw score and the exact question types that cost you points.',
  },
  {
    n: '02',
    icon: 'layers',
    title: 'Drill the weak spots.',
    blurb: 'Work through the specific section, passage, or grammar lesson that matches what you missed — no busywork, no fluff.',
  },
  {
    n: '03',
    icon: 'award',
    title: 'Score the band you need.',
    blurb: 'Re-test on a fresh passage to confirm the gain. Repeat until the score is consistent, then ship the real exam.',
  },
];

const HowItWorks = () => {
  const ref = useReveal();

  return (
    <section className="page-section page-section--lg reveal" ref={ref}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>How It Works</div>
        <h2 className="h1" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
          A loop that actually moves the score.
        </h2>
        <p className="body-lg" style={{ maxWidth: '52ch', margin: '0 auto' }}>
          Most prep is endless content with no feedback. This is the opposite — short, measurable cycles.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-5)',
      }}>
        {STEPS.map((step) => (
          <div key={step.n} className="card" style={{ position: 'relative', paddingTop: 'var(--space-8)' }}>
            <div style={{
              position: 'absolute',
              top: 'var(--space-5)',
              right: 'var(--space-5)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
            }}>
              {step.n}
            </div>
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
              <Icon name={step.icon} size={22} />
            </div>
            <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              {step.title}
            </h3>
            <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
              {step.blurb}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
