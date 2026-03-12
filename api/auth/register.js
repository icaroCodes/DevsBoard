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
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const supabase = await getSupabase();
    const config = await getConfig();

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash })
      .select('id, name, email, avatar_url')
      .single();

    if (error) throw error;

    const token = jwt.sign(
      { userId: newUser.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('Erro em /api/auth/register:', err);
    return res.status(500).json({ error: 'Erro ao criar conta' });
  }
}

