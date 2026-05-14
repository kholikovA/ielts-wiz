import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear error in the console instead of a cryptic "Failed to fetch"
  // when REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY aren't injected at build time.
  // eslint-disable-next-line no-console
  console.error(
    'Supabase env vars are missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your deployment environment (e.g. Vercel) and redeploy.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  }
});
