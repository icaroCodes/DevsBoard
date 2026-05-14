import { Router } from 'express';
import { checkAndUnlock, ACHIEVEMENTS } from '../utils/checkAchievements.js';
import { supabaseForRequest } from '../utils/supabaseClient.js';

const router = Router();



router.post('/check', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const { newlyUnlocked } = await checkAndUnlock(req.userId, supabase);
    res.json({ newly_unlocked: newlyUnlocked });
  } catch (err) {
    console.error('[POST /achievements/check]', err);
    res.status(500).json({ error: 'Erro ao verificar conquistas' });
  }
});


router.get('/', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const { achievementsWithProgress } = await checkAndUnlock(req.userId, supabase);

    const totalUnlocked    = achievementsWithProgress.filter(a => a.unlocked).length;
    const totalAchievements = ACHIEVEMENTS.length;

    res.json({
      achievements: achievementsWithProgress,
      stats: {
        unlocked:   totalUnlocked,
        total:      totalAchievements,
        percentage: Math.round((totalUnlocked / totalAchievements) * 100),
      },
    });
  } catch (err) {
    console.error('[GET /achievements]', err);
    res.status(500).json({ error: 'Erro ao buscar conquistas' });
  }
});


router.get('/leaderboard', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const { data: allUnlocked, error } = await supabase
      .from('user_achievements')
      .select('user_id, achievement_slug');

    if (error) throw error;

    const slugToTier = {};
    ACHIEVEMENTS.forEach(a => { slugToTier[a.slug] = a.tier; });

    const userMap = {};
    (allUnlocked || []).forEach(({ user_id, achievement_slug }) => {
      if (!userMap[user_id]) {
        userMap[user_id] = { total: 0, bronze: 0, prata: 0, ouro: 0, platina: 0 };
      }
      const tier = slugToTier[achievement_slug];
      if (tier) {
        userMap[user_id][tier]++;
        userMap[user_id].total++;
      }
    });

    const userIds = Object.keys(userMap);
    if (userIds.length === 0) return res.json({ leaderboard: [], me: null });

    // Pull is_public so we can hide private profiles. The requester always
    // sees their own row (whether they're public or not). For everyone else
    // who opted out via is_public=false, we anonymize the row so they still
    // count toward the totals but their identity isn't leaked.
    const { data: users } = await supabase
      .from('users')
      .select('id, name:display_name, avatar_url, is_public')
      .in('id', userIds);

    const leaderboard = (users || [])
      .map(u => {
        const isSelf = String(u.id) === String(req.userId);
        const visible = u.is_public || isSelf;
        return {
          id:         visible ? u.id : null,
          name:       visible ? u.name : 'Usuário privado',
          avatar_url: visible ? u.avatar_url : null,
          is_private: !visible,
          ...userMap[u.id],
        };
      })
      .sort((a, b) => b.total - a.total || b.platina - a.platina || b.ouro - a.ouro || b.prata - a.prata)
      .slice(0, 50);

    const meIndex = leaderboard.findIndex(u => String(u.id) === String(req.userId));

    res.json({ leaderboard, mePosition: meIndex === -1 ? null : meIndex + 1 });
  } catch (err) {
    console.error('[GET /achievements/leaderboard]', err);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

export default router;
