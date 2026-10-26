import { createClient } from '@supabase/supabase-js';

const viteEnv = import.meta.env || {};
let supabaseClient = null;

function getServerEnv(name) {
  return viteEnv[name] || (typeof process !== 'undefined' ? process.env[name] : '') || '';
}

function getSupabaseConfig() {
  return {
    url: getServerEnv('SUPABASE_URL') || getServerEnv('PUBLIC_SUPABASE_URL'),
    serviceRoleKey: getServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
  }

  supabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return supabaseClient;
}

export function hasSupabaseConfig() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey);
}
