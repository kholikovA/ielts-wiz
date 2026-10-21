// Google Identity Services (GIS) — sign in on our own origin instead of
// redirecting through Supabase's auth domain. With the redirect flow, Google's
// consent screen reads "continue to <project>.supabase.co"; with GIS the ID
// token is issued to ielts-wiz.com and handed to supabase.auth.signInWithIdToken.

export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisPromise = null;

// Load the GIS script once. Resolves with window.google.accounts.id, rejects if
// the script is blocked (ad-blockers, offline) so callers can fall back.
export const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => (window.google?.accounts?.id
      ? resolve(window.google.accounts.id)
      : reject(new Error('Google sign-in failed to load.')));
    script.onerror = () => {
      gisPromise = null;
      script.remove();
      reject(new Error('Google sign-in failed to load.'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
};

// Supabase checks the ID token's nonce against sha256(raw nonce): Google gets
// the hash, Supabase gets the raw value.
export const makeNonce = async () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { raw, hashed };
};
