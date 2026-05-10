import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import supabase from '../database/connection.js';
import config from '../config/index.js';

/**
 * OAuth login resolver — the source of truth for what happens when someone
 * comes back from a Google/GitHub callback.
 *
 * Lookup order (this is the whole point of Phase 3):
 *   1. user_identities by (provider, provider_id) — same external account
 *      that previously logged in. Just refresh tokens and let them in.
 *   2. users by email — same person, different provider. Mint a `merge_code`
 *      so the frontend can ask "this email already has an account, link it?"
 *      We do NOT create a new users row in this branch — that's how we end
 *      up with duplicate accounts (the bug we're fixing).
 *   3. nothing matched — brand new user. Create users + user_identities.
 *
 * Returns one of:
 *   { kind: 'login',          userId }
 *   { kind: 'merge_required', existingUserId, mergeCode, suggestedEmail }
 *   { kind: 'created',        userId }
 */
export const resolveOAuthLogin = async ({
  provider,         // 'google' | 'github'
  providerId,       // sub / github user id (string)
  email,            // email reported by the provider (already trimmed)
  name,             // display name from provider
  avatarUrl,        // avatar URL from provider, may be null
}) => {
  if (!provider || !providerId || !email) {
    throw new Error('resolveOAuthLogin requires provider, providerId, email');
  }

  // --- 1. Same external account already linked? ---------------------------
  const { data: existingIdentity } = await supabase
    .from('user_identities')
    .select('user_id')
    .eq('provider', provider)
    .eq('provider_id', String(providerId))
    .maybeSingle();

  if (existingIdentity?.user_id) {
    const userId = existingIdentity.user_id;

    // Touch last_login_at + provider_email (email at provider may have
    // changed since linking — keep our copy fresh).
    await supabase
      .from('user_identities')
      .update({
        last_login_at: new Date().toISOString(),
        provider_email: email,
      })
      .eq('provider', provider)
      .eq('provider_id', String(providerId));

    // Backfill avatar on the users row if it's missing — preserves the
    // behavior the old callbacks had.
    if (avatarUrl) {
      const { data: u } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .maybeSingle();
      if (u && !u.avatar_url) {
        await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
      }
    }

    return { kind: 'login', userId };
  }

  // --- 2. Email already in use by another account? ------------------------
  // We look at users.email here (legacy column) AND at user_identities so we
  // catch both (a) classic local/OAuth accounts and (b) accounts whose
  // primary email lives only on a different identity row.
  const lowered = email.toLowerCase();

  const [{ data: usersByEmail }, { data: identitiesByEmail }] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, name, avatar_url')
      .ilike('email', lowered)
      .limit(5),
    supabase
      .from('user_identities')
      .select('user_id, provider')
      .ilike('provider_email', lowered)
      .limit(5),
  ]);

  // Any user_id we find via either path is a candidate. Prefer the oldest
  // (lowest id) to be deterministic when duplicates exist from before
  // Phase 3.
  const candidateIds = new Set();
  (usersByEmail || []).forEach((u) => candidateIds.add(u.id));
  (identitiesByEmail || []).forEach((i) => candidateIds.add(i.user_id));

  if (candidateIds.size > 0) {
    const existingUserId = Math.min(...Array.from(candidateIds));
    const mergeCode = jwt.sign(
      {
        purpose: 'oauth_merge',
        existing_user_id: existingUserId,
        provider,
        provider_id: String(providerId),
        provider_email: email,
        // Carry the name/avatar through so the merge endpoint can
        // backfill them on the existing row if they're missing.
        provider_name: name || null,
        provider_avatar: avatarUrl || null,
      },
      config.jwt.accessSecret,
      { expiresIn: '5m' }
    );

    return {
      kind: 'merge_required',
      existingUserId,
      mergeCode,
      suggestedEmail: lowered,
    };
  }

  // --- 3. Brand new user --------------------------------------------------
  const auth_id = crypto.randomUUID();
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      name: name || email.split('@')[0],
      email,
      // Legacy columns kept populated for now — login local still reads them
      // and we haven't dropped them yet. Phase 4 (or later) will do that.
      password_hash: `${provider}:${providerId}`,
      provider,
      provider_id: String(providerId),
      avatar_url: avatarUrl || null,
      auth_id,
    })
    .select('id')
    .single();
  if (userError) throw userError;

  const { error: identityError } = await supabase
    .from('user_identities')
    .insert({
      user_id: newUser.id,
      provider,
      provider_id: String(providerId),
      provider_email: email,
      last_login_at: new Date().toISOString(),
    });
  if (identityError) {
    // Roll back the users row so we don't leave half-created accounts.
    await supabase.from('users').delete().eq('id', newUser.id);
    throw identityError;
  }

  return { kind: 'created', userId: newUser.id };
};

