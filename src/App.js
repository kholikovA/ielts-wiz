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

// ==================== URL ROUTING ====================
const parseUrlToState = () => {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  
  if (parts.length === 0 || parts[0] === 'home') {
    return { page: 'home', subPage: 'overview' };
  }
  
  const page = parts[0];
  const subPage = parts[1] || 'overview';
  
  return { page, subPage };
};

const stateToUrl = (page, subPage) => {
  if (page === 'home') return '/';
  if (subPage && subPage !== 'overview') return `/${page}/${subPage}`;
  return `/${page}`;
};

// ==================== MAIN APP ====================

// ==================== MAIN APP ====================
const App = () => {
  const [currentPage, setCurrentPage] = useState(() => parseUrlToState().page);
  const [speakingSubPage, setSpeakingSubPage] = useState(() => {
    const { page, subPage } = parseUrlToState();
    return page === 'speaking' ? subPage : 'overview';
  });
  const [listeningSubPage, setListeningSubPage] = useState(() => {
    const { page, subPage } = parseUrlToState();
    return page === 'listening' ? subPage : 'overview';
  });
  const [readingSubPage, setReadingSubPage] = useState(() => {
    const { page, subPage } = parseUrlToState();
    return page === 'reading' ? subPage : 'overview';
  });
  const { loading } = useAuth();

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { page, subPage } = parseUrlToState();
      setCurrentPage(page);
      if (page === 'speaking') setSpeakingSubPage(subPage);
      if (page === 'listening') setListeningSubPage(subPage);
      if (page === 'reading') setReadingSubPage(subPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when page changes
  const navigateTo = (page, subPage = 'overview') => {
    const url = stateToUrl(page, subPage);
    window.history.pushState({}, '', url);
    setCurrentPage(page);
    if (page === 'speaking') setSpeakingSubPage(subPage);
    if (page === 'listening') setListeningSubPage(subPage);
    if (page === 'reading') setReadingSubPage(subPage);
  };

  // Update URL when subpage changes
  const updateSubPage = (page, subPage) => {
    const url = stateToUrl(page, subPage);
    window.history.pushState({}, '', url);
    if (page === 'speaking') setSpeakingSubPage(subPage);
    if (page === 'listening') setListeningSubPage(subPage);
    if (page === 'reading') setReadingSubPage(subPage);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage setCurrentPage={navigateTo} />;
      case 'speaking': return <SpeakingPage subPage={speakingSubPage} setSubPage={(sp) => updateSubPage('speaking', sp)} />;
      case 'listening': return <ListeningPage subPage={listeningSubPage} setSubPage={(sp) => updateSubPage('listening', sp)} setCurrentPage={setCurrentPage} />;
      case 'reading': return <ReadingPage subPage={readingSubPage} setSubPage={(sp) => updateSubPage('reading', sp)} setCurrentPage={setCurrentPage} />;
      case 'grammar': return <GrammarPage />;
      case 'writing': return <PlaceholderPage title="Writing Section" description="Task 1 & Task 2 with model essays. Coming soon!" icon="✍️" />;
      case 'login': return <AuthPage type="login" setCurrentPage={navigateTo} />;
      case 'signup': return <AuthPage type="signup" setCurrentPage={navigateTo} />;
      case 'dashboard': return <Dashboard setCurrentPage={navigateTo} />;
      default: return <HomePage setCurrentPage={navigateTo} />;
    }
  };

  // Reset sub-pages when changing main page
  const handlePageChange = (page) => {
    navigateTo(page, 'overview');
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div className="spinner" /></div>;

  return <div><Navigation currentPage={currentPage} setCurrentPage={handlePageChange} />{renderPage()}</div>;
};


const AppWithProviders = () => (<ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider>);

export default AppWithProviders;
