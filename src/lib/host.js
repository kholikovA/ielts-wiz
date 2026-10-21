// Which "app" this bundle should boot, decided by hostname.
//
//   ielts-wiz.com            → the main practice site
//   student.ielts-wiz.com    → the Student Hub (homework, progress, flashcards)
//
// Both are served by the same Vercel project and share one Supabase project, so
// accounts are identical across them. Sessions are per-origin (localStorage), so
// a student signs in once on each host.
//
// Localhost and Vercel preview URLs have no subdomain, so the hub can be forced
// on with ?hub=student (persisted on this device) and turned off with ?hub=main.

const HUB_KEY = 'iw.v1.hub';

function applyHubOverrideFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('hub')) return;
    const hub = params.get('hub');
    if (hub === 'student') localStorage.setItem(HUB_KEY, 'student');
    else localStorage.removeItem(HUB_KEY);
    params.delete('hub');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
  } catch { /* no window/storage — fall back to hostname only */ }
}

export function isStudentHost() {
  try {
    if (window.location.hostname.startsWith('student.')) return true;
    return localStorage.getItem(HUB_KEY) === 'student';
  } catch { return false; }
}

// Absolute link to the main practice site, for "open practice" buttons in the hub.
export function mainSiteUrl(path = '/') {
  try {
    const { protocol, hostname, port } = window.location;
    if (hostname.startsWith('student.')) {
      return `${protocol}//${hostname.slice('student.'.length)}${port ? `:${port}` : ''}${path}`;
    }
  } catch { /* fall through */ }
  return path;
}

applyHubOverrideFromUrl();
