import React from 'react';
import Icon from './ui/icons';
import { COMING_SOON_COPY } from '../lib/navConfig';

// Generic placeholder for sections that are announced but not yet built
// (Vocabulary, Articles, Dictation). Copy is keyed by page id in navConfig.
export default function ComingSoon({ section }) {
  const copy = COMING_SOON_COPY[section] || {
    icon: 'sparkle',
    title: 'Coming soon',
    lead: 'This section is on the way.',
  };

  return (
    <div className="page-shell">
      <div className="page-section coming-soon">
        <div className="coming-soon-card">
          <div className="coming-soon-icon">
            <Icon name={copy.icon} size={32} />
          </div>
          <span className="coming-soon-badge">Coming soon</span>
          <h1>{copy.title}</h1>
          <p className="coming-soon-lead">{copy.lead}</p>
          <p className="coming-soon-note">We're building this out — check back shortly.</p>
        </div>
      </div>
    </div>
  );
}
