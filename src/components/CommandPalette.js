import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Icon from './ui/icons';
import { SKILLS, ACCOUNT_LINKS } from '../lib/navConfig';
// Catalogue metadata for jump-to-test entries. Imported here (a lazy chunk)
// rather than in navConfig so the eager shell never pulls test specs.
import { READING_TESTS, LISTENING_TESTS } from '../data/tests/manifest';

const SOURCE_LABEL = { volume9: 'Volume 9', cambridge20: 'Cambridge 20' };

// Renders nothing of its own when not mounted — the parent only mounts this
// while the palette is open, so mount === open. `onClose` tears it down.
export default function CommandPalette({ navigateTo, onClose }) {
  const { user, isAdmin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  const go = (page, subPage) => { navigateTo(page, subPage); onClose(); };

  // Full destination set, grouped in display order. Cheap to rebuild; only ever
  // built while the palette is open.
  const items = useMemo(() => {
    const out = [];
    // Navigate
    out.push({ id: 'go-home', group: 'Navigate', icon: 'sparkle', label: 'Home', keywords: 'landing start', run: () => go('home') });
    SKILLS.forEach(s => out.push({ id: `go-${s.id}`, group: 'Navigate', icon: s.icon, label: s.label, keywords: 'skill section', run: () => go(s.id) }));
    if (user) ACCOUNT_LINKS.forEach(a => out.push({ id: `go-${a.id}`, group: 'Navigate', icon: a.icon, label: a.label, keywords: 'account progress stats', run: () => go(a.id) }));
    if (isAdmin) out.push({ id: 'go-admin', group: 'Navigate', icon: 'user', label: 'Admin · Users', keywords: 'admin manage users', run: () => go('admin') });

    // Practice — the high-traffic sub-destinations.
    const practice = [
      { skill: 'listening', sub: 'parts', label: 'Listening · Part practice' },
      { skill: 'reading', sub: 'parts', label: 'Reading · Part practice' },
      { skill: 'reading', sub: 'cambridge', label: 'Reading · Cambridge IELTS' },
      { skill: 'reading', sub: 'full', label: 'Reading · Full tests' },
      { skill: 'speaking', sub: 'part1-2026', label: 'Speaking · Part 1' },
      { skill: 'speaking', sub: 'part2-2026', label: 'Speaking · Part 2' },
      { skill: 'speaking', sub: 'part3-2026', label: 'Speaking · Part 3' },
      { skill: 'writing', sub: 'practice', label: 'Writing · Practice' },
    ];
    practice.forEach((p, i) => out.push({ id: `prac-${i}`, group: 'Practice', icon: 'play', label: p.label, keywords: 'practice', run: () => go(p.skill, p.sub) }));

    // Jump straight to an in-app test player.
    READING_TESTS.forEach(t => out.push({ id: `rt-${t.id}`, group: 'Reading tests', icon: 'book', label: `${SOURCE_LABEL[t.source] || t.source} · Test ${t.n}`, keywords: 'reading test full', run: () => go('reading-test', t.slug) }));
    LISTENING_TESTS.forEach(t => out.push({ id: `lt-${t.id}`, group: 'Listening tests', icon: 'headphones', label: `Listening practice · Test ${t.n}`, keywords: 'listening test', run: () => go('listening-test', t.slug) }));

    // Actions
    out.push({ id: 'act-theme', group: 'Actions', icon: isDark ? 'sun' : 'moon', label: isDark ? 'Switch to light mode' : 'Switch to dark mode', keywords: 'theme appearance dark light', run: () => { toggleTheme(); onClose(); } });
    if (user) out.push({ id: 'act-signout', group: 'Actions', icon: 'logout', label: 'Log out', keywords: 'sign out logout', run: () => { signOut().then(() => navigateTo('home')); onClose(); } });
    else out.push({ id: 'act-signin', group: 'Actions', icon: 'user', label: 'Sign in', keywords: 'login sign in account', run: () => go('login') });
    return out;
    // go/run capture current props; rebuilding on every open is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, isDark]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      it.label.toLowerCase().includes(q) ||
      it.group.toLowerCase().includes(q) ||
      (it.keywords && it.keywords.includes(q))
    );
  }, [items, query]);

  // Keep selection in range as the result set shrinks/grows.
  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => {
    if (selected > filtered.length - 1) setSelected(Math.max(0, filtered.length - 1));
  }, [filtered.length, selected]);

  // Autofocus the input and lock background scroll for the lifetime of the open
  // palette.
  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Scroll the active row into view as the user arrows through.
  useEffect(() => {
    itemRefs.current[selected]?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(i => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(i => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[selected]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  itemRefs.current = [];
  let lastGroup = null;

  return (
    <div className="cmdk-backdrop" onMouseDown={onClose} role="presentation">
      <div
        className="cmdk-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search and jump to"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cmdk-search">
          <Icon name="search" size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="cmdk-input"
            type="text"
            placeholder="Search skills, tests, settings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="cmdk-esc">esc</kbd>
        </div>

        <div className="cmdk-list" ref={listRef} role="listbox">
          {filtered.length === 0 && (
            <div className="cmdk-empty">No results for “{query}”</div>
          )}
          {filtered.map((it, i) => {
            const header = it.group !== lastGroup ? (lastGroup = it.group) : null;
            return (
              <React.Fragment key={it.id}>
                {header && <div className="cmdk-group">{header}</div>}
                <button
                  ref={(el) => (itemRefs.current[i] = el)}
                  type="button"
                  role="option"
                  aria-selected={i === selected}
                  className={`cmdk-item${i === selected ? ' is-active' : ''}`}
                  onMouseMove={() => setSelected(i)}
                  onClick={() => it.run()}
                >
                  <Icon name={it.icon} size={16} className="cmdk-item-icon" />
                  <span className="cmdk-item-label">{it.label}</span>
                  {i === selected && <Icon name="cornerDownLeft" size={14} className="cmdk-item-enter" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
