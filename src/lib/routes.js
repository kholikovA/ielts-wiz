// Single source of truth for page ⇄ URL mapping, shared by App.js (the router)
// and AppLink (so links render the same real URLs the router produces).

export const PAGES_WITH_SUBPAGES = new Set(['speaking', 'listening', 'reading', 'grammar', 'writing']);

// Default subPage when a section is opened without one in the URL.
export const DEFAULT_SUBPAGE = {
  speaking: 'part1-2026',
  listening: 'hub',
  reading: 'hub',
  grammar: 'hub',
  writing: 'practice',
};

export const parseUrlToState = () => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] === 'home') return { page: 'home', subPage: null };
  const page = parts[0];
  const subPage = parts[1] || DEFAULT_SUBPAGE[page] || null;
  return { page, subPage };
};

export const stateToUrl = (page, subPage) => {
  if (page === 'home') return '/';
  if (subPage && subPage !== DEFAULT_SUBPAGE[page]) return `/${page}/${subPage}`;
  return `/${page}`;
};

// Convenience alias for link hrefs.
export const hrefFor = (page, subPage) => stateToUrl(page, subPage);
