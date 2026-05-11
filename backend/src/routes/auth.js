import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import supabase from '../database/connection.js';
import config from '../config/index.js';
import { authRateLimiter } from '../middleware/security.js';
import { authenticate } from '../middleware/auth.js';
import { checkUsernameAvailable } from '../utils/usernames.js';

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


const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpires });
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpires });
  return { accessToken, refreshToken };
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, cookieOptions);
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

  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    const { accessToken, refreshToken } = generateTokens(decoded.userId);
    setAuthCookies(res, { accessToken, refreshToken });
    res.status(200).json({ 
      success: true,
      token: accessToken,
      refreshToken: refreshToken
    });
  } catch {
    const cookieOptions = {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(401).json({ error: 'Sessão expirada' });
  }
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

    const { accessToken, refreshToken } = generateTokens(user.id);
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
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name:display_name, email, avatar_url, auth_id, username, needs_onboarding')
      .eq('id', req.userId)
      .single();
    if (error || !user) return res.status(401).json({ error: 'Sessão inválida' });

    const { accessToken, refreshToken } = generateTokens(user.id);
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

router.post('/logout', (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
  };
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.status(200).json({ message: 'Sessão encerrada' });
});

export default router;
