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
        if (prop === 'then' || prop === 'toJSON' || typeof prop === 'symbol') {
          return undefined;
        }
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null } }),
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
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

// ─── ADMIN BYPASS & MOCK DB INTERCEPTOR ─────────────────────────

const ADMIN_EMAIL = 'admin@projectanalyser.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_USER_ID = 'mock-admin-uuid-1111-2222-3333-444444444444';

let mockSession: any = null;
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('sb-mock-admin-session');
    if (saved) {
      mockSession = JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }
}

function setMockSession(session: any) {
  mockSession = session;
  if (typeof window !== 'undefined') {
    try {
      if (session) {
        localStorage.setItem('sb-mock-admin-session', JSON.stringify(session));
      } else {
        localStorage.removeItem('sb-mock-admin-session');
      }
    } catch (e) {
      console.error(e);
    }
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

const getAuth = () => {
  const realAuth = (getClient() as any).auth;
  return {
    getSession: () => {
      if (mockSession) return Promise.resolve({ data: { session: mockSession }, error: null });
      if (realAuth && realAuth.getSession) return realAuth.getSession();
      return Promise.resolve({ data: { session: null }, error: null });
    },
    getUser: () => {
      if (mockSession) return Promise.resolve({ data: { user: mockSession.user }, error: null });
      if (realAuth && realAuth.getUser) return realAuth.getUser();
      return Promise.resolve({ data: { user: null }, error: null });
    },
    onAuthStateChange: (callback: any) => {
      authListeners.add(callback);
      let subscription: any = null;
      if (realAuth && realAuth.onAuthStateChange) {
        try {
          const res = realAuth.onAuthStateChange((event: string, session: any) => {
            if (!mockSession) {
              callback(event, session);
            }
          });
          subscription = res?.data?.subscription || res?.subscription;
        } catch (e) {
          console.error(e);
        }
      }
      if (mockSession) {
        setTimeout(() => callback('INITIAL_SESSION', mockSession), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
              if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
              }
            },
          },
        },
      };
    },
    signInWithPassword: async (credentials: any) => {
      if (credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
        const session = {
          access_token: 'mock-admin-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-admin-refresh-token',
          user: {
            id: ADMIN_USER_ID,
            aud: 'authenticated',
            role: 'authenticated',
            email: ADMIN_EMAIL,
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };
        setMockSession(session);
        authListeners.forEach((listener) => {
          try {
            listener('SIGNED_IN', session);
          } catch (e) {
            console.error(e);
          }
        });
        return { data: { user: session.user, session }, error: null };
      }
      if (realAuth && realAuth.signInWithPassword) {
        return realAuth.signInWithPassword(credentials);
      }
      return Promise.resolve({ data: { user: null, session: null }, error: new Error('Auth not available') });
    },
    signOut: async () => {
      if (mockSession) {
        setMockSession(null);
        authListeners.forEach((listener) => {
          try {
            listener('SIGNED_OUT', null);
          } catch (e) {
            console.error(e);
          }
        });
        return { error: null };
      }
      if (realAuth && realAuth.signOut) {
        return realAuth.signOut();
      }
      return Promise.resolve({ error: null });
    },
  };
};

const createMockQueryBuilder = (data: any) => {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    insert: () => Promise.resolve({ data, error: null }),
    update: () => builder,
    maybeSingle: () => Promise.resolve({ data, error: null }),
    single: () => Promise.resolve({ data, error: null }),
    then: (resolve: any) => Promise.resolve({ data, error: null }).then(resolve),
  };
  return builder;
};

const getFrom = (table: string) => {
  if (mockSession && mockSession.user.id === ADMIN_USER_ID) {
    if (table === 'helix_profiles') {
      const mockProfile = {
        id: ADMIN_USER_ID,
        email: ADMIN_EMAIL,
        role: 'org_admin',
        plan: 'enterprise',
        trial_started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return createMockQueryBuilder(mockProfile);
    }
    if (table === 'helix_usage_records') {
      const mockUsage = {
        id: 'mock-usage-uuid-1111-2222-3333-444444444444',
        user_id: ADMIN_USER_ID,
        period_start: new Date().toISOString(),
        repositories_analyzed: 1,
        ai_chats: 5,
        architecture_graphs: 2,
        impact_reports: 1,
        database_reports: 1,
        exports: 0,
        compare_reports: 0,
        tokens_used: 1500,
        storage_used_mb: 1.2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return createMockQueryBuilder(mockUsage);
    }
    if (table === 'helix_subscriptions') {
      const mockSub = {
        id: 'mock-sub-uuid-1111-2222-3333-444444444444',
        user_id: ADMIN_USER_ID,
        plan: 'enterprise',
        status: 'active',
        billing_cycle: 'monthly',
        price_cents: 0,
        currency: 'usd',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return createMockQueryBuilder(mockSub);
    }
    if (table === 'helix_payments') {
      return createMockQueryBuilder([]);
    }
  }
  return (getClient() as any).from(table);
};

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (prop === 'then' || prop === 'toJSON' || typeof prop === 'symbol') {
      return undefined;
    }
    if (prop === 'auth') {
      return getAuth();
    }
    if (prop === 'from') {
      return getFrom;
    }
    return (getClient() as any)[prop];
  },
});