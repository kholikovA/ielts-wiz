import React from 'react';

const PlaceholderPage = ({ title, description, icon }) => (
  <div style={{ paddingTop: '100px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>{icon}</div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  </div>
);

// ==================== AUTH PAGE ====================

export default PlaceholderPage;
