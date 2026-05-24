import React from 'react';

// Consistent header strip for skill pages.
//   eyebrow:   small uppercase tag (e.g. "Listening")
//   title:     display headline (e.g. "Train your ear.")
//   lead:      one-line description
export default function PageHeader({ eyebrow, title, lead }) {
  return (
    <header style={{ marginBottom: 'var(--space-8)' }}>
      {eyebrow && (
        <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>
          {eyebrow}
        </div>
      )}
      <h1 className="h1" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
        {title}
      </h1>
      {lead && (
        <p className="body-lg" style={{ maxWidth: '64ch' }}>
          {lead}
        </p>
      )}
    </header>
  );
}
