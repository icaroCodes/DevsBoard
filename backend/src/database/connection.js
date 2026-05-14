import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceKey;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Configuração do Supabase ausente:', { url: !!supabaseUrl, key: !!supabaseServiceKey });
  throw new Error('SUPABASE_URL não encontrada. Verifique o arquivo backend/.env.');
}

// =============================================================================
// supabaseAdmin: the service-role client.
//
// BYPASSES Row Level Security. Use it ONLY for:
//   - Auth bootstrap (creating users on first OAuth login).
//   - Server-only operations that have no caller identity (cron-like jobs).
//   - Admin maintenance scripts.
//
// Do NOT use this client for normal user-driven requests once RLS policies
// are in place — that would defeat the whole point of having policies.
// Prefer `createUserClient(supabaseJwt)` for any code path that acts on a
// specific user's behalf.
// =============================================================================
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Create a Supabase client scoped to a specific user via their Supabase JWT.
 *
 * RLS policies will be evaluated against `auth.uid()` (the JWT's `sub`
 * claim, which we set to the user's `auth_id` uuid in tokenStore /
 * generateSupabaseJwt). This is the client that should drive user-facing
 * routes once they're migrated off `supabaseAdmin`.
 *
 * Requires SUPABASE_ANON_KEY in env — anon is the public key, RLS is what
 * actually protects the data.
 */
export const createUserClient = (supabaseJwt) => {
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY ausente — necessário para o cliente autenticado por usuário.');
  }
  if (!supabaseJwt) throw new Error('supabaseJwt obrigatório para createUserClient');

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${supabaseJwt}` } },
  });
};

// Backward-compatible default export. (REMOVED)
// Use `supabaseAdmin` explicitly for bypass or `supabaseForRequest(req)` for user context.
