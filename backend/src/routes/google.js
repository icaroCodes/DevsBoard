import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '../database/connection.js';
import config from '../config/index.js';
import { resolveOAuthLogin } from '../utils/oauth.js';
import { issueTokenPair, setAuthCookies } from '../utils/tokenStore.js';

const router = Router();

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
const CALLBACK_URL = (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback').trim();


// See backend/src/routes/github.js for the rationale on OAuth state.
const signOAuthState = (provider) =>
  jwt.sign(
    { purpose: 'oauth_state', provider, nonce: crypto.randomUUID() },
    config.jwt.accessSecret,
    { expiresIn: '10m' }
  );

const verifyOAuthState = (token, expectedProvider) => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    return decoded.purpose === 'oauth_state' && decoded.provider === expectedProvider;
  } catch {
    return false;
  }
};

router.get('/', (req, res) => {
  console.log('[Google Auth] Iniciando OAuth — CALLBACK_URL:', CALLBACK_URL);
  if (!GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/auth?error=google_nao_configurado`);
  }
  const state = signOAuthState('google');
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/callback', async (req, res) => {

  const { code, state, error: oauthError } = req.query;
  if (oauthError) return res.redirect(`${FRONTEND_URL}/auth?error=google_negado`);
  if (!code) return res.redirect(`${FRONTEND_URL}/auth?error=codigo_invalido`);

  if (!state || typeof state !== 'string' || !verifyOAuthState(state, 'google')) {
    return res.redirect(`${FRONTEND_URL}/auth?error=state_invalido`);
  }

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

    const { userId } = await resolveOAuthLogin({
      provider: 'google',
      providerId: profile.sub,
      email,
      name,
      avatarUrl: avatar_url,
    });
    const { accessToken, refreshToken } = await issueTokenPair(userId);
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
