import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(
  process.env.SUPABASE_URL || import.meta.env?.SUPABASE_URL || ''
).trim();
const serviceRoleKey = String(
  process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env?.SUPABASE_SERVICE_ROLE_KEY || ''
).trim();

export const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
  }
  return supabase;
}

export function hasSupabaseConfig() {
  return Boolean(supabase);
}
