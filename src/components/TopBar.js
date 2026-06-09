import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Icon from './ui/icons';
import AppLink from './ui/AppLink';
import AVATAR_OPTIONS from '../data/avatar-options';
import { hrefFor } from '../lib/routes';
import { ACCOUNT_LINKS } from '../lib/navConfig';

const isMac = typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');

// Slim sticky bar above the content area: mobile nav toggle, command-palette
// search, theme toggle, and the account menu (or a sign-in CTA).
export default function TopBar({ navigate, onOpenMobileNav, onOpenPalette }) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const avatarSrc = profile?.avatar_index >= 0 ? AVATAR_OPTIONS[profile.avatar_index] : null;
  const initial = profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';
  const go = (page, subPage) => { navigate(page, subPage); setMenuOpen(false); };

  return (
    <header className="app-topbar">
      <button type="button" className="nav-icon-btn topbar-menu" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Icon name="menu" size={20} />
      </button>

      <button type="button" className="topbar-search" onClick={onOpenPalette} aria-label="Search (open command palette)">
        <Icon name="search" size={16} />
        <span className="topbar-search-text">Search</span>
        <kbd className="nav-kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>

      <div className="topbar-spacer" />

      <button type="button" className="nav-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
        <Icon name={isDark ? 'sun' : 'moon'} size={18} />
      </button>

      {user ? (
        <div ref={menuRef} className="nav-profile">
          <button
            type="button"
            className="avatar-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            style={avatarSrc ? undefined : { background: 'linear-gradient(135deg, var(--purple-500), var(--purple-700))' }}
          >
            {avatarSrc ? <img src={avatarSrc} alt="" /> : <span>{initial}</span>}
          </button>
          {menuOpen && (
            <div role="menu" className="profile-menu">
              <div className="profile-head">
                <span className="profile-name">{profile?.name || 'Your account'}</span>
                {user?.email && <span className="profile-email">{user.email}</span>}
              </div>
              {ACCOUNT_LINKS.map(a => (
                <AppLink key={a.id} role="menuitem" href={hrefFor(a.id)} className="profile-item" onNavigate={() => go(a.id)}>
                  <Icon name={a.icon} size={16} /> {a.label}
                </AppLink>
              ))}
              {isAdmin && (
                <AppLink role="menuitem" href={hrefFor('admin')} className="profile-item" onNavigate={() => go('admin')}>
                  <Icon name="user" size={16} /> Admin · Users
                </AppLink>
              )}
              <div className="profile-sep" />
              <button role="menuitem" type="button" className="profile-item profile-item--danger" onClick={() => { signOut().then(() => navigate('home')); setMenuOpen(false); }}>
                <Icon name="logout" size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      ) : (
        <AppLink className="btn btn-primary topbar-signin" href={hrefFor('login')} onNavigate={() => go('login')}>
          Sign in
        </AppLink>
      )}
    </header>
  );
}
