import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomePage from './components/HomePage';
import Footer from './components/Footer';
import ComingSoon from './components/ComingSoon';
import MaintenanceScreen from './components/MaintenanceScreen';
import { isMaintenanceLocked } from './lib/maintenance';
import { PAGES_WITH_SUBPAGES, DEFAULT_SUBPAGE, parseUrlToState, stateToUrl } from './lib/routes';

// Route-level code splitting. The shell (Sidebar, TopBar, Footer, HomePage,
// ComingSoon) loads eagerly; every other page — and the heavy data it imports
// (grammar curriculum, reading-passage catalogues, etc.) — ships in its own
// chunk that downloads only when that route is opened. Keeps the initial bundle
// small so the app loads fast, including when returning from a standalone test.
const CommandPalette = lazy(() => import('./components/CommandPalette'));
const SpeakingPage = lazy(() => import('./components/SpeakingPage'));
const ListeningPage = lazy(() => import('./components/ListeningPage'));
const ReadingPage = lazy(() => import('./components/ReadingPage'));
const GrammarPage = lazy(() => import('./components/GrammarPage'));
const WritingPage = lazy(() => import('./components/WritingPage'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const HistoryPage = lazy(() => import('./components/HistoryPage'));
const AdminUsersPage = lazy(() => import('./components/admin/AdminUsersPage'));
const ReadingTestRoute = lazy(() => import('./components/reading/ReadingTestRoute'));
const ListeningTestRoute = lazy(() => import('./components/listening/ListeningTestRoute'));
const Onboarding = lazy(() => import('./components/Onboarding'));

const App = () => {
  const initial = parseUrlToState();
  const [currentPage, setCurrentPage] = useState(initial.page);
  const [subPages, setSubPages] = useState({
    speaking: initial.page === 'speaking' && initial.subPage ? initial.subPage : DEFAULT_SUBPAGE.speaking,
    listening: initial.page === 'listening' && initial.subPage ? initial.subPage : DEFAULT_SUBPAGE.listening,
    reading: initial.page === 'reading' && initial.subPage ? initial.subPage : DEFAULT_SUBPAGE.reading,
    grammar: initial.page === 'grammar' && initial.subPage ? initial.subPage : DEFAULT_SUBPAGE.grammar,
    writing: initial.page === 'writing' && initial.subPage ? initial.subPage : DEFAULT_SUBPAGE.writing,
  });
  const { loading, user, profile } = useAuth();

  // App-shell UI state: sidebar collapse (persisted), mobile drawer, palette.
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('iw.v1.navCollapsed') === '1'; } catch { return false; }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('iw.v1.navCollapsed', collapsed ? '1' : '0'); } catch { /* storage off */ }
  }, [collapsed]);

  // Global ⌘K / Ctrl-K toggles the command palette from anywhere.
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

  useEffect(() => {
    const handlePopState = () => {
      const { page, subPage } = parseUrlToState();
      setCurrentPage(page);
      if (PAGES_WITH_SUBPAGES.has(page)) {
        setSubPages(prev => ({ ...prev, [page]: subPage }));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page, subPage, query) => {
    const resolvedSub = subPage || DEFAULT_SUBPAGE[page] || null;
    const url = stateToUrl(page, resolvedSub) + (query ? `?${query}` : '');
    window.history.pushState({}, '', url);
    setCurrentPage(page);
    if (PAGES_WITH_SUBPAGES.has(page) && resolvedSub) {
      setSubPages(prev => ({ ...prev, [page]: resolvedSub }));
    }
  };

  const updateSubPage = (page) => (subPage) => {
    window.history.pushState({}, '', stateToUrl(page, subPage));
    setSubPages(prev => ({ ...prev, [page]: subPage }));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage setCurrentPage={navigateTo} />;
      case 'speaking': return <SpeakingPage subPage={subPages.speaking} setSubPage={updateSubPage('speaking')} />;
      case 'listening': return <ListeningPage subPage={subPages.listening} setSubPage={updateSubPage('listening')} setCurrentPage={navigateTo} />;
      case 'reading': return <ReadingPage subPage={subPages.reading} setSubPage={updateSubPage('reading')} setCurrentPage={navigateTo} />;
      case 'grammar': return <GrammarPage subPage={subPages.grammar} setSubPage={updateSubPage('grammar')} />;
      case 'writing': return <WritingPage subPage={subPages.writing} setSubPage={updateSubPage('writing')} setCurrentPage={navigateTo} />;
      case 'vocabulary': return <ComingSoon section="vocabulary" />;
      case 'articles': return <ComingSoon section="articles" />;
      case 'dictation': return <ComingSoon section="dictation" />;
      case 'login': return <AuthPage type="login" setCurrentPage={navigateTo} />;
      case 'signup': return <AuthPage type="signup" setCurrentPage={navigateTo} />;
      case 'dashboard': return <Dashboard setCurrentPage={navigateTo} />;
      case 'history': return <HistoryPage setCurrentPage={navigateTo} />;
      case 'admin': return <AdminUsersPage setCurrentPage={navigateTo} />;
      case 'reading-test': {
        // /reading-test/<slug>            → take the test
        // /reading-test/<slug>/review     → review a saved attempt
        const parts = window.location.pathname.split('/').filter(Boolean);
        const slug = parts[1];
        const review = parts[2] === 'review';
        return <ReadingTestRoute key={`${slug}:${review}`} slug={slug} review={review} onExit={() => navigateTo('reading', 'full')} />;
      }
      case 'listening-test': {
        // /listening-test/<slug> → take the test; /listening-test/<slug>/review → review
        const parts = window.location.pathname.split('/').filter(Boolean);
        const slug = parts[1];
        const review = parts[2] === 'review';
        return <ListeningTestRoute key={`${slug}:${review}`} slug={slug} review={review} onExit={() => navigateTo('listening', 'hub')} />;
      }
      default: return <HomePage setCurrentPage={navigateTo} />;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner" />
      </div>
    );
  }

  // First-run onboarding: a signed-in user who hasn't completed onboarding gets
  // the questionnaire as a full-screen takeover before anything else. (Guarded
  // on === false so it stays hidden until the profile row actually carries the
  // flag — never on a still-loading or pre-migration profile.)
  if (user && profile && profile.onboarded === false) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div className="spinner" /></div>}>
        <Onboarding />
      </Suspense>
    );
  }

  // The reading / listening test players are full-screen takeovers — no app shell.
  const fullscreen = currentPage === 'reading-test' || currentPage === 'listening-test';
  // Hide the footer on auth screens so it doesn't push the form below the fold.
  const showFooter = !['login', 'signup'].includes(currentPage) && !fullscreen;

  const pageContent = (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
      {renderPage()}
    </Suspense>
  );

  if (fullscreen) {
    return <main id="main">{pageContent}</main>;
  }

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className={`app-shell${collapsed ? ' is-collapsed' : ''}${mobileNavOpen ? ' is-mobile-open' : ''}`}>
        <Sidebar
          currentPage={currentPage}
          navigate={navigateTo}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        {mobileNavOpen && <div className="sidebar-backdrop" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />}
        <div className="app-main">
          <TopBar
            navigate={navigateTo}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <main id="main">{pageContent}</main>
          {showFooter && <Footer setCurrentPage={navigateTo} />}
        </div>
      </div>
      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette navigateTo={navigateTo} onClose={() => setPaletteOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

const AppWithProviders = () => (
  <ThemeProvider>
    {isMaintenanceLocked() ? (
      // Full-site lock during the accounts rebuild — no auth, no routes mount.
      <MaintenanceScreen />
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </ThemeProvider>
);

export default AppWithProviders;
