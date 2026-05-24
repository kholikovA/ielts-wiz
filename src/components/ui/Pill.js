import React from 'react';

// Tone: default (purple) | amber | success
export default function Pill({ tone = 'default', className = '', children, ...rest }) {
  const toneClass = tone === 'amber' ? 'pill-amber' : tone === 'success' ? 'pill-success' : '';
  return (
    <span className={['pill', toneClass, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
