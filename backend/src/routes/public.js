import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../database/connection.js';
import config from '../config/index.js';

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
  'id, username, display_name, name, avatar_url, bio, social_links, created_at, current_streak, longest_streak';

router.get('/profile/:username', async (req, res) => {
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

    // display_name falls back to name (legacy column) so existing users look
    // sensible without explicitly migrating display_name.
    res.json({
      ...publicData,
      display_name: publicData.display_name || publicData.name,
    });
  } catch (err) {
    console.error('[GET /public/profile/:username]', err);
    res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
});

// Phase 4: invite-link preview. The frontend page /invite/:token shows the
// team name + inviter before the user logs in / signs up. Anyone with the
// token already has the right to that information, so this is safe to
// expose anonymously.
router.get('/invite/:token', async (req, res) => {
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
        .select('name, username, avatar_url')
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

export default router;
