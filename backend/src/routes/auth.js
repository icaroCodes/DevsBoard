import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import supabase from '../database/connection.js';
import config from '../config/index.js';
import { authRateLimiter } from '../middleware/security.js';

const router = Router();

// Esquemas Zod para validação
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
  
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15m
  res.cookie('refreshToken', refreshToken, cookieOptions); // 7d
};

router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { name, email, password } = validated;

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    const password_hash = await bcrypt.hash(password, 12); // Salt maior
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash })
      .select('id, name, email, avatar_url')
      .single();

    if (error) throw error;

    const { accessToken, refreshToken } = generateTokens(newUser.id);
    setAuthCookies(res, { accessToken, refreshToken });

    res.status(201).json({ 
      user: newUser,
      token: accessToken,
      refreshToken: refreshToken
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    setAuthCookies(res, { accessToken, refreshToken });

    res.json({ 
      user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url },
      token: accessToken,
      refreshToken: refreshToken
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

router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Sessão encerrada' });
});

export default router;
