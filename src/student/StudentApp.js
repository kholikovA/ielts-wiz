import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from '../components/Logo';
import Icon from '../components/ui/icons';
import AppLink from '../components/ui/AppLink';
import { mainSiteUrl } from '../lib/host';
import { HubContext, EmptyPanel } from './ui';
import './StudentApp.css';

// Student Hub — served at student.ielts-wiz.com (see lib/host.js). Same Supabase
// accounts as the main site, different shell. Students get homework, progress
// and flashcards; teachers (profiles.is_teacher, or admins) also get Teaching:
// classes with join codes, students, and homework they assign and review.

const AuthPage = lazy(() => import('../components/AuthPage'));
const Onboarding = lazy(() => import('../components/Onboarding'));
const ReadingTestRoute = lazy(() => import('../components/reading/ReadingTestRoute'));
const ListeningTestRoute = lazy(() => import('../components/listening/ListeningTestRoute'));
const StudentPages = () => import('./StudentPages');
const TeacherPages = () => import('./TeacherPages');
const page = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const Overview = page(StudentPages, 'Overview');
const HomeworkList = page(StudentPages, 'HomeworkList');
const HomeworkDetail = page(StudentPages, 'HomeworkDetail');
const Progress = page(StudentPages, 'Progress');
const Flashcards = page(StudentPages, 'Flashcards');
const JoinPage = page(StudentPages, 'JoinPage');
const Classes = page(TeacherPages, 'Classes');
const ClassDetail = page(TeacherPages, 'ClassDetail');
const Students = page(TeacherPages, 'Students');
const StudentDetail = page(TeacherPages, 'StudentDetail');
const Assignments = page(TeacherPages, 'Assignments');
const NewAssignment = page(TeacherPages, 'NewAssignment');
const AssignmentDetail = page(TeacherPages, 'AssignmentDetail');

const STUDY_NAV = [
  { path: '/',           label: 'Overview',   icon: 'layout' },
  { path: '/homework',   label: 'Homework',   icon: 'edit' },
  { path: '/progress',   label: 'Progress',   icon: 'trending' },
  { path: '/flashcards', label: 'Flashcards', icon: 'layers' },
];
const TEACH_NAV = [
  { path: '/teach/assignments', label: 'Homework', icon: 'checkCircle' },
  { path: '/teach/classes',     label: 'Classes',  icon: 'users' },
  { path: '/teach/students',    label: 'Students', icon: 'graduation' },
];

const segments = () => window.location.pathname.split('/').filter(Boolean);

const Spinner = ({ full }) => (
  <div className={full ? 'hub-loading hub-loading--full' : 'hub-loading'}><div className="spinner" /></div>
);

function route(parts, isTeacher) {
  const [a, b, c] = parts;
  if (!a || a === 'dashboard') return <Overview />;
  if (a === 'join' && b) return <JoinPage code={b} />;
  if (a === 'homework') return b ? <HomeworkDetail id={b} /> : <HomeworkList />;
  if (a === 'progress') return <Progress />;
  if (a === 'flashcards') return <Flashcards deckId={b} />;
  if (a === 'teach') {
    if (!isTeacher) return <EmptyPanel icon="xCircle" title="Teachers only" lead="Ask an admin to give your account teacher access." />;
    if (b === 'classes') return c ? <ClassDetail id={c} /> : <Classes />;
    if (b === 'students') return c ? <StudentDetail id={c} /> : <Students />;
    if (c === 'new') return <NewAssignment />;
    return c ? <AssignmentDetail id={c} /> : <Assignments />;
  }
  return <Overview />;
}

export default function StudentApp() {
  const { loading, user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [parts, setParts] = useState(segments);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTeacher = Boolean(profile?.is_teacher || profile?.is_admin);

  useEffect(() => {
    document.title = 'Student Hub · IELTS Wiz';
    const onPop = () => setParts(segments());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((path) => {
    window.history.pushState({}, '', path);
    setParts(segments());
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const ctx = useMemo(() => ({ go, user, profile, isTeacher }), [go, user, profile, isTeacher]);

  if (loading) return <Spinner full />;

  if (!user) {
    // OAuth returns to `next` on this same origin, so the session lands on the hub
    // (and a /join/<code> link survives sign-in).
    if (!new URLSearchParams(window.location.search).has('next')) {
      const back = parts[0] === 'login' ? '/' : window.location.pathname;
      window.history.replaceState({}, '', `/login?next=${encodeURIComponent(back)}`);
    }
    return <Suspense fallback={<Spinner full />}><AuthPage type="login" setCurrentPage={() => {}} /></Suspense>;
  }

  if (profile && profile.onboarded === false) {
    return <Suspense fallback={<Spinner full />}><Onboarding /></Suspense>;
  }

  // Assigned tests open in the full-screen players, on this origin so the
  // student's hub session records the attempt.
  if (parts[0] === 'reading-test' || parts[0] === 'listening-test') {
    const Player = parts[0] === 'reading-test' ? ReadingTestRoute : ListeningTestRoute;
    const review = parts[2] === 'review';
    return (
      <main id="main">
        <Suspense fallback={<Spinner full />}>
          <Player key={`${parts[1]}:${review}`} slug={parts[1]} review={review} onExit={() => go('/homework')} />
        </Suspense>
      </main>
    );
  }

  const here = `/${parts.join('/')}`;
  const isActive = (path) => (path === '/' ? here === '/' || parts[0] === 'dashboard' : here === path || here.startsWith(`${path}/`));
  const link = (n) => (
    <AppLink key={n.path} href={n.path} onNavigate={() => go(n.path)}
      aria-current={isActive(n.path) ? 'page' : undefined}
      className={`sidebar-link${isActive(n.path) ? ' is-active' : ''}`}>
      <Icon name={n.icon} size={20} className="sidebar-link-icon" />
      <span className="sidebar-link-label">{n.label}</span>
    </AppLink>
  );

  return (
    <HubContext.Provider value={ctx}>
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className={`app-shell${mobileOpen ? ' is-mobile-open' : ''}`}>
        <aside className="app-sidebar" aria-label="Student Hub navigation">
          <div className="sidebar-head">
            <span className="sidebar-brand"><Logo onNavigate={() => go('/')} /></span>
            <button type="button" className="nav-icon-btn sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
              <Icon name="close" size={18} />
            </button>
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-group">
              <div className="sidebar-group-label">Study</div>
              {STUDY_NAV.map(link)}
            </div>
            {isTeacher && (
              <div className="sidebar-group">
                <div className="sidebar-group-label">Teaching</div>
                {TEACH_NAV.map(link)}
              </div>
            )}
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
            <span className="hub-me">{profile?.name || user.email}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => signOut().then(() => go('/'))}>
              <Icon name="logout" size={16} /> Log out
            </button>
          </header>
          <main id="main" className="page-shell">
            <div className="page-section">
              <Suspense fallback={<Spinner />}>{route(parts, isTeacher)}</Suspense>
            </div>
          </main>
        </div>
      </div>
    </HubContext.Provider>
  );
}
