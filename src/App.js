import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import Footer from './components/Footer';
import MaintenanceScreen from './components/MaintenanceScreen';
import { isMaintenanceLocked } from './lib/maintenance';
import { PAGES_WITH_SUBPAGES, DEFAULT_SUBPAGE, parseUrlToState, stateToUrl } from './lib/routes';

// Route-level code splitting. The shell (Navigation, Footer, HomePage) loads
// eagerly; every other page — and the heavy data it imports (grammar
// curriculum, reading-passage catalogues, etc.) — ships in its own chunk that
// downloads only when that route is opened. Keeps the initial bundle small so
// the app loads fast, including when returning from a standalone test page.
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
  const { loading } = useAuth();

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

  // The reading test player is a full-screen takeover — no app nav/footer.
  const fullscreen = currentPage === 'reading-test';
  // Hide the footer on auth screens so it doesn't push the form below the fold.
  const showFooter = !['login', 'signup'].includes(currentPage) && !fullscreen;

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      {!fullscreen && <Navigation currentPage={currentPage} setCurrentPage={navigateTo} />}
      <main id="main">
        <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
          {renderPage()}
        </Suspense>
      </main>
      {showFooter && <Footer setCurrentPage={navigateTo} />}
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
