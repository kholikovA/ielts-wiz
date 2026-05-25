import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import AVATAR_OPTIONS from '../data/avatar-options';
import Icon from './ui/icons';

const NAV_ITEMS = [
  { id: 'listening', label: 'Listening', icon: 'headphones' },
  { id: 'reading', label: 'Reading', icon: 'book' },
  { id: 'writing', label: 'Writing', icon: 'pen' },
  { id: 'speaking', label: 'Speaking', icon: 'mic' },
  { id: 'grammar', label: 'Grammar', icon: 'graduation' },
];

const Navigation = ({ currentPage, setCurrentPage }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Lock body scroll when the mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const avatarSrc = profile?.avatar_index >= 0 ? AVATAR_OPTIONS[profile.avatar_index] : null;
  const initial = profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    width: '100%',
    padding: 'var(--space-3) var(--space-3)',
    borderRadius: 'var(--r-md)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    textAlign: 'left',
  };

  const navigate = (page) => {
    setCurrentPage(page);
    setMobileOpen(false);
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: 'var(--space-3) var(--space-6)',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <Logo onClick={() => setCurrentPage('home')} />
        <div className="hide-mobile" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          {NAV_ITEMS.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  background: isActive ? 'var(--purple-600)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
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
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
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
                <div role="menu" style={{ position: 'absolute', top: '44px', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--r-lg)', padding: 'var(--space-2)', minWidth: '180px', zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  <button role="menuitem" onClick={() => { setCurrentPage('dashboard'); setShowProfileMenu(false); }} style={menuItemStyle}>
                    <Icon name="layout" size={16} />
                    Dashboard
                  </button>
                  {isAdmin && (
                    <button role="menuitem" onClick={() => { setCurrentPage('admin'); setShowProfileMenu(false); }} style={menuItemStyle}>
                      <Icon name="user" size={16} />
                      Admin · Users
                    </button>
                  )}
                  <button role="menuitem" onClick={() => { toggleTheme(); setShowProfileMenu(false); }} style={menuItemStyle}>
                    <Icon name={isDark ? 'sun' : 'moon'} size={16} />
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: 'var(--space-1) 0' }} />
                  <button role="menuitem" onClick={() => { signOut().then(() => setCurrentPage('home')); setShowProfileMenu(false); }} style={{ ...menuItemStyle, color: 'var(--error)' }}>
                    <Icon name="logout" size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <span className="hide-mobile"><ThemeToggle /></span>
              <button className="hide-mobile" onClick={() => setCurrentPage('login')} style={{ padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--r-md)', border: 'none', background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))', color: 'white', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
            </>
          )}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu-drawer" onClick={() => setMobileOpen(false)}>
          <aside
            className="mobile-menu-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Site menu"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`mobile-menu-item ${currentPage === item.id ? 'is-active' : ''}`}
                onClick={() => navigate(item.id)}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </button>
            ))}
            <div style={{ height: '1px', background: 'var(--border-color)', margin: 'var(--space-3) 0' }} />
            {user ? (
              <>
                <button className="mobile-menu-item" onClick={() => navigate('dashboard')}>
                  <Icon name="layout" size={18} /> Dashboard
                </button>
                {isAdmin && (
                  <button className="mobile-menu-item" onClick={() => navigate('admin')}>
                    <Icon name="user" size={18} /> Admin · Users
                  </button>
                )}
                <button className="mobile-menu-item" onClick={() => { toggleTheme(); }}>
                  <Icon name={isDark ? 'sun' : 'moon'} size={18} />
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button className="mobile-menu-item" onClick={() => signOut().then(() => navigate('home'))} style={{ color: 'var(--error)' }}>
                  <Icon name="logout" size={18} /> Log Out
                </button>
              </>
            ) : (
              <>
                <button className="mobile-menu-item" onClick={() => { toggleTheme(); }}>
                  <Icon name={isDark ? 'sun' : 'moon'} size={18} />
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button className="btn btn-primary" style={{ marginTop: 'var(--space-2)' }} onClick={() => navigate('login')}>
                  Sign In
                </button>
              </>
            )}
          </aside>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
