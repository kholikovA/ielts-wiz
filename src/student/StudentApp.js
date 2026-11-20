import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Icon from '../components/ui/icons';
import AppLink from '../components/ui/AppLink';
import { mainSiteUrl } from '../lib/host';
import * as api from './api';
import { HubContext, EmptyPanel, Avatar } from './ui';
import Brand, { LogoMark } from '../components/Brand';
import { DialogHost } from './dialog';
import { useHubTime } from './hubTime';
import { useChatBootstrap } from './chat/bootstrap';
import { reloadChats } from './chat/store';
import { setGroupScope } from './groupScope';
import './hub.css';

// Student Hub — served at student.ielts-wiz.com (see lib/host.js). Same Supabase
// accounts as the main site, its own deliberately minimal design (hub.css).
// Students: dashboard, homework, flashcards, word games, progress, coins.
// Teachers (profiles.is_teacher, or admins) get Teaching instead: homework
// (with scheduling), classes, attendance and students. "Student view" lets a
// teacher see the hub as one of their students, with that student's real data
// (read-only; see setPreview in api.js).

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
const HubStats = lazy(() => import('./Stats'));
const Profile = lazy(() => import('./Profile'));
const SatBank = lazy(() => import('./SatBank'));
const IeltsBank = lazy(() => import('./ielts/IeltsBank'));
const WordBank = lazy(() => import('./WordBank'));
const BankTestRoute = lazy(() => import('./ielts/BankTestRoute'));
const RevisionQuiz = lazy(() => import('./revision/RevisionQuiz'));
const Messages = lazy(() => import('./chat/Messages'));
const Schedule = lazy(() => import('./schedule/Schedule'));
const WelcomeBack = lazy(() => import('./WelcomeBack'));
const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const OverviewPages = () => import('./Overview');
const Overview = pages(OverviewPages, 'default');
const OverviewHomework = pages(OverviewPages, 'OverviewHomework');
const OverviewStudent = pages(OverviewPages, 'OverviewStudent');

// Sidebar groups. The first group has no heading and stays pinned at the top
// (with Notifications); the labelled groups below it scroll, as on claude.ai.
const STUDY_NAV = [
  { items: [
    { path: '/',           label: 'Dashboard',  icon: 'home' },
    { path: '/messages',   label: 'Messages',   icon: 'message' },
  ] },
  { label: 'Classwork', items: [
    { path: '/homework',   label: 'Homework',   icon: 'clipboard' },
    { path: '/schedule',   label: 'Schedule',   icon: 'calendar' },
  ] },
  { label: 'Practice', items: [
    { path: '/flashcards', label: 'Flashcards', icon: 'layers' },
    { path: '/games',      label: 'Word games', icon: 'gamepad' },
    { path: '/revision',   label: 'Revision quiz', icon: 'zap' },
  ] },
  { label: 'Progress', items: [
    { path: '/progress',   label: 'Progress',   icon: 'trending' },
    { path: '/coins',      label: 'Coins',      icon: 'coin' },
  ] },
];
const TEACH_NAV = [
  { items: [
    { path: '/teach/assignments/new', label: 'New assignment', icon: 'plus', primary: true },
    { path: '/teach',             label: 'Dashboard',   icon: 'home' },
    { path: '/messages',          label: 'Messages',    icon: 'message' },
  ] },
  { label: 'Homework', items: [
    { path: '/teach/assignments', label: 'Assignments', icon: 'clipboard' },
    { path: '/teach/bank',        label: 'Question bank', icon: 'layers' },
  ] },
  { label: 'Classes', items: [
    { path: '/teach/schedule',    label: 'Schedule',    icon: 'calendar' },
    { path: '/teach/attendance',  label: 'Attendance',  icon: 'checkCircle' },
    { path: '/teach/classes',     label: 'Classes',     icon: 'users' },
    { path: '/teach/students',    label: 'Students',    icon: 'graduation' },
  ] },
  { label: 'Insights', items: [
    { path: '/teach/stats',       label: 'Stats',       icon: 'trending' },
    { path: '/teach/coins',       label: 'Coins',       icon: 'coin' },
  ] },
];
// Viewers (class_viewers, e.g. a Head Teacher): read-only stats for shared groups.
const VIEW_NAV = [
  { items: [
    { path: '/overview', label: 'Overview', icon: 'trending' },
  ] },
];
const flat = (nav) => nav.flatMap((g) => g.items);

