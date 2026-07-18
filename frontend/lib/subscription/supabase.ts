import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables are not configured.\n' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let client: SupabaseClient | null = null;

/**
 * Lazily-initialized Supabase client.
 *
 * The client is NOT created at module import time — it is only created when a
 * property is first accessed. This prevents build / prerender failures when
 * environment variables are not available (e.g. during `/_not-found` prerender
 * on Vercel).
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!client) {
      client = createSupabaseClient();
    }
    return (client as any)[prop];
  },
});