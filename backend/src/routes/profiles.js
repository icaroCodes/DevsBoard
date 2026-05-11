import { Router } from 'express';
import { z } from 'zod';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';
import { checkUsernameAvailable } from '../utils/usernames.js';

const router = Router();
router.use(authenticate);

const PROFILE_COLUMNS =
  'id, name:display_name, email, avatar_url, username, display_name, bio, social_links, is_public, last_username_change_at, created_at, needs_onboarding';

const socialLinksSchema = z
  .object({
    twitter: z.string().url().or(z.literal('')).optional(),
    github: z.string().url().or(z.literal('')).optional(),
    linkedin: z.string().url().or(z.literal('')).optional(),
    website: z.string().url().or(z.literal('')).optional(),
  })
  .partial()
  .strict();

const updateSchema = z
  .object({
    username: z.string().min(3).max(30).optional(),
    display_name: z.string().trim().min(1).max(80).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    social_links: socialLinksSchema.optional(),
    is_public: z.boolean().optional(),
    needs_onboarding: z.boolean().optional(),
  })
  .strict();

router.get('/me', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(PROFILE_COLUMNS)
      .eq('id', req.userId)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Perfil n├úo encontrado' });
    res.json({ ...data, needs_onboarding: !!data.needs_onboarding });
  } catch (err) {
    console.error('[GET /profiles/me]', err);
    res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
});

router.put('/me', async (req, res) => {
  try {
    const parsed = updateSchema.parse(req.body);

    // Username: validate against the same rules the SQL trigger enforces, and
    // bail before the DB call if the format/reserved/taken check fails. The
    // trigger is the source of truth ÔÇö we just want a friendlier error path.
    if (parsed.username !== undefined) {
      const result = await checkUsernameAvailable(parsed.username, {
        excludeUserId: req.userId,
      });
      if (!result.ok) {
        return res
          .status(400)
          .json({ error: 'username_unavailable', reason: result.reason });
      }
      parsed.username = result.username; // canonical lowercase
      parsed.needs_onboarding = false; // They chose a username, onboarding complete!
    }

    const { data, error } = await supabase
      .from('users')
      .update(parsed)
      .eq('id', req.userId)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      // Surface the trigger's RAISE EXCEPTION codes so the frontend can show
      // a precise message. PostgREST forwards these in the `message` field.
      const msg = error.message || '';
      if (msg.includes('username_cooldown')) {
        return res.status(400).json({ error: 'username_cooldown' });
      }
      if (msg.includes('reserved_username')) {
        return res.status(400).json({ error: 'reserved_username' });
      }
      if (msg.includes('invalid_username')) {
        return res.status(400).json({ error: 'invalid_username' });
      }
      // 23505 = unique_violation (username taken between our check and the
      // write ÔÇö race condition fallback).
      if (error.code === '23505') {
        return res.status(409).json({ error: 'username_taken' });
      }
      throw error;
    }

    res.json({ ...data, needs_onboarding: !!data.needs_onboarding });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    console.error('[PUT /profiles/me]', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

export default router;