const NOTIFICATION_ICON = { feedback: 'quote', submission: 'checkCircle', retake: 'refresh', coins: 'coin', homework: 'edit' };

const segments = () => window.location.pathname.split('/').filter(Boolean);

const Spinner = ({ full }) => (
  <div className={full ? 'hub-loading hub-loading--full' : 'hub-loading'}><div className="hub-spinner" /></div>
);

function teacherRoute(parts) {
  const [a, b, c, d] = parts;
  if (a === 'join' && b) return <JoinPage code={b} />;
  if (a === 'profile') return <Profile />;
  if (a === 'messages') return <Messages chatId={b} />;
  if (a !== 'teach' || !b) return <TeacherDashboard />;
  if (b === 'classes') return c ? <ClassDetail id={c} /> : <Classes />;
  if (b === 'students') return c ? <StudentDetail id={c} /> : <Students />;
  if (b === 'attendance') return c ? <Register id={c} /> : <AttendanceHome />;
  if (b === 'coins') return <CoinAdmin />;
  if (b === 'schedule') return <Schedule />;
  if (b === 'stats') return <HubStats />;
  if (b === 'bank') return c === 'ielts' ? <IeltsBank /> : c === 'words' ? <WordBank /> : <SatBank />;
  if (c === 'new') return <NewAssignment key={window.location.search} />;
  if (c && d === 'edit') return <NewAssignment key={`edit-${c}`} editId={c} />;
  return c ? <AssignmentDetail id={c} /> : <Assignments />;
}

function viewerRoute(parts) {
  const [a, b, c] = parts;
  if (a === 'profile') return <Profile />;
  if (a === 'overview' && b === 'homework' && c) return <OverviewHomework id={c} />;
  if (a === 'overview' && b === 'students' && c) return <OverviewStudent id={c} />;
  return <Overview />;
}

