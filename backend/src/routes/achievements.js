import { Router } from 'express';
import { checkAndUnlock, ACHIEVEMENTS } from '../utils/checkAchievements.js';

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

export default router;
