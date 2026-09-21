import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env;

/**
 * The app runs local-first: all data lives in IndexedDB and nobody is asked to
 * sign in. Set VITE_ENABLE_CLOUD_SYNC=true to switch on Supabase auth and
 * background sync.
 *
 * Vite inlines this at build time, so changing it requires a restart/rebuild.
 */
export const CLOUD_SYNC_ENABLED = env.VITE_ENABLE_CLOUD_SYNC === 'true';

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

/**
 * Stays null while sync is off. That single fact makes every helper in
 * `sync.ts` a no-op and keeps AuthContext in local guest mode, so no network
 * call is made and no login gate is shown.
 */
export const supabase =
  CLOUD_SYNC_ENABLED && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
