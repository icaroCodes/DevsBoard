import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let supabaseModulePromise = null;
let configModulePromise = null;

async function getSupabase() {
  if (!supabaseModulePromise) {
    supabaseModulePromise = import('../../../backend/src/database/connection.js');
  }
  const mod = await supabaseModulePromise;
  return mod.default || mod.supabase || mod;
}

async function getConfig() {
  if (!configModulePromise) {
    configModulePromise = import('../../../backend/src/config/index.js');
  }
  const mod = await configModulePromise;
  return mod.default || mod.config || mod;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const supabase = await getSupabase();
    const config = await getConfig();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Erro em /api/auth/login:', err);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

