import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Logo = ({ onClick }) => {
  const { isDark } = useTheme();
  return (
    <button
      onClick={onClick}
      aria-label="IELTS Wiz home"
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: 0,
        background: 'transparent',
        border: 'none',
      }}
    >
      <img
        src={isDark ? '/logo-dark.svg' : '/logo-light.svg'}
        alt="IELTS Wiz"
        style={{ height: '36px', objectFit: 'contain' }}
      />
    </button>
  );
};

export default Logo;
