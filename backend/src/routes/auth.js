import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import supabase from '../database/connection.js';
import config from '../config/index.js';
import { authRateLimiter } from '../middleware/security.js';
import { authenticate } from '../middleware/auth.js';
import { checkUsernameAvailable } from '../utils/usernames.js';
import { consumeMergeCode } from '../utils/oauth.js';

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


const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(255),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

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

router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { name, email, password } = validated;
    const lowered = email.toLowerCase();

    // Phase 3 fix: check globally for the email, not just provider='local'.
    // Otherwise a user with a Google account could register a second local
    // row with the same email — exactly the duplicate-account bug we're
    // fixing. We also peek at user_identities.provider_email so accounts
    // whose primary email lives only on the identity row are caught.
    const [{ data: existingUsers }, { data: existingIdentities }] = await Promise.all([
      supabase
        .from('users')
        .select('id, provider')
        .ilike('email', lowered)
        .limit(5),
      supabase
        .from('user_identities')
        .select('user_id, provider')
        .ilike('provider_email', lowered)
        .limit(5),
    ]);

    const allProviders = new Set([
      ...(existingUsers || []).map((u) => u.provider).filter(Boolean),
      ...(existingIdentities || []).map((i) => i.provider).filter(Boolean),
    ]);

    if (allProviders.size > 0) {
      // Pick the most useful suggestion: 'local' beats OAuth (user has a
      // password they can use), then google, then github.
      const order = ['local', 'google', 'github'];
      const suggested =
        order.find((p) => allProviders.has(p)) || [...allProviders][0];
      return res.status(409).json({
        error: 'email_in_use',
        existing_provider: suggested,
      });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const auth_id = crypto.randomUUID();
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash, auth_id, provider: 'local' })
      .select('id, name, email, avatar_url, auth_id, username')
      .single();

    if (error) throw error;

    // Phase 1 dual-write: mirror this account into user_identities so Phase 3
    // can switch lookups without a separate backfill. Best-effort — a failure
    // here doesn't roll back the user creation (the migration backfill will
    // pick it up on the next deploy).
    const { error: identityError } = await supabase
      .from('user_identities')
      .insert({
        user_id: newUser.id,
        provider: 'local',
        provider_id: null,
        provider_email: email,
      });
    if (identityError) console.warn('[register identity skip]', identityError.message);

    const { accessToken, refreshToken } = generateTokens(newUser.id);
    setAuthCookies(res, { accessToken, refreshToken });

    let supabaseToken = null;
    try { supabaseToken = generateSupabaseJwt(newUser.auth_id); } catch (e) { console.warn('[Realtime JWT skip]', e.message); }

    res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar_url: newUser.avatar_url,
        username: newUser.username || null,
        needs_onboarding: !newUser.username,
      },
      token: accessToken,
      refreshToken: refreshToken,
      supabaseToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// Public endpoint — used by the username-onboarding form to check
// availability live. Format-only failures are cheap (no DB hit), reserved /
// taken require a DB lookup. Rate-limited via the global API limiter.
router.get('/username/check', async (req, res) => {
  const raw = String(req.query.username ?? '').trim();
  if (!raw) return res.status(400).json({ available: false, reason: 'empty' });

  try {
    const result = await checkUsernameAvailable(raw);
    if (result.ok) return res.json({ available: true, username: result.username });
    return res.json({ available: false, reason: result.reason });
  } catch (err) {
    console.error('[username/check]', err);
    res.status(500).json({ error: 'Erro ao verificar username' });
  }
});

router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    const lowered = email.toLowerCase();
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .ilike('email', lowered)
      .eq('provider', 'local')
      .maybeSingle();

    if (!user || !user.password_hash) {
      // No local row with this email. Before falling back to "credenciais
      // inválidas" — which is misleading if the user's only account is OAuth —
      // check whether this email is actually known via Google/GitHub. If so,
      // tell them which provider to use.
      const { data: oauthRows } = await supabase
        .from('users')
        .select('provider')
        .ilike('email', lowered)
        .neq('provider', 'local')
        .limit(3);

      const oauthProviders = (oauthRows || []).map((r) => r.provider).filter(Boolean);
      if (oauthProviders.length > 0) {
        const order = ['google', 'github'];
        const suggested = order.find((p) => oauthProviders.includes(p)) || oauthProviders[0];
        return res.status(401).json({
          error: 'use_oauth',
          existing_provider: suggested,
        });
      }
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    setAuthCookies(res, { accessToken, refreshToken });

    const authUuid = await ensureAuthId(user.id);
    let supabaseToken = null;
    try { supabaseToken = generateSupabaseJwt(authUuid); } catch (e) { console.warn('[Realtime JWT skip]', e.message); }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        username: user.username || null,
        needs_onboarding: !user.username,
      },
      token: accessToken,
      refreshToken: refreshToken,
      supabaseToken,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login' });
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
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(401).json({ error: 'Sessão expirada' });
  }
});

// Phase 3: confirms an OAuth merge. The user just came back from Google or
// GitHub, and the OAuth callback determined that the email matches an
// existing account — so it issued a `merge_code` (5-min JWT) and bounced
// here. This endpoint validates the code, links the new identity to the
// existing user, and logs them in to that user.
router.post('/oauth/merge', authRateLimiter, async (req, res) => {
  const { merge_code: mergeCode } = req.body || {};
  if (!mergeCode) return res.status(400).json({ error: 'merge_code_missing' });

  try {
    const { userId } = await consumeMergeCode(mergeCode);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, auth_id, username')
      .eq('id', userId)
      .single();
    if (error || !user) return res.status(401).json({ error: 'usuario_nao_encontrado' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    setAuthCookies(res, { accessToken, refreshToken });

    const authUuid = user.auth_id || (await ensureAuthId(user.id));
    let supabaseToken = null;
    try { supabaseToken = generateSupabaseJwt(authUuid); } catch (e) { console.warn('[Realtime JWT skip]', e.message); }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        username: user.username || null,
        needs_onboarding: !user.username,
      },
      token: accessToken,
      refreshToken,
      supabaseToken,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('[/auth/oauth/merge]', err);
    res.status(500).json({ error: 'Erro ao conectar conta' });
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
      .select('id, name, email, avatar_url, auth_id, username')
      .eq('id', decoded.userId)
      .single();
    if (error || !user) return res.status(401).json({ error: 'Usuário não encontrado' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    setAuthCookies(res, { accessToken, refreshToken });

    const authUuid = user.auth_id || (await ensureAuthId(user.id));
    let supabaseToken = null;
    try { supabaseToken = generateSupabaseJwt(authUuid); } catch (e) { console.warn('[Realtime JWT skip]', e.message); }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        username: user.username || null,
        needs_onboarding: !user.username,
      },
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
      .select('id, name, email, avatar_url, auth_id, username')
      .eq('id', req.userId)
      .single();
    if (error || !user) return res.status(401).json({ error: 'Sessão inválida' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    setAuthCookies(res, { accessToken, refreshToken });

    const authUuid = user.auth_id || (await ensureAuthId(user.id));
    let supabaseToken = null;
    try { supabaseToken = generateSupabaseJwt(authUuid); } catch (e) { console.warn('[Realtime JWT skip]', e.message); }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        username: user.username || null,
        needs_onboarding: !user.username,
      },
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
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Sessão encerrada' });
});

export default router;
