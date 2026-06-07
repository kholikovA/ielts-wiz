// Acquisition / attribution capture.
//
// We snapshot how a visitor first arrived — referrer + UTM params + landing
// path — on their very first page load, BEFORE any sign-in. This matters because
// the Google OAuth round-trip wipes document.referrer and the original URL, so
// if we waited until sign-in the attribution would be lost. The snapshot is
// written once and never overwritten, then persisted onto the user's profile
// the first time they sign in (see AuthContext).

const KEY = 'iw.v1.acq';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

// Capture once, on the first ever load. No-op on every subsequent visit so the
// genuine first-touch attribution is preserved.
export function snapshotAcquisition() {
  try {
    if (localStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    UTM_KEYS.forEach((k) => { const v = params.get(k); if (v) utm[k] = v; });
    const snap = {
      referrer: document.referrer || null,
      utm: Object.keys(utm).length ? utm : null,
      landingPath: window.location.pathname || null,
    };
    localStorage.setItem(KEY, JSON.stringify(snap));
  } catch { /* storage disabled — attribution simply isn't captured */ }
}

export function readAcquisition() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

// Device class from the user agent — coarse on purpose (mobile vs desktop).
export function deviceClass() {
  const ua = (navigator.userAgent || '');
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';
}
