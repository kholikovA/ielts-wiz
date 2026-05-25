import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from './ui/icons';
import useReveal from './ui/useReveal';

const FinalCTA = ({ setCurrentPage }) => {
  const { user } = useAuth();
  const ref = useReveal();

  return (
    <section className="page-section page-section--lg reveal" ref={ref}>
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--r-3xl)',
        border: '1px solid var(--purple-500-30)',
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(124, 58, 237, 0.05))',
        padding: 'var(--space-16) var(--space-8)',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          width: '720px',
          height: '720px',
          background: 'radial-gradient(circle, var(--glow-color) 0%, transparent 60%)',
          filter: 'blur(80px)',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>Ready when you are</div>
          <h2 className="h1" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Stop reading about IELTS. <span className="gradient-text">Start scoring.</span>
          </h2>
          <p className="body-lg" style={{ marginBottom: 'var(--space-8)' }}>
            Pick one section, sit one timed test, and find out where you actually stand. The next forty minutes is the cheapest, most accurate diagnostic you'll get.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentPage(user ? 'listening' : 'signup')}
            >
              {user ? 'Take a test now' : 'Create free account'}
              <Icon name="arrowRight" size={18} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => setCurrentPage('reading')}
            >
              Browse passages
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
