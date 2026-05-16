import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import AVATAR_OPTIONS from '../data/avatar-options';

const NAV_ITEMS = [
  { id: 'listening', label: 'Listening' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'speaking', label: 'Speaking' },
  { id: 'grammar', label: 'Grammar' },
];

const Navigation = ({ currentPage, setCurrentPage }) => {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const avatarSrc = profile?.avatar_index >= 0 ? AVATAR_OPTIONS[profile.avatar_index] : null;
  const initial = profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '0.75rem 2rem',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <Logo onClick={() => setCurrentPage('home')} />
        <div className="hide-mobile" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {NAV_ITEMS.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--purple-600)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
                aria-label="Open profile menu"
                aria-expanded={showProfileMenu}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  padding: 0,
                  background: avatarSrc ? 'transparent' : 'linear-gradient(135deg, var(--purple-500), var(--purple-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'white',
                  overflow: 'hidden',
                  border: avatarSrc ? '2px solid var(--purple-500)' : 'none',
                }}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initial
                )}
              </button>
              {showProfileMenu && (
                <div role="menu" style={{ position: 'absolute', top: '44px', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.5rem', minWidth: '180px', zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  <button role="menuitem" onClick={() => { setCurrentPage('dashboard'); setShowProfileMenu(false); }} style={menuItemStyle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Dashboard
                  </button>
                  <button role="menuitem" onClick={() => { toggleTheme(); setShowProfileMenu(false); }} style={menuItemStyle}>
                    {isDark ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    )}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                  <button role="menuitem" onClick={() => { signOut().then(() => setCurrentPage('home')); setShowProfileMenu(false); }} style={{ ...menuItemStyle, color: 'var(--error)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <ThemeToggle />
              <button onClick={() => setCurrentPage('login')} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))', color: 'white', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>Sign In</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
