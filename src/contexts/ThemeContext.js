import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Theme model:
//   * Persist the user's *choice* — null (auto), 'light', or 'dark'.
//   * Effective theme = override || OS preference.
//   * When in auto, subscribe to OS changes and re-render live.
//   * The previous version wrote 'dark' to localStorage on every render, which
//     silently broke auto mode for everyone after their first visit.

const KEY = 'iw.v1.themeOverride';

const getOverride = () => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {}
  return null;
};

const getSystem = () =>
  (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true) ? 'dark' : 'light';

const ThemeContext = createContext({});
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [override, setOverride] = useState(getOverride);  // null | 'light' | 'dark'
  const [system,   setSystem]   = useState(getSystem);

  // Re-render when the OS preference flips (only meaningful in auto mode).
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light');
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange); // Safari < 14
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const effective = override || system;
  const isDark = effective === 'dark';

  // Apply to DOM + write only the override, never the resolved value.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effective);
    document.body.setAttribute('data-theme', effective);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#09090b' : '#ffffff');
    try {
      if (override) localStorage.setItem(KEY, override);
      else localStorage.removeItem(KEY);
    } catch {}
  }, [effective, isDark, override]);

  const value = useMemo(() => ({
    isDark,
    isAuto: override === null,
    effective,
    // Toggle behaviour: cycles dark → light → auto → dark…
    // (Most users just want "the other one"; auto sits at the back of the
    // cycle so it's discoverable but not in the way of a quick flip.)
    toggleTheme: () => setOverride(prev => {
      if (prev === null)    return isDark ? 'light' : 'dark';
      if (prev === 'dark')  return 'light';
      if (prev === 'light') return null;
      return null;
    }),
    setAuto:  () => setOverride(null),
    setLight: () => setOverride('light'),
    setDark:  () => setOverride('dark'),
  }), [isDark, override, effective]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
