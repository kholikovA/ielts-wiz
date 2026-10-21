import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from '../components/Logo';
import Icon from '../components/ui/icons';
import AppLink from '../components/ui/AppLink';
import PageHeader from '../components/ui/PageHeader';
import { mainSiteUrl } from '../lib/host';
import './StudentApp.css';

// Student Hub — served at student.ielts-wiz.com (see lib/host.js). Same Supabase
// accounts as the main site, different shell: homework, progress tracking and
// study tools like flashcards rather than the open practice catalogue.

const AuthPage = lazy(() => import('../components/AuthPage'));
const Onboarding = lazy(() => import('../components/Onboarding'));

const HUB_NAV = [
  { id: 'overview',   label: 'Overview',   icon: 'layout',   path: '/' },
  { id: 'homework',   label: 'Homework',   icon: 'edit',     path: '/homework' },
  { id: 'progress',   label: 'Progress',   icon: 'trending', path: '/progress' },
  { id: 'flashcards', label: 'Flashcards', icon: 'layers',   path: '/flashcards' },
];

const pageFromPath = () => {
  const seg = window.location.pathname.split('/').filter(Boolean)[0];
  if (seg === 'login') return 'login';
  return HUB_NAV.some(n => n.id === seg) ? seg : 'overview';
};

const pathFor = (id) => HUB_NAV.find(n => n.id === id)?.path || '/';

const Spinner = ({ full }) => (
  <div className={full ? 'hub-loading hub-loading--full' : 'hub-loading'}><div className="spinner" /></div>
);

function EmptyPanel({ icon, title, lead }) {
  return (
    <div className="card hub-empty">
      <div className="coming-soon-icon"><Icon name={icon} size={28} /></div>
      <h2>{title}</h2>
      <p>{lead}</p>
    </div>
  );
}

function Overview({ profile, navigate }) {
  const first = profile?.name?.split(' ')[0];
  return (
    <>
      <PageHeader eyebrow="Student Hub" title={first ? `Welcome back, ${first}.` : 'Welcome back.'} lead="Your homework, progress and study tools in one place." />
      <div className="hub-grid">
        {HUB_NAV.filter(n => n.id !== 'overview').map(n => (
          <AppLink key={n.id} href={n.path} onNavigate={() => navigate(n.id)} className="card card-interactive hub-tile">
            <Icon name={n.icon} size={22} />
            <strong>{n.label}</strong>
            <Icon name="arrowRight" size={16} className="hub-tile-arrow" />
          </AppLink>
        ))}
        <a href={mainSiteUrl('/')} className="card card-interactive hub-tile">
          <Icon name="target" size={22} />
          <strong>Practice tests</strong>
          <Icon name="arrowRight" size={16} className="hub-tile-arrow" />
        </a>
      </div>
    </>
  );
}

function HubPage({ page, profile, navigate }) {
  switch (page) {
    case 'homework':
      return (
        <>
          <PageHeader eyebrow="Homework" title="Your assignments" lead="Tasks set by your teacher, with due dates and feedback." />
          <EmptyPanel icon="edit" title="No homework yet" lead="When your teacher assigns work it will show up here." />
        </>
      );
    case 'progress':
      return (
        <>
          <PageHeader eyebrow="Progress" title="Track your progress" lead="Band scores and activity across Listening, Reading, Writing and Speaking." />
          <EmptyPanel icon="trending" title="Nothing to show yet" lead="Completed tests and homework will build your progress here." />
        </>
      );
    case 'flashcards':
      return (
        <>
          <PageHeader eyebrow="Flashcards" title="Learn with flashcards" lead="Review vocabulary and key phrases with spaced repetition." />
          <EmptyPanel icon="layers" title="Coming soon" lead="Flashcard decks are on the way." />
        </>
      );
    default:
      return <Overview profile={profile} navigate={navigate} />;
  }
}

export default function StudentApp() {
  const { loading, user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [page, setPage] = useState(pageFromPath);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = 'Student Hub · IELTS Wiz';
    const onPop = () => setPage(pageFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (id) => {
    window.history.pushState({}, '', pathFor(id));
    setPage(id);
    setMobileOpen(false);
  };

  if (loading) return <Spinner full />;

  if (!user) {
    // OAuth returns to `next` on this same origin, so the session lands on the hub.
    if (!new URLSearchParams(window.location.search).has('next')) {
      window.history.replaceState({}, '', `/login?next=${encodeURIComponent(page === 'login' ? '/' : pathFor(page))}`);
    }
    return <Suspense fallback={<Spinner full />}><AuthPage type="login" setCurrentPage={() => {}} /></Suspense>;
  }

  if (profile && profile.onboarded === false) {
    return <Suspense fallback={<Spinner full />}><Onboarding /></Suspense>;
  }

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className={`app-shell${mobileOpen ? ' is-mobile-open' : ''}`}>
        <aside className="app-sidebar" aria-label="Student Hub navigation">
          <div className="sidebar-head">
            <span className="sidebar-brand"><Logo onNavigate={() => navigate('overview')} /></span>
            <button type="button" className="nav-icon-btn sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
              <Icon name="close" size={18} />
            </button>
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-group">
              <div className="sidebar-group-label">Student Hub</div>
              {HUB_NAV.map(n => (
                <AppLink
                  key={n.id}
                  href={n.path}
                  onNavigate={() => navigate(n.id)}
                  aria-current={page === n.id ? 'page' : undefined}
                  className={`sidebar-link${page === n.id ? ' is-active' : ''}`}
                >
                  <Icon name={n.icon} size={20} className="sidebar-link-icon" />
                  <span className="sidebar-link-label">{n.label}</span>
                </AppLink>
              ))}
            </div>
            <div className="sidebar-group">
              <div className="sidebar-group-label">IELTS Wiz</div>
              <a href={mainSiteUrl('/')} className="sidebar-link">
                <Icon name="target" size={20} className="sidebar-link-icon" />
                <span className="sidebar-link-label">Practice site</span>
              </a>
            </div>
          </nav>
        </aside>
        {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
        <div className="app-main">
          <header className="app-topbar">
            <button type="button" className="nav-icon-btn topbar-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Icon name="menu" size={20} />
            </button>
            <div className="topbar-spacer" />
            <button type="button" className="nav-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              <Icon name={isDark ? 'sun' : 'moon'} size={18} />
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => signOut().then(() => navigate('overview'))}>
              <Icon name="logout" size={16} /> Log out
            </button>
          </header>
          <main id="main" className="page-shell">
            <div className="page-section">
              <HubPage page={page} profile={profile} navigate={navigate} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
