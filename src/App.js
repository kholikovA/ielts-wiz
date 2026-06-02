import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import SpeakingPage from './components/SpeakingPage';
import ListeningPage from './components/ListeningPage';
import ReadingPage from './components/ReadingPage';
import GrammarPage from './components/GrammarPage';
import WritingPage from './components/WritingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import HistoryPage from './components/HistoryPage';
import AdminUsersPage from './components/admin/AdminUsersPage';
import Footer from './components/Footer';

const PAGES_WITH_SUBPAGES = new Set(['speaking', 'listening', 'reading', 'grammar', 'writing']);

// Default subPage when a section is opened without one in the URL.
// The skill landing pages now land directly on practice (not an overview).
const DEFAULT_SUBPAGE = {
  speaking: 'part1-2026',
  listening: 'hub',
  reading: 'hub',
  grammar: 'hub',
  writing: 'practice',
};

const parseUrlToState = () => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] === 'home') return { page: 'home', subPage: null };
  const page = parts[0];
  const subPage = parts[1] || DEFAULT_SUBPAGE[page] || null;
  return { page, subPage };
};

const stateToUrl = (page, subPage) => {
  if (page === 'home') return '/';
  if (subPage && subPage !== DEFAULT_SUBPAGE[page]) return `/${page}/${subPage}`;
  return `/${page}`;
};

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

  const navigateTo = (page, subPage) => {
    const resolvedSub = subPage || DEFAULT_SUBPAGE[page] || null;
    window.history.pushState({}, '', stateToUrl(page, resolvedSub));
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

  // Hide the footer on auth screens so it doesn't push the form below the fold.
  const showFooter = !['login', 'signup'].includes(currentPage);

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <Navigation currentPage={currentPage} setCurrentPage={navigateTo} />
      <main id="main">{renderPage()}</main>
      {showFooter && <Footer setCurrentPage={navigateTo} />}
    </>
  );
};

const AppWithProviders = () => (
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);

export default AppWithProviders;
