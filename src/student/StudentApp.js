import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Icon from '../components/ui/icons';
import AppLink from '../components/ui/AppLink';
import { mainSiteUrl } from '../lib/host';
import * as api from './api';
import { HubContext, EmptyPanel, Avatar, Coin } from './ui';
import './hub.css';

// Student Hub — served at student.ielts-wiz.com (see lib/host.js). Same Supabase
// accounts as the main site, its own deliberately minimal design (hub.css).
// Students: dashboard, homework, flashcards, word games, progress, coins.
// Teachers (profiles.is_teacher, or admins) also get Teaching: homework
// (with scheduling), classes, attendance and students.

const AuthPage = lazy(() => import('../components/AuthPage'));
const Onboarding = lazy(() => import('../components/Onboarding'));
const ReadingTestRoute = lazy(() => import('../components/reading/ReadingTestRoute'));
const ListeningTestRoute = lazy(() => import('../components/listening/ListeningTestRoute'));
const pages = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const StudentPages = () => import('./StudentPages');
const TeacherPages = () => import('./TeacherPages');
const DashboardPages = () => import('./Dashboard');
const AttendancePages = () => import('./Attendance');
const CoinAdminPages = () => import('./CoinAdmin');

const Dashboard = pages(DashboardPages, 'Dashboard');
const CoinsPage = pages(DashboardPages, 'CoinsPage');
const HomeworkList = pages(StudentPages, 'HomeworkList');
const HomeworkDetail = pages(StudentPages, 'HomeworkDetail');
const Progress = pages(StudentPages, 'Progress');
const Flashcards = pages(StudentPages, 'Flashcards');
const JoinPage = pages(StudentPages, 'JoinPage');
const Games = lazy(() => import('./Games'));
const Classes = pages(TeacherPages, 'Classes');
const ClassDetail = pages(TeacherPages, 'ClassDetail');
const Students = pages(TeacherPages, 'Students');
const StudentDetail = pages(TeacherPages, 'StudentDetail');
const Assignments = pages(TeacherPages, 'Assignments');
const NewAssignment = pages(TeacherPages, 'NewAssignment');
const AssignmentDetail = pages(TeacherPages, 'AssignmentDetail');
const AttendanceHome = pages(AttendancePages, 'AttendanceHome');
const Register = pages(AttendancePages, 'Register');
const CoinAdmin = pages(CoinAdminPages, 'CoinAdmin');

const STUDY_NAV = [
  { path: '/',           label: 'Dashboard',  icon: 'home' },
  { path: '/homework',   label: 'Homework',   icon: 'edit' },
  { path: '/flashcards', label: 'Flashcards', icon: 'layers' },
  { path: '/games',      label: 'Word games', icon: 'gamepad' },
  { path: '/progress',   label: 'Progress',   icon: 'trending' },
  { path: '/coins',      label: 'Coins',      icon: 'coin' },
];
const TEACH_NAV = [
  { path: '/teach/assignments', label: 'Assignments', icon: 'checkCircle' },
  { path: '/teach/attendance',  label: 'Attendance',  icon: 'clipboard' },
  { path: '/teach/classes',     label: 'Classes',     icon: 'users' },
  { path: '/teach/students',    label: 'Students',    icon: 'graduation' },
  { path: '/teach/coins',       label: 'Coins',       icon: 'coin' },
];

const segments = () => window.location.pathname.split('/').filter(Boolean);

const Spinner = ({ full }) => (
  <div className={full ? 'hub-loading hub-loading--full' : 'hub-loading'}><div className="hub-spinner" /></div>
);

function route(parts, isTeacher) {
  const [a, b, c] = parts;
  if (!a || a === 'dashboard') return <Dashboard />;
  if (a === 'coins') return <CoinsPage />;
  if (a === 'join' && b) return <JoinPage code={b} />;
  if (a === 'homework') return b ? <HomeworkDetail id={b} /> : <HomeworkList />;
  if (a === 'progress') return <Progress />;
  if (a === 'flashcards') return <Flashcards deckId={b} />;
  if (a === 'games') return <Games gameId={b} />;
  if (a === 'teach') {
    if (!isTeacher) return <EmptyPanel icon="xCircle" title="Teachers only" lead="Ask an admin to give your account teacher access." />;
    if (b === 'classes') return c ? <ClassDetail id={c} /> : <Classes />;
    if (b === 'students') return c ? <StudentDetail id={c} /> : <Students />;
    if (b === 'attendance') return c ? <Register id={c} /> : <AttendanceHome />;
    if (b === 'coins') return <CoinAdmin />;
    if (c === 'new') return <NewAssignment />;
    return c ? <AssignmentDetail id={c} /> : <Assignments />;
  }
  return <Dashboard />;
}

// Close a popover on outside click / Escape.
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return { open, setOpen, ref };
}

