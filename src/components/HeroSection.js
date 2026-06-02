import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from './ui/icons';
import AppLink from './ui/AppLink';
import { hrefFor } from '../lib/routes';

// Concrete content numbers — bump these when the catalog grows.
const STATS = [
  { value: '80', label: 'Listening Tests' },
  { value: '69', label: 'Reading Passages' },
  { value: 'Band 9', label: 'Sample Answers' },
  { value: '4', label: 'Skills Covered' },
];

// Hand-built "value preview" card. Pure markup, no functionality — gives the
// hero something to look at besides body copy + decorative gradients, and
// shows the user what real content feels like.
const PreviewCard = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'relative',
      borderRadius: 'var(--r-2xl)',
      background: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      padding: 'var(--space-6)',
      boxShadow: '0 30px 60px -20px rgba(147, 51, 234, 0.28)',
      maxWidth: '440px',
      transform: 'rotate(0.4deg)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
      <span className="eyebrow">Speaking · Part 2</span>
      <span className="pill pill-amber">Band 9</span>
    </div>

    <h4 className="h3" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
      Describe a skill you would like to learn.
    </h4>

    <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0 }}>
      A skill I've{' '}
      <mark style={{ background: 'var(--highlight-bg)', color: 'var(--highlight-text)', padding: '0 4px', borderRadius: '4px', fontWeight: 600 }}>
        been meaning to pick up
      </mark>{' '}
      for ages is woodworking. There's something{' '}
      <mark style={{ background: 'var(--highlight-bg)', color: 'var(--highlight-text)', padding: '0 4px', borderRadius: '4px', fontWeight: 600 }}>
        deeply satisfying
      </mark>{' '}
      about working with your hands to make something tangible — a complete antidote to the screen-bound nature of my daily work.
    </p>

    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-5)',
      paddingTop: 'var(--space-5)',
      borderTop: '1px solid var(--border-color)',
    }}>
      <span className="pill" style={{ fontSize: 'var(--text-xs)' }}>collocation</span>
      <span className="pill" style={{ fontSize: 'var(--text-xs)' }}>idiomatic</span>
      <span className="pill" style={{ fontSize: 'var(--text-xs)' }}>natural rhythm</span>
    </div>
  </div>
);

const HeroSection = ({ setCurrentPage }) => {
  const { user } = useAuth();
  const onStart = () => setCurrentPage(user ? 'listening' : 'signup');

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      padding: 'var(--space-24) var(--space-6) var(--space-16)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '15%', left: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--glow-color) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        pointerEvents: 'none',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }} />

      <div className="hero-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'var(--space-12)',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div>
          <div className="animate-fadeInUp" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--r-pill)',
            background: 'var(--badge-bg)',
            border: '1px solid var(--purple-500-30)',
            marginBottom: 'var(--space-6)',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
            <span className="eyebrow">Academic IELTS Preparation</span>
          </div>

          <h1 className="animate-fadeInUp display-1" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-5)' }}>
            Become an<br />
            <span className="gradient-text">IELTS Wizard.</span>
          </h1>

          <p className="animate-fadeInUp body-lg" style={{ maxWidth: '52ch', marginBottom: 'var(--space-8)' }}>
            Real exam questions, Band 9 model answers, and a structured path through every section of IELTS Academic — built for learners who want to land on the score they need.
          </p>

          <div className="animate-fadeInUp" style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-10)', flexWrap: 'wrap' }}>
            <AppLink className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }} href={hrefFor(user ? 'listening' : 'signup')} onNavigate={onStart}>
              {user ? 'Start Practicing' : 'Start Free'}
              <Icon name="arrowRight" size={18} />
            </AppLink>
            <AppLink className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }} href={hrefFor('speaking')} onNavigate={() => setCurrentPage('speaking')}>
              Browse Questions
            </AppLink>
          </div>

          <div className="animate-fadeInUp" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--border-color)',
          }}>
            {STATS.map(stat => (
              <div key={stat.label}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: 'var(--space-2)',
                  fontWeight: 500,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-preview" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <PreviewCard />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hero-container { grid-template-columns: 1fr !important; }
          .hero-preview { display: none !important; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
