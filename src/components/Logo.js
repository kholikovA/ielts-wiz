import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Logo = ({ onClick }) => {
  const { isDark } = useTheme();
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <img
        src={isDark ? "/logo-dark.svg" : "/logo-light.svg"}
        alt="IELTS Wiz"
        style={{
          height: '36px',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

// ==================== NAVIGATION ====================

export default Logo;
