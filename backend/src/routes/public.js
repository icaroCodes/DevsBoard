import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin as supabase } from '../database/connection.js';
import config from '../config/index.js';
import { checkAndUnlock } from '../utils/checkAchievements.js';

// Public read-only endpoints are unauthenticated and therefore the easiest
// surface to enumerate. Cap requests per IP so a scraper can't grind through
// the username space or harvest profile data unrestricted.
const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
});

const publicSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas buscas. Aguarde um momento.' },
});

/**
 * Public profile routes ÔÇö mounted BEFORE the global `authenticate` middleware
 * in server.js so anonymous visitors can fetch a profile by its @username.
 *
 * What gets exposed: only fields that are explicitly safe to share. We never
 * leak email, password_hash, auth_id, provider, last_access_date, etc. The
 * private profile API lives under /profiles/me (authenticated).
 */

const router = Router();

const PUBLIC_COLUMNS =
  'id, username, name:display_name, avatar_url, bio, social_links, created_at, current_streak, longest_streak';

router.get('/profile/:username', publicReadLimiter, async (req, res) => {

  const username = String(req.params.username || '').trim().toLowerCase();
  if (!username) return res.status(404).json({ error: 'profile_not_found' });

  try {
    const { data, error } = await supabase
      .from('users')
      .select(PUBLIC_COLUMNS + ', is_public')
      .ilike('username', username)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'profile_not_found' });
    if (!data.is_public) return res.status(404).json({ error: 'profile_private' });

    // Drop is_public from the response ÔÇö the client never needs it.
    const { is_public, ...publicData } = data;
    void is_public;

    // Fetch achievements and session data for the public profile
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('active_seconds')
      .eq('user_id', data.id);
      
    const totalSeconds = (sessions || []).reduce((sum, s) => sum + (s.active_seconds || 0), 0);
    const longestSession = (sessions || []).length > 0 ? Math.max(...(sessions || []).map(s => s.active_seconds || 0)) : 0;

    const { achievementsWithProgress } = await checkAndUnlock(data.id, supabase);
    const unlockedAchievements = achievementsWithProgress.filter(a => a.unlocked);
    
    const tierWeights = { platina: 4, ouro: 3, prata: 2, bronze: 1 };
    const sortedAchievements = [...unlockedAchievements].sort((a, b) => {
      if (tierWeights[b.tier] !== tierWeights[a.tier]) {
        return tierWeights[b.tier] - tierWeights[a.tier];
      }
      return (b.id || 0) - (a.id || 0);
    });

    const topAchievements = sortedAchievements.slice(0, 3);
    const totalAchievements = achievementsWithProgress.length;

    res.json({
      ...publicData,
      display_name: publicData.name || publicData.username,
      stats: {
        total_hours: Math.floor(totalSeconds / 3600),
        longest_session_hours: Math.floor(longestSession / 3600),
        longest_session_minutes: Math.floor((longestSession % 3600) / 60),
        achievements_unlocked: unlockedAchievements.length,
        achievements_total: totalAchievements,
        achievements_percentage: Math.round((unlockedAchievements.length / totalAchievements) * 100),
        top_achievements: topAchievements
      }
    });
  } catch (err) {
    console.error('[GET /public/profile/:username]', err);
    res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
});

// Search users by username — used by the "Conta" page to discover profiles.
router.get('/search/users', publicSearchLimiter, async (req, res) => {

  const q = String(req.query.q || '').trim().toLowerCase().replace(/^@/, '');
  if (!q || q.length < 2) return res.json([]);

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name:display_name, avatar_url, is_public')
      .ilike('username', `${q}%`)
      .eq('is_public', true)
      .order('username')
      .limit(10);

    if (error) throw error;
    res.json((data || []).map(({ is_public, ...u }) => u));
  } catch (err) {
    console.error('[GET /public/search/users]', err);
    res.status(500).json({ error: 'Erro na busca' });
  }
});

// Phase 4: invite-link preview. The frontend page /invite/:token shows the
// team name + inviter before the user logs in / signs up. Anyone with the
// token already has the right to that information, so this is safe to
// expose anonymously.
router.get('/invite/:token', publicReadLimiter, async (req, res) => {

  const { token } = req.params;
  if (!token) return res.status(400).json({ error: 'invite_link_invalid' });

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.accessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'invite_link_expired' });
    }
    return res.status(400).json({ error: 'invite_link_invalid' });
  }

  if (decoded.purpose !== 'team_invite' || !decoded.team_id) {
    return res.status(400).json({ error: 'invite_link_invalid' });
  }

  try {
    const [{ data: team }, { data: inviter }] = await Promise.all([
      supabase
        .from('teams')
        .select('id, name, type, avatar_url')
        .eq('id', decoded.team_id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('name:display_name, username, avatar_url')
        .eq('id', decoded.invited_by)
        .maybeSingle(),
    ]);

    if (!team) return res.status(410).json({ error: 'team_not_found' });

    res.json({
      team,
      inviter: inviter || null,
      role: decoded.role || 'member',
      expires_at: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
    });
  } catch (err) {
    console.error('[GET /public/invite/:token]', err);
    res.status(500).json({ error: 'Erro ao carregar convite' });
  }
});