function studentRoute(parts, exitStudentView) {
  const [a, b] = parts;
  if (!a || a === 'dashboard') return <Dashboard />;
  if (a === 'profile') return <Profile />;
  if (a === 'coins') return <CoinsPage />;
  if (a === 'messages') return <Messages chatId={b} />;
  if (a === 'join' && b) return <JoinPage code={b} />;
  if (a === 'homework') return b ? <HomeworkDetail id={b} /> : <HomeworkList />;
  if (a === 'progress') return <Progress />;
  if (a === 'schedule') return <Schedule />;
  if (a === 'flashcards') return <Flashcards deckId={b} />;
  if (a === 'games') return <Games gameId={b} />;
  if (a === 'revision') return <RevisionQuiz />;
  if (a === 'teach') {
    return exitStudentView
      ? (
        <EmptyPanel icon="eye" title="You're in student view" lead="Teaching pages are hidden while you view the hub as a student.">
          <button type="button" className="btn btn-primary" onClick={exitStudentView}>Back to teacher view</button>
        </EmptyPanel>
      )
      : <EmptyPanel icon="xCircle" title="Teachers only" lead="Ask an admin to give your account teacher access." />;
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

function Bell({ uid, go, here, collapsed }) {
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
      <button type="button" className={`hub-nav-link${pop.open ? ' is-open' : ''}`} title={collapsed ? 'Notifications' : undefined}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} aria-expanded={pop.open} onClick={() => pop.setOpen((o) => !o)}>
        <span className="hub-nav-ic"><Icon name="bell" size={18} strokeWidth={1.75} /></span>
        <span className="hub-nav-text">Notifications</span>
        {unread > 0 && <span className="hub-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {pop.open && (
        <div className="hub-pop hub-pop--flyout" role="dialog" aria-label="Notifications">
          <div className="hub-pop-head">
            <span>Notifications</span>
            {unread > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => api.markNotificationsRead(null).then(load)}>Mark all read</button>}
          </div>
          <div className="hub-pop-list">
            {items.length ? items.map((n) => (
              <button key={n.id} type="button" className={`hub-notif${n.read_at ? '' : ' is-unread'}`} onClick={() => open(n)}>
                <span className={`hub-notif-ic hub-notif-ic--${n.kind || 'other'}`}><Icon name={NOTIFICATION_ICON[n.kind] || 'edit'} size={16} /></span>
                <span className="hub-notif-text">
                  <span className="hub-notif-title">{n.title}</span>
                  {n.body && <span className="hub-notif-body">{n.body}</span>}
                  <span className="hub-notif-time">{new Date(n.visible_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                {!n.read_at && <span className="hub-notif-dot" aria-label="Unread" />}
              </button>
            )) : <div className="hub-pop-empty">You're all caught up.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Choose which student to view the hub as.
function StudentPicker({ uid, current, onPick }) {
  const state = useAsyncList(uid);
  const [q, setQ] = useState('');
  const shown = (state || []).filter((s) => `${s.name || ''} ${s.email || ''}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="hub-picker">
      <div className="hub-pop-head"><span>View as a student</span></div>
      {state && state.length > 6 && (
        <input className="form-input hub-picker-search" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      )}
      <div className="hub-pop-list">
        {!state && <div className="hub-pop-empty">Loading…</div>}
        {state && !state.length && <div className="hub-pop-empty">No students yet. Students appear here once they join one of your classes.</div>}
        {shown.map((s) => (
          <button key={s.id} type="button" className={`hub-pop-item hub-picker-item${s.id === current ? ' is-unread' : ''}`} onClick={() => onPick(s)}>
            <Avatar person={s} size={24} />
            <span>{s.name || s.email}<small>{s.classNames.filter(Boolean).join(', ')}</small></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function useAsyncList(uid) {
  const [list, setList] = useState(null);
  useEffect(() => {
    let live = true;
    api.teacherStudents(uid).then((r) => live && setList(r.students)).catch(() => live && setList([]));
    return () => { live = false; };
  }, [uid]);
  return list;
}

function UserMenu({ user, profile, isDark, toggleTheme, signOut, go, canTeach, isViewer, viewAs, onViewAs, collapsed }) {
  const pop = usePopover();
  const [picking, setPicking] = useState(false);
  useEffect(() => { if (!pop.open) setPicking(false); }, [pop.open]);
  const role = viewAs ? 'Student view' : profile?.is_admin ? 'Admin' : profile?.is_teacher ? 'Teacher' : isViewer ? 'Viewer' : 'Student';
  return (
    <div className="hub-pop-wrap" ref={pop.ref}>
      <button type="button" className={`hub-user${pop.open ? ' is-open' : ''}`} onClick={() => pop.setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={pop.open}
        title={collapsed ? (profile?.name || user.email) : undefined}>
        <Avatar person={{ ...profile, email: user.email }} size={32} />
        <span className="hub-user-text"><strong>{profile?.name || 'Account'}</strong><small>{role}</small></span>
        <Icon name="chevronsUpDown" size={16} className="hub-user-chev" />
      </button>
      {pop.open && picking && (
        <div className="hub-pop hub-pop--up hub-pop--wide">
          <StudentPicker uid={user.id} current={viewAs?.id} onPick={(s) => { pop.setOpen(false); onViewAs(s); }} />
        </div>
      )}
      {pop.open && !picking && (
        <div className="hub-pop hub-pop--up hub-pop--account" role="menu">
          <div className="hub-menu-email">{user.email}</div>
          <button type="button" role="menuitem" className="hub-menu-item" onClick={() => { pop.setOpen(false); go('/profile'); }}>
            <Icon name="user" size={18} /> Profile
          </button>
          {canTeach && (viewAs ? (
            <button type="button" role="menuitem" className="hub-menu-item" onClick={() => { pop.setOpen(false); onViewAs(null); }}>
              <Icon name="graduation" size={18} /> Back to teacher view
            </button>
          ) : (
            <button type="button" role="menuitem" className="hub-menu-item" onClick={() => setPicking(true)}>
              <Icon name="eye" size={18} /> Switch to student view
            </button>
          ))}
          <button type="button" role="menuitem" className="hub-menu-item" onClick={toggleTheme}>
            <Icon name={isDark ? 'sun' : 'moon'} size={18} /> {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <a role="menuitem" className="hub-menu-item" href={mainSiteUrl('/')}><Icon name="target" size={18} /> Practice site</a>
          <div className="hub-menu-sep" />
          <button type="button" role="menuitem" className="hub-menu-item" onClick={() => signOut().then(() => go('/'))}>
            <Icon name="logout" size={18} /> Log out
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
  // Desktop: the sidebar can shrink to an icon rail. Remembered per device.
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try { return localStorage.getItem('iw.v1.hub.navCollapsed') === '1'; } catch { return false; }
  });
  const toggleNav = () => setNavCollapsed((c) => {
    try { localStorage.setItem('iw.v1.hub.navCollapsed', c ? '0' : '1'); } catch { /* storage off */ }
    return !c;
  });
  const [balance, setBalance] = useState(null);
  // Teachers/admins see Teaching only. Student view shows the hub as one of
  // their students, with that student's data. Remembered per device.
  const canTeach = Boolean(profile?.is_teacher || profile?.is_admin);
  const [viewAsRaw, setViewAsRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iw.v1.hub.viewAs')) || null; } catch { return null; }
  });
  const viewAs = canTeach ? viewAsRaw : null;
  const isAdmin = Boolean(profile?.is_admin) && !viewAs;
  const isTeacher = canTeach && !viewAs;
  // Viewers see only the read-only Overview. null while we check.
  const [viewerOf, setViewerOf] = useState(null); // { uid, on }
  useEffect(() => {
    if (!user || !profile || canTeach) return undefined;
    let live = true;
    api.isViewer(user.id).then((on) => live && setViewerOf({ uid: user.id, on }));
    return () => { live = false; };
  }, [user, profile, canTeach]);
  const viewerKnown = canTeach || !user || !profile || viewerOf?.uid === user.id;
  const isViewer = !canTeach && viewerOf?.uid === user?.id && Boolean(viewerOf?.on);
  // Set synchronously so the first render's reads already target the student.
  api.setPreview(viewAs ? { id: viewAs.id, teacherName: profile?.name } : null);
  // Test accounts (profiles.is_test) see one class at a time, with a switcher.
  // Set synchronously (like the preview) so pages only ever load that class.
  const isTestView = Boolean(profile?.is_test) && !isTeacher && !viewAs && !isViewer;
  const [testGroups, setTestGroups] = useState(null);
  const [testGroupRaw, setTestGroupRaw] = useState(() => {
    try { return localStorage.getItem('iw.v1.hub.testGroup') || null; } catch { return null; }
  });
  const testGroup = isTestView && testGroups
    ? (testGroups.some((g) => g.id === testGroupRaw) ? testGroupRaw : testGroups[0]?.id || null)
    : null;
  setGroupScope(testGroup);
  useEffect(() => {
    if (!isTestView) { setTestGroups(null); return undefined; }
    let live = true;
    api.allMyClasses().then((rows) => live && setTestGroups(rows)).catch(() => live && setTestGroups([]));
    return () => { live = false; };
  }, [isTestView, user?.id]);
  const pickTestGroup = useCallback((id) => {
    try { localStorage.setItem('iw.v1.hub.testGroup', id); } catch { /* storage off */ }
    setTestGroupRaw(id);
  }, []);
  useEffect(() => { if (isTestView && testGroups) reloadChats(); }, [isTestView, testGroups, testGroup]);
  // Time on the hub is tracked for students only (not teachers, not previews).
  useHubTime(Boolean(user && profile && !canTeach && viewerKnown && !isViewer));

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
  // Coin balance on the sidebar Coins row (students and student view); refreshed on every navigation.
  useEffect(() => {
    setBalance(null);
    if (!user || !profile || isTeacher || !viewerKnown || isViewer) return undefined;
    let live = true; // a late answer must not show after switching to teacher view
    api.hubSummary().then((s) => live && setBalance(s.balance)).catch(() => {});
    return () => { live = false; };
  }, [user, profile, here, isTeacher, viewAs?.id, viewerKnown, isViewer]);

  // Viewers have the Overview and their Profile only.
  useEffect(() => {
    if (isViewer && !['overview', 'profile'].includes(parts[0])) {
      window.history.replaceState({}, '', '/overview');
      setParts(segments());
    }
  }, [isViewer, parts]);

  // Teacher view has no student pages: send those paths to Teaching.
  useEffect(() => {
    if (isTeacher && !['teach', 'join', 'profile', 'messages', 'reading-test', 'listening-test'].includes(parts[0])) {
      window.history.replaceState({}, '', '/teach');
      setParts(segments());
    }
  }, [isTeacher, parts]);

  const viewAsStudent = useCallback((s) => {
    const next = s ? {
      id: s.id, name: s.name || null, email: s.email || null, avatar_url: s.avatar_url || null,
      avatar_character: s.avatar_character || null, target_score: s.target_score || null,
    } : null;
    try {
      if (next) localStorage.setItem('iw.v1.hub.viewAs', JSON.stringify(next));
      else localStorage.removeItem('iw.v1.hub.viewAs');
    } catch { /* storage off */ }
    setViewAsRaw(next);
    go(next ? '/' : '/teach');
  }, [go]);
  const exitStudentView = useCallback(() => viewAsStudent(null), [viewAsStudent]);

  // In student view the pages see the student as the signed-in user.
  const ctx = useMemo(() => ({
    go,
    user: viewAs ? { id: viewAs.id, email: viewAs.email } : user,
    profile: viewAs || profile,
    isTeacher,
    isAdmin,
    isViewer,
    preview: Boolean(viewAs),
    viewAsStudent: canTeach ? viewAsStudent : null,
  }), [go, user, profile, viewAs, isTeacher, isAdmin, isViewer, canTeach, viewAsStudent]);

  // Chat runs in the background on every page (unread badge, alerts); not in student view.
  const unreadChats = useChatBootstrap({ uid: user?.id, enabled: Boolean(user && profile && profile.onboarded !== false && !viewAs && viewerKnown && !isViewer), go });

  if (loading || (isTestView && !testGroups) || !viewerKnown) return <Spinner full />;

  if (!user) {
    // OAuth returns to `next` on this origin, so /join/<code> survives sign-in.
    if (!new URLSearchParams(window.location.search).has('next')) {
      const back = parts[0] === 'login' ? '/' : window.location.pathname;
      window.history.replaceState({}, '', `/login?next=${encodeURIComponent(back)}`);
    }
    return <Suspense fallback={<Spinner full />}><AuthPage type="login" setCurrentPage={() => {}} /></Suspense>;
  }

  if (profile && profile.onboarded === false && !isViewer) {
    return <Suspense fallback={<Spinner full />}><Onboarding /></Suspense>;
  }

  // Assigned tests open full-screen on this origin so the hub session records them.
  if (!isViewer && (parts[0] === 'reading-test' || parts[0] === 'listening-test')) {
    if (viewAs) {
      return (
        <HubContext.Provider value={ctx}>
          <div className="hub"><main id="main" className="hub-content">
            <EmptyPanel icon="eye" title="Tests don't open in student view" lead="A test taken here would be recorded on your account, not the student's.">
              <button type="button" className="btn btn-primary" onClick={() => go('/homework')}>Back to homework</button>
            </EmptyPanel>
          </main></div>
        </HubContext.Provider>
      );
    }
    const Player = parts[0] === 'reading-test' ? ReadingTestRoute : ListeningTestRoute;
    const review = parts[2] === 'review';
    // bank-<id>: a test from the IELTS question bank (stored in the database).
    const bankId = parts[1]?.startsWith('bank-') ? parts[1].slice(5) : null;
    const exit = () => go(isTeacher ? '/teach/bank/ielts' : '/homework');
    return (
      <main id="main">
        <Suspense fallback={<Spinner full />}>
          {bankId
            ? <BankTestRoute key={`${bankId}:${review}`} id={bankId} review={review} onExit={exit} />
            : <Player key={`${parts[1]}:${review}`} slug={parts[1]} review={review} onExit={() => go('/homework')} />}
        </Suspense>
      </main>
    );
  }

  // The most specific nav item wins, so /teach/assignments/new lights up "New assignment" only.
  const matches = (path) => (path === '/' ? here === '/' || parts[0] === 'dashboard' : here === path || here.startsWith(`${path}/`));
  const nav = isTeacher ? TEACH_NAV : isViewer ? VIEW_NAV : STUDY_NAV;
  const activePath = flat(nav).filter((n) => matches(n.path)).sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const isActive = (path) => path === activePath;
  const link = (n) => (
    <AppLink key={n.path} href={n.path} onNavigate={() => go(n.path)}
      aria-current={isActive(n.path) ? 'page' : undefined}
      className={`hub-nav-link${n.primary ? ' hub-nav-link--primary' : ''}${isActive(n.path) ? ' is-active' : ''}`} title={navCollapsed ? n.label : undefined}>
      <span className="hub-nav-ic"><Icon name={n.icon} size={n.primary ? 14 : 18} strokeWidth={n.primary ? 2.5 : 1.75} /></span>
      <span className="hub-nav-text">{n.label}</span>
      {n.path === '/messages' && unreadChats > 0 && <span className="hub-badge" aria-label={`${unreadChats} unread`}>{unreadChats > 99 ? '99+' : unreadChats}</span>}
      {n.path === '/coins' && balance != null && <span className="hub-nav-meta" aria-label={`${balance} coins`}>{balance}</span>}
    </AppLink>
  );
  const home = isTeacher ? '/teach' : isViewer ? '/overview' : '/';

  return (
    <HubContext.Provider value={ctx}>
      <div className={`hub${navOpen ? ' is-nav-open' : ''}${navCollapsed ? ' is-nav-collapsed' : ''}`}>
        <a href="#main" className="skip-link">Skip to main content</a>
        <aside className="hub-nav" aria-label="Student Hub navigation">
          <div className="hub-nav-head">
            <AppLink href={home} onNavigate={() => go(home)} className="hub-brand" aria-label="IELTS Wiz Student Hub, home">
              <LogoMark size={32} className="hub-brand-mark" />
              <Brand size={32} tag={isTeacher ? 'Teaching' : isViewer ? 'Overview' : 'Student Hub'} className="hub-brand-full" />
            </AppLink>
            {/* Collapsed rail: the logo turns into the expand button on hover, as on claude.ai. */}
            <button type="button" className="hub-icon-btn hub-collapse-btn" onClick={toggleNav}
              aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={navCollapsed} title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <LogoMark size={28} className="hub-collapse-logo" />
              <Icon name="panelLeft" size={18} strokeWidth={1.75} className="hub-collapse-icon" />
            </button>
            <button type="button" className="hub-icon-btn hub-nav-close" onClick={() => setNavOpen(false)} aria-label="Close navigation">
              <Icon name="close" size={20} />
            </button>
          </div>
          <nav className="hub-nav-body">
            <div className="hub-nav-top">
              {nav[0].items.map(link)}
              {!viewAs && !isViewer && <Bell uid={user.id} go={go} here={here} collapsed={navCollapsed} />}
            </div>
            <div className="hub-nav-scroll">
              {nav.slice(1).map((g) => (
                <div className="hub-nav-group" key={g.label}>
                  <div className="hub-nav-label">{g.label}</div>
                  {g.items.map(link)}
                </div>
              ))}
            </div>
          </nav>
          <div className="hub-nav-foot">
            <UserMenu user={user} profile={profile} isDark={isDark} toggleTheme={toggleTheme} signOut={signOut} go={go}
              canTeach={canTeach} isViewer={isViewer} viewAs={viewAs} onViewAs={viewAsStudent} collapsed={navCollapsed} />
          </div>
        </aside>
        {navOpen && <div className="hub-backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />}
        <DialogHost />
        {!isTeacher && !isViewer && <Suspense fallback={null}><WelcomeBack key={`${viewAs?.id || 'self'}:${testGroup || ''}`} /></Suspense>}
        <div className={`hub-main${parts[0] === 'messages' ? ' hub-main--fill' : ''}`}>
          {viewAs && (
            <div className="hub-viewbar" role="status">
              <Icon name="eye" size={14} />
              <span>Viewing as <strong>{viewAs.name || viewAs.email}</strong>. Read-only: nothing you do here is saved.</span>
              <button type="button" className="hub-viewbar-btn" onClick={exitStudentView}>Back to teacher view</button>
            </div>
          )}
          {isTestView && testGroups.length > 0 && (
            <div className="hub-viewbar" role="status">
              <Icon name="eye" size={14} />
              <span>Test account. Viewing as a student of</span>
              <select className="hub-viewbar-select" aria-label="Group" value={testGroup || ''} onChange={(e) => pickTestGroup(e.target.value)}>
                {testGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          {/* Phones only: the sidebar is a drawer, so something has to open it. */}
          <div className="hub-mobilebar">
            <button type="button" className="hub-icon-btn" onClick={() => setNavOpen(true)} aria-label="Open navigation">
              <Icon name="menu" size={22} />
            </button>
            <Brand size={26} />
          </div>
          <main id="main" className={`hub-content${parts[0] === 'messages' ? ' hub-content--chat' : ''}`}>
            <Suspense fallback={<Spinner />} key={`${viewAs?.id || 'self'}:${testGroup || ''}`}>
              {isTeacher ? teacherRoute(parts) : isViewer ? viewerRoute(parts) : studentRoute(parts, viewAs ? exitStudentView : null)}
            </Suspense>
          </main>
        </div>
      </div>
    </HubContext.Provider>
  );
}
