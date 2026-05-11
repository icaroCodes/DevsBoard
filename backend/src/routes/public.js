import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../database/connection.js';
import config from '../config/index.js';
import { checkAndUnlock } from '../utils/checkAchievements.js';

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

    // Fetch achievements and session data for the public profile
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('active_seconds')
      .eq('user_id', data.id);
      
    const totalSeconds = (sessions || []).reduce((sum, s) => sum + (s.active_seconds || 0), 0);
    const longestSession = (sessions || []).length > 0 ? Math.max(...(sessions || []).map(s => s.active_seconds || 0)) : 0;

    const { achievementsWithProgress } = await checkAndUnlock(data.id);
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
router.get('/search/users', async (req, res) => {
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

export default router;
