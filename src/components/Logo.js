import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import AppLink from './ui/AppLink';
import { hrefFor } from '../lib/routes';

// Renders a real link to home so cmd/ctrl/middle-click open a new tab; a plain
// click is handled by the SPA via onNavigate.
const Logo = ({ onNavigate }) => {
  const { isDark } = useTheme();
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
      }}
    >
      <img
        src={isDark ? '/logo-dark.svg' : '/logo-light.svg'}
        alt="IELTS Wiz"
        style={{ height: '36px', objectFit: 'contain' }}
      />
    </AppLink>
  );
};

export default Logo;
