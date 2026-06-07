import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { reconcile, flushToCloud } from '../lib/cloudSync';
import { flush as flushOutbox } from '../lib/syncQueue';
import { snapshotAcquisition, readAcquisition, deviceClass } from '../lib/marketing';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Capture first-touch attribution before any OAuth round-trip can wipe it.
    snapshotAcquisition();

    // If env vars are missing or the auth endpoint is unreachable, getSession
    // rejects. Without this catch the app sits forever on `loading=true` and
    // renders a blank spinner. Treat any init failure as a signed-out boot.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        // Two-way reconcile on boot: flush the durable outbox + any legacy
        // local-only history UP, then pull cloud progress DOWN, so this device
        // holds the union of every device's history.
        reconcile().catch(() => {});
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        if (_event === 'SIGNED_IN') reconcile().catch(() => {});
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

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
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

  const signOut = async () => {
    // Flush everything to the cloud BEFORE we drop the session and wipe local
    // storage — signing out must never destroy un-synced progress. Drain the
    // durable outbox (this session is the user it belongs to) and the legacy
    // local-only activity.
    try { await flushOutbox(); } catch { /* kept in queue */ }
    try { await flushToCloud(); } catch { /* best-effort; offline = keep local */ }
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
        if (k && k.startsWith('iw.v1.') && k !== 'iw.v1.themeOverride') stale.push(k);
      }
      stale.forEach(k => localStorage.removeItem(k));
    } catch { /* storage disabled — nothing to clear */ }
  };

  const isAdmin = Boolean(profile?.is_admin);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signInWithGoogle, signOut, updateProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
