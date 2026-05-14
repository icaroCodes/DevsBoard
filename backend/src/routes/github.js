import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '../database/connection.js';
import config from '../config/index.js';
import { resolveOAuthLogin } from '../utils/oauth.js';
import { issueTokenPair, setAuthCookies } from '../utils/tokenStore.js';

const router = Router();

const GITHUB_CLIENT_ID = (process.env.GITHUB_CLIENT_ID || '').trim();
const GITHUB_CLIENT_SECRET = (process.env.GITHUB_CLIENT_SECRET || '').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
const CALLBACK_URL = (process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback').trim();



// Sign a short-lived state token. Carrying purpose+provider in the payload
// means a state issued for Google can't be replayed against GitHub, and
// generally protects against login-CSRF (where an attacker tricks the victim
// into completing the OAuth dance for the attacker's pre-staged account).
const signOAuthState = (provider) =>
  jwt.sign(
    {
      purpose: 'oauth_state',
      provider,
      nonce: crypto.randomUUID(),
    },
    config.jwt.accessSecret,
    { expiresIn: '10m' }
  );

const verifyOAuthState = (token, expectedProvider) => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    return (
      decoded.purpose === 'oauth_state' &&
      decoded.provider === expectedProvider
    );
  } catch {
    return false;
  }
};

router.get('/', (req, res) => {
  console.log('[GitHub Auth] Iniciando OAuth — CALLBACK_URL:', CALLBACK_URL);
  const state = signOAuthState('github');
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'user:email',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});


router.get('/callback', async (req, res) => {

  const { code, state } = req.query;
  if (!code) return res.redirect(`${FRONTEND_URL}/auth?error=codigo_invalido`);

  // Reject the callback if state is missing, malformed, expired, or signed
  // for a different provider. Without this check, an attacker could feed the
  // victim a `code` from their own OAuth dance and log them into the
  // attacker's account (login-CSRF).
  if (!state || typeof state !== 'string' || !verifyOAuthState(state, 'github')) {
    return res.redirect(`${FRONTEND_URL}/auth?error=state_invalido`);
  }

  try {
    console.log('[GitHub Auth] Trocando code por token. CLIENT_ID:', GITHUB_CLIENT_ID?.substring(0, 8) + '...', 'SECRET_SET:', !!GITHUB_CLIENT_SECRET);
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code, redirect_uri: CALLBACK_URL }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[GitHub Auth] Falha na troca de token. Resposta do GitHub:', tokenData);
      return res.redirect(`${FRONTEND_URL}/auth?error=github_falhou`);
    }

    const ghHeaders = { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'DevsBoard' };
    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);
    const githubUser = await userRes.json();
    const emails = await emailsRes.json();

    const primaryEmail = Array.isArray(emails)
      ? emails.find(e => e.primary && e.verified)?.email
      : null;
    const email = githubUser.email || primaryEmail || `${githubUser.login}@github.noemail.com`;
    const name = githubUser.name || githubUser.login;
    const avatar_url = githubUser.avatar_url || null;

    const { userId } = await resolveOAuthLogin({
      provider: 'github',
      providerId: githubUser.id,
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
    console.error('[GitHub Auth Error]', err);
    res.redirect(`${FRONTEND_URL}/auth?error=erro_interno`);
  }
});

export default router;
