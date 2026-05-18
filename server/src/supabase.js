const { createClient } = require('@supabase/supabase-js');

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
}

function hasSupabaseConfig() {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.serviceRoleKey);
}

function createSupabaseAdminClient() {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.serviceRoleKey) {
    throw new Error('Supabase non configurato: imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

module.exports = {
  hasSupabaseConfig,
  createSupabaseAdminClient,
};
