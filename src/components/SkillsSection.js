import React from 'react';

const SkillsSection = ({ setCurrentPage }) => {
  const skills = [
    { id: 'listening', title: 'Listening', icon: '🎧', description: 'Train your ear with varied accents and question types.', color: '#10b981' },
    { id: 'reading', title: 'Reading', icon: '📖', description: 'Build speed and accuracy with passage analysis techniques.', color: '#06b6d4' },
    { id: 'writing', title: 'Writing', icon: '✍️', description: 'Master Task 1 and Task 2 with advanced grammar and structures.', color: '#ec4899' },
    { id: 'speaking', title: 'Speaking', icon: '🎤', description: 'Practice with real exam questions and Band 9 sample answers.', color: '#a855f7' },
  ];

  return (
    <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>Four Skills, One Goal</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Comprehensive preparation for every section of IELTS Academic</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {skills.map((skill, index) => (
          <div key={skill.id} onClick={() => setCurrentPage(skill.id)} className="animate-fadeInUp" style={{ padding: '2rem', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.3s ease', animationDelay: `${index * 0.1}s` }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{skill.icon}</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.75rem', color: skill.color }}>{skill.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{skill.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// ==================== SPEAKING PAGE ====================

export default SkillsSection;
