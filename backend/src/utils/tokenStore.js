import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '../database/connection.js';
import config from '../config/index.js';

// =============================================================================
// Refresh-token rotation with reuse detection.
//
// Why: a stolen refresh token used to silently work for its full 7-day TTL.
// With rotation, every refresh consumes the old token and issues a new one
// bound to the same "family". If a *consumed* token is ever presented again
// (because the real user already rotated past it), we know something is
// wrong: revoke the entire family and force re-login. This catches:
//   - refresh tokens leaked via XSS / browser-history / log scraping
//   - replay attacks
//   - silent persistence on a compromised device
// =============================================================================

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const signAccessToken = (userId) =>
  jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpires });

const signRefreshToken = (userId, jti) =>
  jwt.sign(
    { userId, jti, purpose: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpires, jwtid: jti }
  );

/**
 * Mint a brand-new (access, refresh) pair for a fresh login or OAuth callback.
 * Always opens a new refresh family.
 */
export async function issueTokenPair(userId) {
  const jti = crypto.randomUUID();
  const familyId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS).toISOString();

  const { error } = await supabase
    .from('refresh_tokens')
    .insert({ jti, user_id: userId, family_id: familyId, expires_at: expiresAt });
  if (error) throw error;

  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId, jti),
    familyId,
    jti,
  };
}

/**
 * Consume a refresh token and issue the next pair. Implements the security
 * properties documented above.
 *
 * Returns:
 *   { ok: true, accessToken, refreshToken }
 *   { ok: false, code: 'invalid' | 'expired' | 'reused' | 'revoked' | 'unknown' }
 */
export async function rotateRefresh(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return { ok: false, code: 'invalid' };

  let decoded;
  try {
    decoded = jwt.verify(rawToken, config.jwt.refreshSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') return { ok: false, code: 'expired' };
    return { ok: false, code: 'invalid' };
  }

  // Legacy tokens (pre-rotation) carried no jti. Force re-login rather than
  // grandfather them in — silently accepting unbacked tokens defeats the
  // whole point of the rotation table.
  if (!decoded.jti || decoded.purpose !== 'refresh') {
    return { ok: false, code: 'invalid' };
  }

  const { data: row, error: lookupErr } = await supabase
    .from('refresh_tokens')
    .select('jti, user_id, family_id, used_at, revoked_at, expires_at')
    .eq('jti', decoded.jti)
    .maybeSingle();

  if (lookupErr || !row) return { ok: false, code: 'unknown' };

  if (String(row.user_id) !== String(decoded.userId)) {
    // jti collision / tampering — defensive guard.
    return { ok: false, code: 'invalid' };
  }
  if (row.revoked_at) return { ok: false, code: 'revoked' };
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { ok: false, code: 'expired' };
  }

  // Reuse detection: a previously-consumed token is being replayed. Burn the
  // whole family — the attacker and the legitimate user are now both holding
  // a token, and we can't tell which is which, so re-login is the only safe
  // path.
  if (row.used_at) {
    await supabase
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('family_id', row.family_id)
      .is('revoked_at', null);
    return { ok: false, code: 'reused' };
  }

  // Happy path: mint the next pair in the same family, mark this jti as used.
  const newJti = crypto.randomUUID();
  const newExpires = new Date(Date.now() + REFRESH_TTL_MS).toISOString();

  const { error: insertErr } = await supabase
    .from('refresh_tokens')
    .insert({
      jti: newJti,
      user_id: row.user_id,
      family_id: row.family_id,
      expires_at: newExpires,
    });
  if (insertErr) throw insertErr;

  const { error: updateErr } = await supabase
    .from('refresh_tokens')
    .update({ used_at: new Date().toISOString(), replaced_by: newJti })
    .eq('jti', row.jti);
  if (updateErr) throw updateErr;

  return {
    ok: true,
    accessToken: signAccessToken(row.user_id),
    refreshToken: signRefreshToken(row.user_id, newJti),
    familyId: row.family_id,
    jti: newJti,
  };
}

/**
 * Best-effort revocation of every refresh token in a family. Used on logout
 * (revokes the active session) and on reuse detection.
 */
export async function revokeFamilyByToken(rawToken) {
  if (!rawToken) return;
  try {
    const decoded = jwt.verify(rawToken, config.jwt.refreshSecret, {
      ignoreExpiration: true,
    });
    if (!decoded?.jti) return;
    const { data: row } = await supabase
      .from('refresh_tokens')
      .select('family_id')
      .eq('jti', decoded.jti)
      .maybeSingle();
    if (!row?.family_id) return;
    await supabase
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('family_id', row.family_id)
      .is('revoked_at', null);
  } catch {
    // Logout shouldn't fail because the token was malformed — best-effort.
  }
}

/**
 * Helper: writes the standard auth cookies. Shared so the access/refresh TTLs
 * stay in sync everywhere.
 */
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
  };

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: REFRESH_TTL_MS });
};

export const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
  };
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};
