import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../database/connection.js';
import config from '../config/index.js';
import { resolveOAuthLogin } from '../utils/oauth.js';

const router = Router();

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
const CALLBACK_URL = (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback').trim();

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

router.get('/', (req, res) => {
  console.log('[Google Auth] Iniciando OAuth — CALLBACK_URL:', CALLBACK_URL);
  if (!GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/auth?error=google_nao_configurado`);
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/callback', async (req, res) => {
  const { code, error: oauthError } = req.query;
  if (oauthError) return res.redirect(`${FRONTEND_URL}/auth?error=google_negado`);
  if (!code) return res.redirect(`${FRONTEND_URL}/auth?error=codigo_invalido`);

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[Google Auth] Falha na troca de token:', tokenData);
      return res.redirect(`${FRONTEND_URL}/auth?error=google_falhou`);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile?.email) {
      console.error('[Google Auth] Perfil sem email:', profile);
      return res.redirect(`${FRONTEND_URL}/auth?error=email_indisponivel`);
    }

    const email = profile.email;
    const name = profile.name || profile.given_name || email.split('@')[0];
    const avatar_url = profile.picture || null;

    const result = await resolveOAuthLogin({
      provider: 'google',
      providerId: profile.sub,
      email,
      name,
      avatarUrl: avatar_url,
    });

    if (result.kind === 'merge_required') {
      // Email already belongs to a different account. Bounce to the
      // frontend with a merge_code so the user can confirm linking.
      return res.redirect(
        `${FRONTEND_URL}/auth?merge_code=${encodeURIComponent(result.mergeCode)}` +
          `&merge_provider=google&merge_email=${encodeURIComponent(result.suggestedEmail)}`
      );
    }

    // result.kind === 'login' or 'created' — both fall through to a normal
    // exchange-code redirect.
    const userId = result.userId;
    const { accessToken, refreshToken } = generateTokens(userId);
    setAuthCookies(res, { accessToken, refreshToken });

    const exchangeCode = jwt.sign(
      { userId, purpose: 'oauth_exchange' },
      config.jwt.accessSecret,
      { expiresIn: '60s' }
    );

    res.redirect(`${FRONTEND_URL}/auth?code=${encodeURIComponent(exchangeCode)}`);
  } catch (err) {
    console.error('[Google Auth Error]', err);
    res.redirect(`${FRONTEND_URL}/auth?error=erro_interno`);
  }
});

export default router;
