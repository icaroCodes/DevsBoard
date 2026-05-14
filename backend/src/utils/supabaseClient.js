import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';
import { supabaseAdmin, createUserClient } from '../database/connection.js';

// =============================================================================
// Per-request authenticated Supabase client helper.
//
// Goal: let route handlers drop the service-role escape hatch and operate
// under the same RLS-enforced view of the database that any other client
// would get. The flow is:
//
//   1. We already have `req.userId` (our app's bigint user id) from the
//      access-token JWT verified by middleware/auth.js.
//   2. RLS policies are written against `auth.uid()` — the `sub` of the
//      Supabase JWT, which we set to the user's `auth_id` (uuid).
//   3. This helper looks up / mints the user's `auth_id`, signs a short-lived
//      Supabase JWT with it, and returns a Supabase client bound to that JWT.
//
// The result is memoized on `req` so a single request doesn't pay the cost
// (DB lookup + JWT sign + new client) multiple times if several handlers
// touch the database.
//
// Migration pattern for an existing route:
//
//   ❌ Before:
//      import supabase from '../database/connection.js';
//      const { data } = await supabase.from('finances').select('*');
//
//   ✅ After:
//      import { supabaseForRequest } from '../utils/supabaseClient.js';
//      const supabase = await supabaseForRequest(req);
//      const { data } = await supabase.from('finances').select('*');
//
// Once every route is migrated AND RLS policies are in place, remove the
// default export from database/connection.js and force everyone through
// `supabaseAdmin` (explicit) or `supabaseForRequest` (the common case).
// =============================================================================

const ensureAuthId = async (userId) => {
  const { data: u, error } = await supabaseAdmin
    .from('users')
    .select('auth_id')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (u?.auth_id) return u.auth_id;

  const newAuthId = crypto.randomUUID();
  const { error: updErr } = await supabaseAdmin
    .from('users')
    .update({ auth_id: newAuthId })
    .eq('id', userId);
  if (updErr) throw updErr;
  return newAuthId;
};

const signSupabaseJwt = (authUuid) => {
  if (!config.supabase.jwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET ausente — não é possível assinar JWT para o cliente Supabase.');
  }
  return jwt.sign(
    { sub: authUuid, role: 'authenticated', aud: 'authenticated' },
    config.supabase.jwtSecret,
    { expiresIn: '5m' }
  );
};

/**
 * Returns a Supabase client authenticated as `req.userId`. RLS policies will
 * be evaluated against the user's auth.uid().
 */
export async function supabaseForRequest(req) {
  if (req._supabaseClient) return req._supabaseClient;
  if (!req.userId) throw new Error('supabaseForRequest exige req.userId (authenticate middleware).');

  const authUuid = await ensureAuthId(req.userId);
  const jwtToken = signSupabaseJwt(authUuid);
  const client = createUserClient(jwtToken);

  req._supabaseClient = client;
  return client;
}

/**
 * Escape hatch when a route genuinely needs to bypass RLS (e.g. cron-like
 * server-only jobs). Prefer `supabaseForRequest` whenever a caller identity
 * exists.
 */
export { supabaseAdmin };
