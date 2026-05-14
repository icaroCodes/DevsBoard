import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '../database/connection.js';
import config from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { checkUsernameAvailable } from '../utils/usernames.js';
import {
  issueTokenPair,
  rotateRefresh,
  revokeFamilyByToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/tokenStore.js';

const router = Router();

// Mints a JWT signed with the Supabase project's JWT secret so the frontend
// Realtime client can authenticate against RLS policies that use auth.uid().
// `sub` must equal public.users.auth_id (uuid).
const generateSupabaseJwt = (authUuid) => {
  if (!config.supabase.jwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET não configurado');
  }
  return jwt.sign(
    { sub: authUuid, role: 'authenticated', aud: 'authenticated' },
    config.supabase.jwtSecret,
    { expiresIn: '7d' }
  );
};

// Garante que o usuário tem auth_id (uuid). Cria sob demanda pra usuários
// antigos. Retorna o uuid.
const ensureAuthId = async (userId) => {
  const { data: u, error } = await supabase
    .from('users')
    .select('auth_id')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (u?.auth_id) return u.auth_id;

  const newAuthId = crypto.randomUUID();
  const { error: updErr } = await supabase
    .from('users')
    .update({ auth_id: newAuthId })
    .eq('id', userId);
  if (updErr) throw updErr;
  return newAuthId;
};


// Helper to build the user response payload consistently
const buildUserPayload = (user) => ({
  id: user.id,
  name: user.display_name || user.name || null,
  email: user.email,
  avatar_url: user.avatar_url,
  username: user.username || null,
  needs_onboarding: !!user.needs_onboarding,
});

// Username availability check (used by onboarding & settings)
router.get('/username/check', async (req, res) => {
  try {

    const { username, exclude_user_id } = req.query;
    if (!username) return res.status(400).json({ error: 'username obrigatório' });

    const result = await checkUsernameAvailable(username, {
      excludeUserId: exclude_user_id || undefined,
    });

    if (result.ok) return res.json({ available: true, username: result.username });
    return res.json({ available: false, reason: result.reason });
  } catch (err) {
    console.error('[username/check]', err);
    res.status(500).json({ error: 'Erro ao verificar username' });
  }
});

router.post('/refresh', async (req, res) => {

  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token ausente' });

  const result = await rotateRefresh(token);
  if (!result.ok) {
    clearAuthCookies(res);
    // `reused` means we detected a replay and revoked the family. Surface a
    // distinct error code so the client can tell the user their session was
    // terminated for security reasons (not just expired).
    if (result.code === 'reused') {
      return res.status(401).json({ error: 'SESSION_REUSE_DETECTED', message: 'Sessão encerrada por segurança. Faça login novamente.' });
    }
    return res.status(401).json({ error: 'Sessão expirada' });
  }

  setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  res.status(200).json({
    success: true,
    token: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

router.post('/exchange', async (req, res) => {

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Código ausente' });

  try {
    const decoded = jwt.verify(code, config.jwt.accessSecret);
    if (decoded.purpose !== 'oauth_exchange') {
      return res.status(400).json({ error: 'Código inválido' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name:display_name, email, avatar_url, auth_id, username, needs_onboarding')
      .eq('id', decoded.userId)
      .single();
    if (error || !user) return res.status(401).json({ error: 'Usuário não encontrado' });

    const { accessToken, refreshToken } = await issueTokenPair(user.id);
    setAuthCookies(res, { accessToken, refreshToken });

    let authUuid;
    try { authUuid = user.auth_id || (await ensureAuthId(user.id)); } catch { authUuid = null; }
    let supabaseToken = null;
    if (authUuid) {
      try { supabaseToken = generateSupabaseJwt(authUuid); } catch (e) { console.warn('[Realtime JWT skip]', e.message); }
    }

    res.json({
      user: buildUserPayload(user),
      token: accessToken,
      refreshToken,
      supabaseToken,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Código expirado' });
    }
    console.error('[/auth/exchange]', err);
    res.status(401).json({ error: 'Código inválido' });
  }
});

router.get('/session', authenticate, async (req, res) => {

  // IMPORTANT: this endpoint must NOT mint new access/refresh tokens. It only
  // returns the user payload + a short-lived Supabase Realtime JWT scoped to
  // this user. Re-issuing access/refresh here would let anyone holding a
  // still-valid access cookie extend the session indefinitely, defeating the
  // 15-min access TTL. To rotate access/refresh, the client must hit
  // /auth/refresh, which requires possession of the refresh cookie/body.
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name:display_name, email, avatar_url, auth_id, username, needs_onboarding')
      .eq('id', req.userId)
      .single();
    if (error || !user) return res.status(401).json({ error: 'Sessão inválida' });

    let authUuid;
    try { authUuid = user.auth_id || (await ensureAuthId(user.id)); } catch { authUuid = null; }
    let supabaseToken = null;
    if (authUuid) {
      try { supabaseToken = generateSupabaseJwt(authUuid); } catch (e) { console.warn('[Realtime JWT skip]', e.message); }
    }

    res.json({
      user: buildUserPayload(user),
      supabaseToken,
    });
  } catch (err) {
    console.error('[/auth/session]', err);
    res.status(500).json({ error: 'Erro ao restaurar sessão' });
  }
});

router.get('/realtime-token', authenticate, async (req, res) => {
  try {

    const authUuid = await ensureAuthId(req.userId);
    const supabaseToken = generateSupabaseJwt(authUuid);
    res.json({ supabaseToken });
  } catch (err) {
    console.error('[realtime-token]', err);
    res.status(500).json({ error: 'Erro ao gerar token de realtime' });
  }
});

router.post('/logout', async (req, res) => {

  // Revoke the entire refresh-token family so the cookie can't be replayed
  // even if it's still within its TTL. Best-effort: failures here shouldn't
  // block the client from clearing local state.
  const refresh = req.cookies?.refreshToken || req.body?.refreshToken;
  if (refresh) {
    try { await revokeFamilyByToken(refresh); } catch (err) { console.warn('[logout] revoke failed', err); }
  }
  clearAuthCookies(res);
  res.status(200).json({ message: 'Sessão encerrada' });
});

export default router;