function Bell({ uid, go, here }) {
  const pop = usePopover();
  const [items, setItems] = useState([]);
  const load = useCallback(() => { api.notifications(uid).then(setItems).catch(() => {}); }, [uid]);
  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [load, here]);
  const unread = items.filter((n) => !n.read_at).length;

  const open = (n) => {
    pop.setOpen(false);
    if (!n.read_at) api.markNotificationsRead([n.id]).then(load).catch(() => {});
    if (n.link) go(n.link);
  };

  return (
    <div className="hub-pop-wrap" ref={pop.ref}>
      <button type="button" className="hub-icon-btn" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} onClick={() => pop.setOpen((o) => !o)}>
        <Icon name="bell" size={18} />
        {unread > 0 && <span className="hub-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {pop.open && (
        <div className="hub-pop" role="dialog" aria-label="Notifications">
          <div className="hub-pop-head">
            <span>Notifications</span>
            {unread > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => api.markNotificationsRead(null).then(load)}>Mark all read</button>}
          </div>
          <div className="hub-pop-list">
            {items.length ? items.map((n) => (
              <button key={n.id} type="button" className={`hub-pop-item${n.read_at ? '' : ' is-unread'}`} onClick={() => open(n)}>
                <Icon name={n.kind === 'feedback' ? 'quote' : n.kind === 'submission' ? 'checkCircle' : 'edit'} size={16} />
                <span>
                  {n.title}
                  <small>{[n.body, new Date(n.visible_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })].filter(Boolean).join(' · ')}</small>
                </span>
              </button>
            )) : <div className="hub-pop-empty">You're all caught up.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, profile, isDark, toggleTheme, signOut, go }) {
  const pop = usePopover();
  return (
    <div className="hub-pop-wrap" ref={pop.ref}>
      <button type="button" className="hub-user" onClick={() => pop.setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={pop.open}>
        <Avatar person={{ ...profile, email: user.email }} size={28} />
        <span><strong>{profile?.name || 'Account'}</strong><small>{user.email}</small></span>
      </button>
      {pop.open && (
        <div className="hub-pop hub-pop--up" role="menu">
          <button type="button" role="menuitem" className="hub-menu-item" onClick={toggleTheme}>
            <Icon name={isDark ? 'sun' : 'moon'} size={16} /> {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <a role="menuitem" className="hub-menu-item" href={mainSiteUrl('/')}><Icon name="target" size={16} /> Practice site</a>
          <button type="button" role="menuitem" className="hub-menu-item" onClick={() => signOut().then(() => go('/'))}>
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function StudentApp() {
  const { loading, user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [parts, setParts] = useState(segments);
  const [navOpen, setNavOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const isAdmin = Boolean(profile?.is_admin);
  const isTeacher = Boolean(profile?.is_teacher || isAdmin);

  useEffect(() => {
    document.title = 'Student Hub · IELTS Wiz';
    if (!document.getElementById('hub-font')) {
      const link = document.createElement('link');
      link.id = 'hub-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
      document.head.appendChild(link);
    }
    const onPop = () => setParts(segments());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((path) => {
    window.history.pushState({}, '', path);
    setParts(segments());
    setNavOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const here = `/${parts.join('/')}`;
  // Coin balance in the top bar; refreshed on every navigation.
  useEffect(() => {
    if (!user) return;
    api.hubSummary().then((s) => setBalance(s.balance)).catch(() => {});
  }, [user, here]);

  const ctx = useMemo(() => ({ go, user, profile, isTeacher, isAdmin }), [go, user, profile, isTeacher, isAdmin]);

  if (loading) return <Spinner full />;

  if (!user) {
    // OAuth returns to `next` on this origin, so /join/<code> survives sign-in.
    if (!new URLSearchParams(window.location.search).has('next')) {
      const back = parts[0] === 'login' ? '/' : window.location.pathname;
      window.history.replaceState({}, '', `/login?next=${encodeURIComponent(back)}`);
    }
    return <Suspense fallback={<Spinner full />}><AuthPage type="login" setCurrentPage={() => {}} /></Suspense>;
  }

  if (profile && profile.onboarded === false) {
    return <Suspense fallback={<Spinner full />}><Onboarding /></Suspense>;
  }

  // Assigned tests open full-screen on this origin so the hub session records them.
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

  const isActive = (path) => (path === '/' ? here === '/' || parts[0] === 'dashboard' : here === path || here.startsWith(`${path}/`));
  const link = (n) => (
    <AppLink key={n.path} href={n.path} onNavigate={() => go(n.path)}
      aria-current={isActive(n.path) ? 'page' : undefined}
      className={`hub-nav-link${isActive(n.path) ? ' is-active' : ''}`}>
      <Icon name={n.icon} size={17} />
      <span>{n.label}</span>
    </AppLink>
  );

  return (
    <HubContext.Provider value={ctx}>
      <div className={`hub${navOpen ? ' is-nav-open' : ''}`}>
        <a href="#main" className="skip-link">Skip to main content</a>
        <aside className="hub-nav" aria-label="Student Hub navigation">
          <AppLink href="/" onNavigate={() => go('/')} className="hub-brand">
            <span className="hub-brand-mark"><Icon name="graduation" size={15} /></span>
            <span>Student Hub<small>IELTS Wiz</small></span>
          </AppLink>
          <nav>
            <div className="hub-nav-group">{STUDY_NAV.map(link)}</div>
            {isTeacher && (
              <div className="hub-nav-group">
                <div className="hub-nav-label">Teaching</div>
                {TEACH_NAV.map(link)}
              </div>
            )}
          </nav>
          <div className="hub-nav-foot">
            <UserMenu user={user} profile={profile} isDark={isDark} toggleTheme={toggleTheme} signOut={signOut} go={go} />
          </div>
        </aside>
        {navOpen && <div className="hub-backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />}
        <div className="hub-main">
          <header className="hub-top">
            <button type="button" className="hub-icon-btn hub-menu-btn" onClick={() => setNavOpen(true)} aria-label="Open navigation">
              <Icon name="menu" size={18} />
            </button>
            <div className="hub-top-spacer" />
            {balance != null && (
              <AppLink href="/coins" onNavigate={() => go('/coins')} className="hub-coin-pill" aria-label={`${balance} coins`}>
                <Coin /> {balance}
              </AppLink>
            )}
            <Bell uid={user.id} go={go} here={here} />
          </header>
          <main id="main" className="hub-content">
            <Suspense fallback={<Spinner />}>{route(parts, isTeacher)}</Suspense>
          </main>
        </div>
      </div>
    </HubContext.Provider>
  );
}
