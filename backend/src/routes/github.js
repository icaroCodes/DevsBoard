import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../database/connection.js';
import config from '../config/index.js';

const router = Router();

const GITHUB_CLIENT_ID = (process.env.GITHUB_CLIENT_ID || '').trim();
const GITHUB_CLIENT_SECRET = (process.env.GITHUB_CLIENT_SECRET || '').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
const CALLBACK_URL = (process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback').trim();

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

// GET /auth/github — redireciona para o GitHub
router.get('/', (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'user:email',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GET /auth/github/callback — GitHub redireciona aqui com o code
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${FRONTEND_URL}/auth?error=codigo_invalido`);

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
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

    let { data: user } = await supabase.from('users').select('id, name, email, avatar_url').eq('email', email).single();

    if (!user) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({ name, email, password_hash: `github:${githubUser.id}`, avatar_url })
        .select('id, name, email, avatar_url')
        .single();
      if (error) return res.redirect(`${FRONTEND_URL}/auth?error=erro_banco`);
      user = newUser;
    } else {
      if (!user.avatar_url) {
        await supabase.from('users').update({ avatar_url }).eq('id', user.id);
        user.avatar_url = avatar_url;
      }
    }

    // Emissão segura via Cookies
    const { accessToken, refreshToken } = generateTokens(user.id);
    setAuthCookies(res, { accessToken, refreshToken });

    // Redireciona APENAS com flag de sucesso, sem o token na URL!
    res.redirect(`${FRONTEND_URL}/auth?success=true`);
  } catch (err) {
    console.error('[GitHub Auth Error]', err);
    res.redirect(`${FRONTEND_URL}/auth?error=erro_interno`);
  }
});

export default router;
