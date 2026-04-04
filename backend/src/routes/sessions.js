import { Router } from 'express';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// POST /sessions/heartbeat - Atualiza sessão ativa com tempo real de uso
router.post('/heartbeat', async (req, res) => {
  try {
    const { userId } = req;
    const { session_id, active_seconds } = req.body;

    if (!session_id || typeof active_seconds !== 'number' || active_seconds < 0) {
      return res.status(400).json({ error: 'session_id e active_seconds são obrigatórios' });
    }

    // Upsert sessão atual - atualiza o tempo ativo
    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        id: session_id,
        user_id: userId,
        active_seconds: Math.floor(active_seconds),
        last_heartbeat: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Heartbeat error:', error);
      return res.status(500).json({ error: 'Erro ao registrar heartbeat' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /sessions/start - Inicia nova sessão ou recupera existente
router.post('/start', async (req, res) => {
  try {
    const { userId } = req;
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id é obrigatório' });
    }

    // Verificar se sessão já existe (reload de página)
    const { data: existing } = await supabase
      .from('user_sessions')
      .select('active_seconds')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.json({ ok: true, active_seconds: existing.active_seconds });
    }

    const { error } = await supabase
      .from('user_sessions')
      .insert({
        id: session_id,
        user_id: userId,
        active_seconds: 0,
        started_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
      });

    if (error) {
      if (error.code === '23505') {
        // Race condition - buscar o valor existente
        const { data: race } = await supabase
          .from('user_sessions')
          .select('active_seconds')
          .eq('id', session_id)
          .single();
        return res.json({ ok: true, active_seconds: race?.active_seconds || 0 });
      }
      console.error('Session start error:', error);
      return res.status(500).json({ error: 'Erro ao iniciar sessão' });
    }

    res.json({ ok: true, active_seconds: 0 });
  } catch (err) {
    console.error('Session start error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /sessions/stats - Retorna estatísticas de tempo do usuário
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req;

    // Buscar total de segundos ativos em todas as sessões
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('active_seconds')
      .eq('user_id', userId);

    if (error) {
      console.error('Stats error:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }

    const totalSeconds = (sessions || []).reduce((sum, s) => sum + (s.active_seconds || 0), 0);

    // Buscar sessão com maior duração (para conquistas de sessão única)
    const { data: longestSession, error: longestErr } = await supabase
      .from('user_sessions')
      .select('active_seconds')
      .eq('user_id', userId)
      .order('active_seconds', { ascending: false })
      .limit(1)
      .single();

    const longestSessionSeconds = longestSession?.active_seconds || 0;

    // Buscar data de criação da conta
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    const createdAt = userData?.created_at || null;
    const accountAgeDays = createdAt
      ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      total_seconds: totalSeconds,
      total_hours: Math.floor(totalSeconds / 3600),
      total_minutes: Math.floor((totalSeconds % 3600) / 60),
      longest_session_seconds: longestSessionSeconds,
      account_created_at: createdAt,
      account_age_days: accountAgeDays,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