// ---------------------------------------------------------------------------
// Feedback wall — anonymous submissions shown on the landing page.
// ---------------------------------------------------------------------------

// Strict rate-limit for writes: 3 submissions / IP / hour.
// Anyone can post, so this is the spam wall.
const feedbackWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Você já enviou um feedback recentemente. Tente novamente em alguns minutos.' },
});

router.get('/feedbacks', publicReadLimiter, async (req, res) => {

  const limit = Math.min(Number(req.query.limit) || 24, 60);
  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('id, name, photo_url, text, rating, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[GET /public/feedbacks]', err);
    res.status(500).json({ error: 'Erro ao carregar feedbacks' });
  }
});

// Allowed mime types for the optional uploaded photo. Mirrors the avatar pipeline
// in routes/settings.js — HEIC is intentionally rejected because Safari is the
// only browser that renders it reliably.
const ALLOWED_PHOTO_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB after decode

// Defense in depth against stored XSS on the public feedback wall. The frontend
// is expected to render `name` and `text` as React text (auto-escaped), but we
// must NEVER trust that. Reject submissions that contain obvious HTML/script
// injection patterns, control characters, or URL schemes that browsers will
// execute. This intentionally keeps stored values untransformed so legitimate
// characters like `<3` render correctly when escaped on the client.
const DANGEROUS_TEXT_PATTERNS = [
  /<\s*\/?\s*(script|iframe|object|embed|link|meta|style|svg|math)\b/i,
  /\bjavascript\s*:/i,
  /\bvbscript\s*:/i,
  /\bdata\s*:[^,]*;\s*base64/i,
  /\bon[a-z]+\s*=\s*["'`]?[^>]/i, // onerror=, onclick=, etc.
  // Control characters except tab (\x09), newline (\x0A), CR (\x0D).
  // eslint-disable-next-line no-control-regex
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/,
];
const containsDangerousContent = (s) =>
  typeof s === 'string' && DANGEROUS_TEXT_PATTERNS.some((rx) => rx.test(s));

router.post(
  '/feedbacks',
  feedbackWriteLimiter,
  [
    body('name')
      .isString().withMessage('Nome obrigatório')
      .trim()
      .isLength({ min: 1, max: 60 }).withMessage('Nome entre 1 e 60 caracteres'),
    body('text')
      .isString().withMessage('Mensagem obrigatória')
      .trim()
      .isLength({ min: 1, max: 280 }).withMessage('Mensagem entre 1 e 280 caracteres'),
    body('photo_base64')
      .optional({ checkFalsy: true, nullable: true })
      .isString().withMessage('Imagem inválida'),
    body('rating')
      .optional({ nullable: true })
      .isInt({ min: 1, max: 5 }).withMessage('Avaliação entre 1 e 5'),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, text, photo_base64, rating } = req.body;

    if (containsDangerousContent(name) || containsDangerousContent(text)) {
      return res.status(400).json({
        error: 'invalid_content',
        message: 'Conteúdo inválido: tags HTML, scripts ou URLs javascript: não são permitidos.',
      });
    }

    let photo_url = null;

    // Decode + upload optional photo to Supabase Storage. Same pipeline as the
    // authenticated avatar upload in routes/settings.js.
    if (photo_base64) {
      try {
        const header = String(photo_base64).split(',')[0] || '';
        const mimeMatch = header.match(/^data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : null;

        if (!mimeType || !ALLOWED_PHOTO_MIMES.has(mimeType)) {
          return res.status(400).json({
            error: 'unsupported_image_format',
            message: 'Formato de imagem não suportado. Use JPG, PNG ou WebP.',
          });
        }

        const base64Body = String(photo_base64).split(',')[1] || '';
        const buffer = Buffer.from(base64Body, 'base64');

        if (buffer.length === 0) {
          return res.status(400).json({ error: 'Imagem vazia' });
        }
        if (buffer.length > MAX_PHOTO_BYTES) {
          return res.status(400).json({ error: 'Imagem maior que 2 MB' });
        }

        const fileExt = mimeType.split('/')[1];
        const randomId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const filePath = `feedbacks/${randomId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) {
          console.error('[POST /public/feedbacks] upload', uploadError);
          return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        photo_url = publicUrl;
      } catch (err) {
        console.error('[POST /public/feedbacks] decode', err);
        return res.status(400).json({ error: 'Imagem inválida' });
      }
    }

    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert({
          name: String(name).trim(),
          text: String(text).trim(),
          photo_url,
          rating: rating == null ? 5 : Number(rating),
        })
        .select('id, name, photo_url, text, rating, created_at')
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      console.error('[POST /public/feedbacks]', err);
      res.status(500).json({ error: 'Erro ao enviar feedback' });
    }
  }
);

export default router;
