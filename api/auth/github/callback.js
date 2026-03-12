import jwt from 'jsonwebtoken';

let supabaseModulePromise = null;
let configModulePromise = null;

async function getSupabase() {
  if (!supabaseModulePromise) {
    supabaseModulePromise = import('../../../../backend/src/database/connection.js');
  }
  const mod = await supabaseModulePromise;
  return mod.default || mod.supabase || mod;
}

async function getConfig() {
  if (!configModulePromise) {
    configModulePromise = import('../../../../backend/src/config/index.js');
  }
  const mod = await configModulePromise;
  return mod.default || mod.config || mod;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = req.query.code;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/auth?error=codigo_invalido`);
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:
          process.env.GITHUB_CALLBACK_URL ||
          'http://localhost:3001/auth/github/callback',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.redirect(`${FRONTEND_URL}/auth?error=github_falhou`);
    }

    const ghHeaders = {
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': 'DevsBoard',
    };

    const [userRes, emailRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);

    const ghUser = await userRes.json();
    const ghEmails = await emailRes.json();

    const primaryEmailObj =
      Array.isArray(ghEmails) && ghEmails.find((e) => e.primary && e.verified);
    const email = primaryEmailObj?.email || ghUser.email;

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/auth?error=email_nao_encontrado`);
    }

    const supabase = await getSupabase();
    const config = await getConfig();

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let user = existing;

    if (!existing) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name: ghUser.name || ghUser.login,
          email,
          avatar_url: ghUser.avatar_url,
        })
        .select('*')
        .single();

      if (error) {
        return res.redirect(`${FRONTEND_URL}/auth?error=erro_banco`);
      }

      user = newUser;
    }

    const token = jwt.sign(
      { userId: user.id },
      (await getConfig()).jwt.secret,
      { expiresIn: (await getConfig()).jwt.expiresIn }
    );

    const params = new URLSearchParams({
      token,
      user: JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      }),
    });

    return res.redirect(`${FRONTEND_URL}/auth?${params.toString()}`);
  } catch (err) {
    console.error('Erro em /api/auth/github/callback:', err);
    return res.redirect(`${FRONTEND_URL}/auth?error=erro_interno`);
  }
}

