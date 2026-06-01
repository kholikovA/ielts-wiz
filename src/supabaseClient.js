import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Stub used when env vars are missing or createClient throws. Lets the rest of
// the app boot in a signed-out, read-only state instead of crashing white.
// Every method returns the shape its real counterpart would, with `error` set.
const stubError = { message: 'Supabase not configured' };
const buildStub = () => {
  const queryStub = () => ({ data: null, error: stubError });
  const queryBuilder = {
    select: () => queryBuilder,
    insert: () => Promise.resolve(queryStub()),
    update: () => queryBuilder,
    upsert: () => Promise.resolve(queryStub()),
    delete: () => queryBuilder,
    eq: () => queryBuilder,
    single: () => Promise.resolve(queryStub()),
    then: (resolve) => resolve(queryStub()),
  };
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: stubError }),
      signInWithPassword: () => Promise.resolve({ data: null, error: stubError }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => queryBuilder,
    functions: { invoke: () => Promise.resolve({ data: null, error: stubError }) },
  };
};

let client;
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars missing — running with stub client. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env.local.'
  );
  client = buildStub();
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    });
  } catch (e) {
    console.warn('Supabase createClient failed; running with stub client:', e?.message);
    client = buildStub();
  }
}

export const supabase = client;
