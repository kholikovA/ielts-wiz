import React from 'react';

const HeroSection = ({ setCurrentPage }) => (
  <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8rem 2rem 4rem', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: '20%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--glow-color) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)`, backgroundSize: '60px 60px', pointerEvents: 'none' }} />
    <div style={{ maxWidth: '1000px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <div className="animate-fadeInUp" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '100px', background: 'var(--badge-bg)', border: '1px solid var(--purple-500-30)', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--purple-300)' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
        Academic IELTS Preparation
      </div>
      <h1 className="animate-fadeInUp" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        Become an<br /><span className="gradient-text">IELTS Wizard</span>
      </h1>
      <p className="animate-fadeInUp" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem' }}>
        Real exam questions, Band 9 sample answers, and expert strategies to achieve your target score.
      </p>
      <div className="animate-fadeInUp" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setCurrentPage('signup')} style={{ padding: '1rem 2.5rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))', color: 'white', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 30px rgba(147, 51, 234, 0.4)' }}>Start Free</button>
        <button onClick={() => setCurrentPage('speaking')} style={{ padding: '1rem 2.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>Browse Questions</button>
      </div>
    </div>
  </section>
);

// ==================== SKILLS SECTION ====================

export default HeroSection;
