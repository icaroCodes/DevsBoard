import { Router } from 'express';
import { checkAndUnlock, ACHIEVEMENTS } from '../utils/checkAchievements.js';
import supabase from '../database/connection.js';

const router = Router();

// POST /achievements/check — chamado pelo frontend após mutações (fire-and-forget)
// Retorna apenas as conquistas recém-desbloqueadas nesta chamada
router.post('/check', async (req, res) => {
  try {
    const { newlyUnlocked } = await checkAndUnlock(req.userId);
    res.json({ newly_unlocked: newlyUnlocked });
  } catch (err) {
    console.error('[POST /achievements/check]', err);
    res.status(500).json({ error: 'Erro ao verificar conquistas' });
  }
});

// GET /achievements — lista completa com progresso (página de conquistas)
router.get('/', async (req, res) => {
  try {
    const { achievementsWithProgress } = await checkAndUnlock(req.userId);

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

// GET /achievements/leaderboard — top global de usuários com mais conquistas
router.get('/leaderboard', async (req, res) => {
  try {
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

    const { data: users } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', userIds);

    const leaderboard = (users || [])
      .map(u => ({
        id:         u.id,
        name:       u.name,
        avatar_url: u.avatar_url,
        ...userMap[u.id],
      }))
      .sort((a, b) => b.total - a.total || b.platina - a.platina || b.ouro - a.ouro || b.prata - a.prata)
      .slice(0, 50);

    // posição do usuário autenticado
    const meIndex = leaderboard.findIndex(u => u.id === req.userId);

    res.json({ leaderboard, mePosition: meIndex === -1 ? null : meIndex + 1 });
  } catch (err) {
    console.error('[GET /achievements/leaderboard]', err);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

export default router;
