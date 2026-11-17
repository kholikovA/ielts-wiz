import React from 'react';
import Brand from './Brand';
import AppLink from './ui/AppLink';
import { hrefFor } from '../lib/routes';

// Renders a real link to home so cmd/ctrl/middle-click open a new tab; a plain
// click is handled by the SPA via onNavigate.
const Logo = ({ onNavigate }) => {
  return (
    <AppLink
      href={hrefFor('home')}
      onNavigate={onNavigate}
      aria-label="IELTS Wiz home"
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none',
        color: 'var(--text-primary)',
      }}
    >
      <Brand size={34} />
    </AppLink>
  );
};

export default Logo;
