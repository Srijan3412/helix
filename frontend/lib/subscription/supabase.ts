import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Creates a no-op mock that mimics the Supabase client interface.
 *
 * Every method/property returns itself (for chaining) or a resolved promise
 * with empty data. This prevents runtime crashes when the app is loaded
 * without Supabase environment variables configured (e.g. during prerender
 * or in development before env vars are set).
 */
function createMockClient(): SupabaseClient {
  const noop = new Proxy(
    (() => {}) as any,
    {
      get(_target, prop) {
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signUp: () => Promise.resolve({ data: { user: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
            signOut: () => Promise.resolve({ error: null }),
          };
        }
        if (prop === 'from') {
          return () => ({
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }),
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
              order: () => ({
                limit: () => ({
                  maybeSingle: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
            insert: () => Promise.resolve({ error: null }),
            update: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          });
        }
        return noop;
      },
      apply(_target, _thisArg, _args) {
        return noop;
      },
    },
  ) as any;

  return noop;
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    if (isConfigured) {
      client = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } else {
      client = createMockClient();
    }
  }
  return client;
}

/**
 * Lazily-initialized Supabase client.
 *
 * The client is NOT created at module import time — it is only created when a
 * property is first accessed. This prevents build / prerender failures when
 * environment variables are not available (e.g. during `/_not-found` prerender
 * on Vercel).
 *
 * If environment variables are missing, a no-op mock client is returned instead
 * of throwing, so the app renders gracefully.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});