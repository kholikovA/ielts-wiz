import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { reconcile, flushToCloud } from '../lib/cloudSync';
import { flush as flushOutbox, holdForUser, HELD_PREFIX } from '../lib/syncQueue';
import { pullVocabList } from '../lib/vocabList';
import { snapshotAcquisition, readAcquisition, deviceClass } from '../lib/marketing';
import ClockWarning from '../components/ClockWarning';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// How far the device clock is from the auth server, in seconds (+ ahead, - behind),
// from the `iat` of a token the server has just issued. A clock that is off by more
// than a few minutes breaks sign-in: tokens look expired the moment they arrive (so
// the client refreshes non-stop) or are sent long after they've expired (401s).
export const CLOCK_SKEW_LIMIT = 300;
export function clockSkewOf(session, now = Date.now()) {
  try {
    const part = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { iat } = JSON.parse(atob(part + '='.repeat((4 - (part.length % 4)) % 4)));
    return typeof iat === 'number' ? Math.round(now / 1000 - iat) : 0;
  } catch {
    return 0;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockSkew, setClockSkew] = useState(0);

  useEffect(() => {
    // Capture first-touch attribution before any OAuth round-trip can wipe it.
    snapshotAcquisition();

    // If env vars are missing or the auth endpoint is unreachable, getSession
    // rejects. Without this catch the app sits forever on `loading=true` and
    // renders a blank spinner. Treat any init failure as a signed-out boot.
    supabase.auth.getSession().then(({ data: { session } }) => {
      // A stored token can be old, so only a token issued "in the future" proves a slow clock here.
      if (session?.access_token && clockSkewOf(session) < -CLOCK_SKEW_LIMIT) setClockSkew(clockSkewOf(session));
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        // Two-way reconcile on boot: flush the durable outbox + any legacy
        // local-only history UP, then pull cloud progress DOWN, so this device
        // holds the union of every device's history.
        reconcile().catch(() => {});
        pullVocabList().catch(() => {});
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      if (session?.access_token && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
        const skew = clockSkewOf(session);
        setClockSkew(Math.abs(skew) > CLOCK_SKEW_LIMIT ? skew : 0);
      }
      // A token refresh doesn't change who is signed in: keep the same user object and
      // profile, so pages don't reload their data on every refresh.
      if (_event === 'TOKEN_REFRESHED') {
        setUser((prev) => (prev && next && prev.id === next.id ? prev : next));
        return;
      }
      setUser(next);
      if (session?.user) {
        fetchProfile(session.user.id);
        if (_event === 'SIGNED_IN') {
          reconcile().catch(() => {});
          pullVocabList().catch(() => {});
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // When the device comes back online, drain any results queued while offline.
    const onOnline = () => { flushOutbox().catch(() => {}); };
    window.addEventListener('online', onOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', onOnline);
    };
    // Mount-only: auth listener + one-time boot. fetchProfile is stable here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // First-touch enrichment: stamp acquisition + environment signals (timezone,
  // locale, device, referrer/UTM, landing path) onto the profile exactly once.
  // No-op until the capture migration adds the columns (guarded on the key being
  // present) and after first_seen_at is set (guarded so it runs a single time).
  const captureSignupContext = async (userId, profileRow) => {
    if (!profileRow || !('first_seen_at' in profileRow) || profileRow.first_seen_at) return;
    const acq = readAcquisition() || {};
    const updates = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      locale: navigator.language || null,
      signup_device: deviceClass(),
      signup_referrer: acq.referrer || null,
      signup_utm: acq.utm || null,
      signup_landing_path: acq.landingPath || null,
      first_seen_at: new Date().toISOString(),
    };
    try {
      const { data } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
      if (data) setProfile(data);
    } catch { /* columns not present yet / offline — best-effort */ }
  };

  // The handle_new_user trigger only fires when an auth account is first
  // created, so an account whose profile row went missing (deleted, or created
  // before the trigger existed) would never get one back — and everything that
  // references profiles (class joins, homework, flashcards) fails on a foreign
  // key. Recreate it from the auth metadata, mirroring handle_new_user.
  // RLS "Users can insert own profile" allows it; the guard_profile_roles
  // trigger forces is_admin/is_teacher off.
  const recreateProfile = async (userId) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || authUser.id !== userId) return null;
    const meta = authUser.user_metadata || {};
    const { data } = await supabase.from('profiles').upsert({
      id: userId,
      email: authUser.email,
      name: meta.name || meta.full_name || null,
      avatar_url: meta.avatar_url || meta.picture || null,
      google_sub: meta.provider_id || meta.sub || null,
      email_verified: Boolean(meta.email_verified),
      auth_provider: authUser.app_metadata?.provider || null,
    }, { onConflict: 'id', ignoreDuplicates: true }).select().maybeSingle();
    if (data) return data;
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return existing;
  };

  const fetchProfile = async (userId) => {
    try {
      let { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!data) data = await recreateProfile(userId);
      setProfile(data);
      if (data) captureSignupContext(userId, data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  // Google is the only way in. No passwords to share, leak, or reset — and one
  // Google identity per person makes account-sharing far harder to do casually.
  // After Google redirects back, supabaseClient's detectSessionInUrl parses the
  // token and onAuthStateChange fires SIGNED_IN; the handle_new_user trigger has
  // already created the profile row from Google's name/email metadata.
  const signInWithGoogle = async (next) => {
    const path = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard';
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${path}`,
        // Always show Google's account chooser so people on a shared device
        // can't silently reuse whoever signed in last.
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  // Google Identity Services path: the ID token was issued on our own origin,
  // so the consent screen names IELTS Wiz rather than the Supabase project
  // domain. onAuthStateChange fires SIGNED_IN exactly as with the redirect.
  const signInWithGoogleIdToken = (token, nonce) =>
    supabase.auth.signInWithIdToken({ provider: 'google', token, nonce });

  const signOut = async () => {
    // Flush everything to the cloud BEFORE we drop the session and wipe local
    // storage — signing out must never destroy un-synced progress. Drain the
    // durable outbox (this session is the user it belongs to) and the legacy
    // local-only activity.
    try { await flushOutbox(); } catch { /* kept in queue */ }
    try { await flushToCloud(); } catch { /* best-effort; offline = keep local */ }
    // Anything still unsynced (offline) is parked under this user's id rather
    // than wiped; it rejoins the outbox when they sign in again.
    holdForUser(user?.id);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    // Clear local progress so a different user on the same browser doesn't see
    // the previous user's tests, heatmap, or drafts. Theme override is a UI
    // preference and is intentionally preserved across the boundary.
    try {
      const stale = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('iw.v1.') && k !== 'iw.v1.themeOverride' && !k.startsWith(HELD_PREFIX)) stale.push(k);
      }
      stale.forEach(k => localStorage.removeItem(k));
    } catch { /* storage disabled — nothing to clear */ }
  };

  const isAdmin = Boolean(profile?.is_admin);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, clockSkew, signInWithGoogle, signInWithGoogleIdToken, signOut, updateProfile, fetchProfile }}>
      <ClockWarning skew={clockSkew} />
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
