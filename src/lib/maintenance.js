// Temporary full-site maintenance lock.
//
// While the user/accounts system is being rebuilt we hard-gate the whole app so
// nobody can sign up, sign in, or create data that would be lost in the planned
// wipe. The gate is build-time, controlled by an env var so it's automatically
// OFF on local dev and Vercel preview deployments (where the var is unset) and
// ON only where it's explicitly set (Production).
//
//   REACT_APP_MAINTENANCE_MODE          'true' to lock the site, anything else = open
//   REACT_APP_MAINTENANCE_BYPASS_TOKEN  secret token; visiting ?unlock=<token>
//                                       unlocks the full site on this device
//
// The bypass is a *soft* gate (the token is baked into the static bundle, so it
// keeps honest visitors out, not a determined attacker). It exists so the team
// can keep building and testing the live site behind the lock. See
// docs/maintenance-mode.md.

const BYPASS_KEY = 'iw.v1.maintBypass';

const lockEnabled = () => process.env.REACT_APP_MAINTENANCE_MODE === 'true';
const bypassToken = () => process.env.REACT_APP_MAINTENANCE_BYPASS_TOKEN || '';

export function isBypassed() {
  try { return localStorage.getItem(BYPASS_KEY) === '1'; } catch { return false; }
}

function setBypassed(on) {
  try {
    if (on) localStorage.setItem(BYPASS_KEY, '1');
    else localStorage.removeItem(BYPASS_KEY);
  } catch { /* storage disabled — gate just stays in its current state */ }
}

// Whether the site should render the maintenance screen instead of the app.
export function isMaintenanceLocked() {
  return lockEnabled() && !isBypassed();
}

// Read ?unlock=<token> / ?relock from the URL, persist the bypass decision, then
// strip the param so the token doesn't linger in the address bar or get shared.
export function applyUnlockFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (params.has('relock')) {            // re-lock this device (for testing)
      setBypassed(false);
      params.delete('relock');
      changed = true;
    }

    if (params.has('unlock')) {
      if (bypassToken() && params.get('unlock') === bypassToken()) setBypassed(true);
      params.delete('unlock');
      changed = true;
    }

    if (changed) {
      const qs = params.toString();
      const url = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
      window.history.replaceState({}, '', url);
    }
  } catch { /* no window/history (tests, SSR) — nothing to do */ }
}

// Process the URL once at load, before the app decides whether to gate.
applyUnlockFromUrl();
