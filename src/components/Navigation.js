import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';
import AVATAR_OPTIONS from '../data/avatar-options';
import Icon from './ui/icons';
import AppLink from './ui/AppLink';
import { hrefFor } from '../lib/routes';
import { SKILLS, ACCOUNT_LINKS, getResumeTarget } from '../lib/navConfig';

const CommandPalette = lazy(() => import('./CommandPalette'));

const isMac = typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');

const Navigation = ({ currentPage, setCurrentPage }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const drawerRef = useRef(null);

  // "Continue where you left off" — only for signed-in users with history.
  // currentPage isn't read by getResumeTarget, but we deliberately recompute on
  // navigation so the target reflects any activity logged during the last visit.
  const resume = useMemo(
    () => (user ? getResumeTarget() : null),
    [user, currentPage] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Global ⌘K / Ctrl-K opens the command palette from anywhere the nav is shown.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scroll-aware header: subtle elevation + compaction once past the top.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Dismiss the profile menu on outside click or Escape.
  useEffect(() => {
    if (!showProfileMenu) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowProfileMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') setShowProfileMenu(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [showProfileMenu]);

  // Mobile drawer: lock scroll, trap focus, Escape to close, restore focus.
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    const focusablesIn = () => Array.from(
      drawerRef.current?.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])') || []
    );
    focusablesIn()[0]?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { setMobileOpen(false); return; }
      if (e.key === 'Tab') {
        const f = focusablesIn();
        if (f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    };
  }, [mobileOpen]);

  const avatarSrc = profile?.avatar_index >= 0 ? AVATAR_OPTIONS[profile.avatar_index] : null;
  const initial = profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';

  const go = (page, subPage) => { setCurrentPage(page, subPage); setMobileOpen(false); setShowProfileMenu(false); };
  const openPalette = () => { setMobileOpen(false); setPaletteOpen(true); };

  return (
    <>
      <nav className={`site-nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="site-nav-inner">
          <Logo onNavigate={() => go('home')} />

          <div className="nav-primary nav-wide" aria-label="Primary">
            {SKILLS.map(item => (
              <AppLink
                key={item.id}
                href={hrefFor(item.id)}
                onNavigate={() => go(item.id)}
                aria-current={currentPage === item.id ? 'page' : undefined}
                className={`nav-link${currentPage === item.id ? ' is-active' : ''}`}
              >
                {item.label}
              </AppLink>
            ))}
          </div>

          <div className="nav-actions">
            {resume && (
              <AppLink
                href={hrefFor(resume.page, resume.subPage)}
                onNavigate={() => go(resume.page, resume.subPage)}
                className="nav-resume nav-wide"
                title={`Continue: ${resume.label}`}
              >
                <Icon name="play" size={15} />
                <span>Continue</span>
              </AppLink>
            )}

            <button type="button" className="nav-search nav-wide" onClick={openPalette} aria-label="Search (open command palette)">
              <Icon name="search" size={16} />
              <span className="nav-search-text">Search</span>
              <kbd className="nav-kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
            </button>

            {user ? (
              <div ref={menuRef} className="nav-profile">
                <button
                  type="button"
                  className="avatar-btn"
                  onClick={() => setShowProfileMenu(p => !p)}
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={showProfileMenu}
                  style={avatarSrc ? undefined : { background: 'linear-gradient(135deg, var(--purple-500), var(--purple-700))' }}
                >
                  {avatarSrc
                    ? <img src={avatarSrc} alt="" />
                    : <span>{initial}</span>}
                </button>
                {showProfileMenu && (
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
                    <button role="menuitem" type="button" className="profile-item" onClick={() => { toggleTheme(); setShowProfileMenu(false); }}>
                      <Icon name={isDark ? 'sun' : 'moon'} size={16} /> {isDark ? 'Light mode' : 'Dark mode'}
                    </button>
                    <button role="menuitem" type="button" className="profile-item profile-item--danger" onClick={() => { signOut().then(() => setCurrentPage('home')); setShowProfileMenu(false); }}>
                      <Icon name="logout" size={16} /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button type="button" className="nav-icon-btn nav-wide" onClick={toggleTheme} aria-label="Toggle theme">
                  <Icon name={isDark ? 'sun' : 'moon'} size={18} />
                </button>
                <AppLink className="btn btn-primary nav-wide nav-signin" href={hrefFor('login')} onNavigate={() => go('login')}>
                  Sign in
                </AppLink>
              </>
            )}

            <button type="button" className="nav-hamburger nav-narrow" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}>
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu-drawer" onClick={() => setMobileOpen(false)}>
          <aside ref={drawerRef} className="mobile-menu-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Site menu">
            <div className="mobile-menu-head">
              <span className="mobile-menu-title">Menu</span>
              <button type="button" className="nav-icon-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <Icon name="close" size={18} />
              </button>
            </div>

            <button type="button" className="mobile-search" onClick={openPalette}>
              <Icon name="search" size={18} />
              <span>Search anything</span>
            </button>

            {resume && (
              <AppLink className="mobile-resume" href={hrefFor(resume.page, resume.subPage)} onNavigate={() => go(resume.page, resume.subPage)}>
                <Icon name="play" size={18} />
                <span>
                  <strong>Continue</strong>
                  <small>{resume.label}</small>
                </span>
              </AppLink>
            )}

            <div className="mobile-menu-label">Practice</div>
            {SKILLS.map(item => (
              <AppLink
                key={item.id}
                href={hrefFor(item.id)}
                className={`mobile-menu-item${currentPage === item.id ? ' is-active' : ''}`}
                onNavigate={() => go(item.id)}
              >
                <Icon name={item.icon} size={18} /> {item.label}
              </AppLink>
            ))}

            <div className="mobile-menu-sep" />

            {user ? (
              <>
                <div className="mobile-menu-label">Account</div>
                {ACCOUNT_LINKS.map(a => (
                  <AppLink key={a.id} className={`mobile-menu-item${currentPage === a.id ? ' is-active' : ''}`} href={hrefFor(a.id)} onNavigate={() => go(a.id)}>
                    <Icon name={a.icon} size={18} /> {a.label}
                  </AppLink>
                ))}
                {isAdmin && (
                  <AppLink className="mobile-menu-item" href={hrefFor('admin')} onNavigate={() => go('admin')}>
                    <Icon name="user" size={18} /> Admin · Users
                  </AppLink>
                )}
                <button type="button" className="mobile-menu-item" onClick={toggleTheme}>
                  <Icon name={isDark ? 'sun' : 'moon'} size={18} /> {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <button type="button" className="mobile-menu-item mobile-menu-item--danger" onClick={() => signOut().then(() => go('home'))}>
                  <Icon name="logout" size={18} /> Log out
                </button>
              </>
            ) : (
              <>
                <button type="button" className="mobile-menu-item" onClick={toggleTheme}>
                  <Icon name={isDark ? 'sun' : 'moon'} size={18} /> {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <AppLink className="btn btn-primary mobile-menu-cta" href={hrefFor('login')} onNavigate={() => go('login')}>
                  Sign in
                </AppLink>
              </>
            )}
          </aside>
        </div>
      )}

      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette navigateTo={setCurrentPage} onClose={() => setPaletteOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default Navigation;
