import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import SpeakingPage from './components/SpeakingPage';
import ListeningPage from './components/ListeningPage';
import ReadingPage from './components/ReadingPage';
import GrammarPage from './components/GrammarPage';
import PlaceholderPage from './components/PlaceholderPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

const PAGES_WITH_SUBPAGES = new Set(['speaking', 'listening', 'reading']);

const parseUrlToState = () => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] === 'home') return { page: 'home', subPage: 'overview' };
  return { page: parts[0], subPage: parts[1] || 'overview' };
};

const stateToUrl = (page, subPage) => {
  if (page === 'home') return '/';
  if (subPage && subPage !== 'overview') return `/${page}/${subPage}`;
  return `/${page}`;
};

const App = () => {
  const initial = parseUrlToState();
  const [currentPage, setCurrentPage] = useState(initial.page);
  const [subPages, setSubPages] = useState({
    speaking: initial.page === 'speaking' ? initial.subPage : 'overview',
    listening: initial.page === 'listening' ? initial.subPage : 'overview',
    reading: initial.page === 'reading' ? initial.subPage : 'overview',
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

  const navigateTo = (page, subPage = 'overview') => {
    window.history.pushState({}, '', stateToUrl(page, subPage));
    setCurrentPage(page);
    if (PAGES_WITH_SUBPAGES.has(page)) {
      setSubPages(prev => ({ ...prev, [page]: subPage }));
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
      case 'grammar': return <GrammarPage />;
      case 'writing': return <PlaceholderPage title="Writing Section" description="Task 1 & Task 2 with model essays. Coming soon!" icon="✍️" />;
      case 'login': return <AuthPage type="login" setCurrentPage={navigateTo} />;
      case 'signup': return <AuthPage type="signup" setCurrentPage={navigateTo} />;
      case 'dashboard': return <Dashboard setCurrentPage={navigateTo} />;
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

  return (
    <>
      <Navigation currentPage={currentPage} setCurrentPage={navigateTo} />
      {renderPage()}
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
