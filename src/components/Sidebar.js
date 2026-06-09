import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import Icon from './ui/icons';
import AppLink from './ui/AppLink';
import { hrefFor } from '../lib/routes';
import { NAV_GROUPS, getResumeTarget } from '../lib/navConfig';

// The persistent left navigation pane. On desktop it's a fixed rail that can
// collapse to icons; below 1024px it becomes an off-canvas drawer toggled from
// the top bar.
export default function Sidebar({ currentPage, navigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const ref = useRef(null);

  // Drawer behaviour (mobile only): lock background scroll, trap focus, close on
  // Escape, and restore focus to whatever opened it.
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    const focusablesIn = () => Array.from(
      ref.current?.querySelectorAll('a[href], button:not([disabled])') || []
    );
    focusablesIn()[0]?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseMobile(); return; }
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
  }, [mobileOpen, onCloseMobile]);

  const go = (page, subPage) => { navigate(page, subPage); onCloseMobile(); };
  const resume = user ? getResumeTarget() : null;

  const renderLink = (item) => {
    const active = currentPage === item.id;
    return (
      <AppLink
        key={item.id}
        href={hrefFor(item.id)}
        onNavigate={() => go(item.id)}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
        className={`sidebar-link${active ? ' is-active' : ''}`}
      >
        <Icon name={item.icon} size={20} className="sidebar-link-icon" />
        <span className="sidebar-link-label">{item.label}</span>
        {item.comingSoon && <span className="soon-tag">Soon</span>}
      </AppLink>
    );
  };

  return (
    <aside ref={ref} className="app-sidebar" aria-label="Main navigation">
      <div className="sidebar-head">
        <span className="sidebar-brand">
          <Logo onNavigate={() => go('home')} />
        </span>
        <button type="button" className="nav-icon-btn sidebar-collapse" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Icon name="panelLeft" size={18} />
        </button>
        <button type="button" className="nav-icon-btn sidebar-close" onClick={onCloseMobile} aria-label="Close navigation">
          <Icon name="close" size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map(group => (
          <div key={group.title} className="sidebar-group">
            <div className="sidebar-group-label">{group.title}</div>
            {group.items.map(renderLink)}
          </div>
        ))}
      </nav>

      {resume && (
        <div className="sidebar-foot">
          <AppLink
            href={hrefFor(resume.page, resume.subPage)}
            onNavigate={() => go(resume.page, resume.subPage)}
            className="sidebar-resume"
            title={`Continue: ${resume.label}`}
          >
            <Icon name="play" size={18} className="sidebar-link-icon" />
            <span className="sidebar-link-label">
              <strong>Continue</strong>
              <small>{resume.label}</small>
            </span>
          </AppLink>
        </div>
      )}
    </aside>
  );
}