/**
 * Consume a merge_code (issued by resolveOAuthLogin's merge_required path)
 * and link the new identity to the existing user. Returns the user_id that
 * should be logged in.
 *
 * Idempotent: if the identity is already linked (e.g. user clicked confirm
 * twice), we just return the existing link instead of erroring.
 */
export const consumeMergeCode = async (code) => {
  let decoded;
  try {
    decoded = jwt.verify(code, config.jwt.accessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const e = new Error('merge_code_expired');
      e.status = 400;
      throw e;
    }
    const e = new Error('merge_code_invalid');
    e.status = 400;
    throw e;
  }

  if (decoded.purpose !== 'oauth_merge') {
    const e = new Error('merge_code_invalid');
    e.status = 400;
    throw e;
  }

  const {
    existing_user_id,
    provider,
    provider_id,
    provider_email,
    provider_avatar,
  } = decoded;

  // Make sure the existing user still exists (could have been deleted
  // between mergeCode issuance and confirmation).
  const { data: target } = await supabase
    .from('users')
    .select('id, avatar_url')
    .eq('id', existing_user_id)
    .maybeSingle();

  if (!target) {
    const e = new Error('merge_target_missing');
    e.status = 410;
    throw e;
  }

  // Reject if (provider, provider_id) is already linked to a DIFFERENT user —
  // someone else claimed it between code issuance and confirmation. Returning
  // 409 here is safer than silently relinking.
  const { data: existingLink } = await supabase
    .from('user_identities')
    .select('user_id')
    .eq('provider', provider)
    .eq('provider_id', provider_id)
    .maybeSingle();

  if (existingLink && existingLink.user_id !== existing_user_id) {
    const e = new Error('identity_owned_by_other');
    e.status = 409;
    throw e;
  }

  // Link the identity to the target user. Done as SELECT-then-UPDATE-or-
  // INSERT instead of upsert because the unique index on
  // (provider, provider_id) in migration 001 is partial (WHERE provider_id
  // IS NOT NULL), and Postgres rejects partial indexes as ON CONFLICT
  // targets ("there is no unique or exclusion constraint matching the
  // ON CONFLICT specification").
  const nowIso = new Date().toISOString();
  if (existingLink) {
    const { error: updateErr } = await supabase
      .from('user_identities')
      .update({
        user_id: existing_user_id,
        provider_email,
        last_login_at: nowIso,
      })
      .eq('provider', provider)
      .eq('provider_id', provider_id);
    if (updateErr) throw updateErr;
  } else {
    const { error: insertErr } = await supabase
      .from('user_identities')
      .insert({
        user_id: existing_user_id,
        provider,
        provider_id,
        provider_email,
        last_login_at: nowIso,
      });
    if (insertErr) throw insertErr;
  }

  // Optionally backfill avatar if the existing user has none.
  if (!target.avatar_url && provider_avatar) {
    await supabase
      .from('users')
      .update({ avatar_url: provider_avatar })
      .eq('id', existing_user_id);
  }

  return { userId: existing_user_id };
};
