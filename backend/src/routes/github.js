import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../database/connection.js';
import config from '../config/index.js';

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const CALLBACK_URL = 'http://localhost:3001/auth/github/callback';

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
    // Troca o code pelo access token
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

    // Busca dados do usuário no GitHub
    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);
    const githubUser = await userRes.json();
    const emails = await emailsRes.json();

    // Pega o email primário verificado
    const primaryEmail = Array.isArray(emails)
      ? emails.find(e => e.primary && e.verified)?.email
      : null;
    const email = githubUser.email || primaryEmail || `${githubUser.login}@github.noemail.com`;
    const name = githubUser.name || githubUser.login;

    const avatar_url = githubUser.avatar_url || null;

    // Busca ou cria o usuário no banco
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
      // Atualiza o avatar sempre que fizer login
      await supabase.from('users').update({ avatar_url }).eq('id', user.id);
      user.avatar_url = avatar_url;
    }

    // Emite o JWT e redireciona para o frontend
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const params = new URLSearchParams({ token, id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url || '' });
    res.redirect(`${FRONTEND_URL}/auth?${params}`);
  } catch (err) {
    console.error(err);
    res.redirect(`${FRONTEND_URL}/auth?error=erro_interno`);
  }
});

export default router;
