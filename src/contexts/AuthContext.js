import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { pullAndMerge, flushToCloud } from '../lib/cloudSync';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If env vars are missing or the auth endpoint is unreachable, getSession
    // rejects. Without this catch the app sits forever on `loading=true` and
    // renders a blank spinner. Treat any init failure as a signed-out boot.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        // Two-way reconcile on boot: push any local-only history UP first (a
        // device may hold attempts taken while signed out / that never pushed
        // at submit time), then pull cloud progress DOWN. Without the flush,
        // local-only history is invisible on every other device.
        flushToCloud().catch(() => {}).then(() => pullAndMerge().catch(() => {}));
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
        if (_event === 'SIGNED_IN') flushToCloud().catch(() => {}).then(() => pullAndMerge().catch(() => {}));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data);
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

  const signUp = async (email, password, name, additionalInfo = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { 
        data: { 
          name,
          target_score: additionalInfo.target_score,
          prep_duration: additionalInfo.prep_duration,
          referral_source: additionalInfo.referral_source,
          goals: additionalInfo.goals
        } 
      }
    });
    // The handle_new_user trigger writes the row; this upsert is a belt-and-
    // suspenders fallback in case the trigger fails for any reason. Anything
    // already set by the trigger is left alone (upsert is idempotent on PK).
    if (data?.user && !error) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        name: name,
        target_score: additionalInfo.target_score || 7.0,
        prep_duration: additionalInfo.prep_duration || null,
        referral_source: additionalInfo.referral_source || null,
        goals: additionalInfo.goals || [],
        created_at: new Date().toISOString(),
      });
    }
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    // Flush any local-only results to the cloud BEFORE we drop the session and
    // wipe local storage — signing out must never destroy un-synced progress.
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
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signUp, signIn, signOut, updateProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
