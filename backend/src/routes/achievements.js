import { Router } from 'express';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Definição de todas as conquistas disponíveis
const ACHIEVEMENTS = [
  // Tarefas - Progressão: iniciante → dominante
  { id: 1, slug: 'first_task', name: 'Primeiro Passo', description: 'Complete sua primeira tarefa e comece sua jornada', icon: '🎯', category: 'tasks', threshold: 1, tier: 'iniciante' },
  { id: 2, slug: 'task_10', name: 'Motor Ligado', description: 'Complete 10 tarefas — o ritmo está começando', icon: '⚡', category: 'tasks', threshold: 10, tier: 'consistente' },
  { id: 3, slug: 'task_50', name: 'Força Imparável', description: 'Complete 50 tarefas — ninguém te segura', icon: '🔥', category: 'tasks', threshold: 50, tier: 'avançado' },
  { id: 4, slug: 'task_100', name: 'Centurião Digital', description: '100 tarefas finalizadas — você é uma máquina', icon: '💎', category: 'tasks', threshold: 100, tier: 'avançado' },
  { id: 5, slug: 'task_500', name: 'Lenda Viva', description: '500 tarefas — poucos chegam aqui', icon: '👑', category: 'tasks', threshold: 500, tier: 'dominante' },

  // Metas
  { id: 6, slug: 'first_goal', name: 'Olhar Visionário', description: 'Crie sua primeira meta e mire no futuro', icon: '🌟', category: 'goals', threshold: 1, tier: 'iniciante' },
  { id: 7, slug: 'goal_complete', name: 'Promessa Cumprida', description: 'Complete sua primeira meta — palavra dada, palavra cumprida', icon: '🏆', category: 'goals', threshold: 1, tier: 'consistente' },
  { id: 8, slug: 'goal_5', name: 'Caçador de Objetivos', description: 'Complete 5 metas — sua ambição não tem limite', icon: '🚀', category: 'goals', threshold: 5, tier: 'avançado' },

  // Finanças
  { id: 9, slug: 'first_income', name: 'Primeira Moeda', description: 'Registre sua primeira receita na plataforma', icon: '💰', category: 'finances', threshold: 1, tier: 'iniciante' },
  { id: 10, slug: 'saver_1k', name: 'Cofre Crescendo', description: 'Acumule R$ 1.000 em receitas registradas', icon: '🏦', category: 'finances', threshold: 1000, tier: 'consistente' },
  { id: 11, slug: 'saver_10k', name: 'Investidor de Elite', description: 'Acumule R$ 10.000 — seu patrimônio impressiona', icon: '📈', category: 'finances', threshold: 10000, tier: 'avançado' },

  // Rotinas
  { id: 12, slug: 'first_routine', name: 'Hábito Nascente', description: 'Crie sua primeira rotina — disciplina é poder', icon: '🔄', category: 'routines', threshold: 1, tier: 'iniciante' },
  { id: 13, slug: 'routine_tasks_10', name: 'Relojoeiro', description: 'Adicione 10 tarefas em rotinas — precisão como um relógio', icon: '📋', category: 'routines', threshold: 10, tier: 'consistente' },

  // Projetos
  { id: 14, slug: 'first_project', name: 'Criador', description: 'Crie seu primeiro projeto e dê vida a uma ideia', icon: '📂', category: 'projects', threshold: 1, tier: 'iniciante' },
  { id: 15, slug: 'project_5', name: 'Portfólio Sólido', description: 'Tenha 5 projetos — seu portfólio fala por si', icon: '💼', category: 'projects', threshold: 5, tier: 'consistente' },

  // Times
  { id: 16, slug: 'first_team', name: 'Espírito de Equipe', description: 'Crie ou participe de um time', icon: '👥', category: 'teams', threshold: 1, tier: 'iniciante' },

  // Especiais
  { id: 17, slug: 'streak_7', name: 'Chama Acesa', description: 'Use a plataforma por 7 dias seguidos', icon: '📅', category: 'special', threshold: 7, tier: 'consistente' },
  { id: 18, slug: 'all_modules', name: 'Explorador Completo', description: 'Utilize todos os módulos do sistema', icon: '🗺️', category: 'special', threshold: 1, tier: 'avançado' },

  // Tempo de Sessão (sessão contínua)
  { id: 19, slug: 'session_1h', name: 'Focado', description: 'Permaneça ativo por 1 hora em uma única sessão', icon: '⏱️', category: 'tempo', threshold: 3600, tier: 'consistente' },
  { id: 20, slug: 'session_3h', name: 'Maratonista Digital', description: '3 horas seguidas — sua concentração é lendária', icon: '🧠', category: 'tempo', threshold: 10800, tier: 'avançado' },

  // Tempo Total Acumulado
  { id: 21, slug: 'total_10h', name: 'Dedicação Inicial', description: 'Acumule 10 horas totais na plataforma', icon: '⌛', category: 'tempo', threshold: 36000, tier: 'consistente' },
  { id: 22, slug: 'total_50h', name: 'Veterano', description: '50 horas investidas — você conhece cada canto daqui', icon: '🏅', category: 'tempo', threshold: 180000, tier: 'avançado' },
  { id: 23, slug: 'total_100h', name: 'Mestre do Tempo', description: '100 horas — o tempo é seu maior aliado', icon: '💫', category: 'tempo', threshold: 360000, tier: 'dominante' },

  // Longevidade da Conta
  { id: 24, slug: 'account_7d', name: 'Novato Comprometido', description: 'Sua conta completou 7 dias — bem-vindo a bordo!', icon: '🌱', category: 'longevidade', threshold: 7, tier: 'iniciante' },
  { id: 25, slug: 'account_30d', name: 'Residente', description: '30 dias de conta — você já faz parte da história', icon: '🏠', category: 'longevidade', threshold: 30, tier: 'consistente' },
  { id: 26, slug: 'account_90d', name: 'Pilar da Comunidade', description: '90 dias — sua presença fortalece a plataforma', icon: '🏛️', category: 'longevidade', threshold: 90, tier: 'avançado' },
];

// GET /achievements - Lista conquistas do usuário com progresso
router.get('/', async (req, res) => {
  try {
    const { userId } = req;

    // Buscar conquistas desbloqueadas
    const { data: unlocked, error: unlockError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (unlockError) console.error('Error fetching achievements:', unlockError);

    const unlockedMap = {};
    (unlocked || []).forEach(a => {
      unlockedMap[a.achievement_slug] = a;
    });

    // Buscar dados para progresso
    const [tasksRes, goalsRes, goalsCompletedRes, financesRes, routinesRes, routineTasksRes, projectsRes, teamsRes, sessionsRes, userRes] = await Promise.all([
      supabase.from('tasks').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true),
      supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true),
      supabase.from('finances').select('type, amount').eq('user_id', userId),
      supabase.from('routines').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('routine_tasks').select('id, routine_id').eq('completed', false),
      supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('team_members').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('user_sessions').select('active_seconds').eq('user_id', userId),
      supabase.from('users').select('created_at').eq('id', userId).single(),
    ]);

    const completedTasks = tasksRes.count || 0;
    const totalGoals = goalsRes.count || 0;
    const completedGoals = goalsCompletedRes.count || 0;
    const totalIncome = (financesRes.data || []).filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);
    const firstIncome = (financesRes.data || []).some(f => f.type === 'income');
    const totalRoutines = routinesRes.count || 0;
    const totalRoutineTasks = routineTasksRes.count || 0;
    const totalProjects = projectsRes.count || 0;
    const totalTeams = teamsRes.count || 0;

    // Dados de tempo
    const allSessions = sessionsRes.data || [];
    const totalSeconds = allSessions.reduce((sum, s) => sum + (s.active_seconds || 0), 0);
    const longestSessionSeconds = allSessions.length > 0
      ? Math.max(...allSessions.map(s => s.active_seconds || 0))
      : 0;

    // Dias de conta
    const createdAt = userRes.data?.created_at;
    const accountAgeDays = createdAt
      ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calcular progresso de cada conquista
    const achievementsWithProgress = ACHIEVEMENTS.map(a => {
      let current = 0;

      switch (a.slug) {
        case 'first_task': current = Math.min(completedTasks, 1); break;
        case 'task_10': current = Math.min(completedTasks, 10); break;
        case 'task_50': current = Math.min(completedTasks, 50); break;
        case 'task_100': current = Math.min(completedTasks, 100); break;
        case 'task_500': current = Math.min(completedTasks, 500); break;
        case 'first_goal': current = Math.min(totalGoals, 1); break;
        case 'goal_complete': current = Math.min(completedGoals, 1); break;
        case 'goal_5': current = Math.min(completedGoals, 5); break;
        case 'first_income': current = firstIncome ? 1 : 0; break;
        case 'saver_1k': current = Math.min(totalIncome, 1000); break;
        case 'saver_10k': current = Math.min(totalIncome, 10000); break;
        case 'first_routine': current = Math.min(totalRoutines, 1); break;
        case 'routine_tasks_10': current = Math.min(totalRoutineTasks, 10); break;
        case 'first_project': current = Math.min(totalProjects, 1); break;
        case 'project_5': current = Math.min(totalProjects, 5); break;
        case 'first_team': current = Math.min(totalTeams, 1); break;
        // Tempo de sessão (em segundos)
        case 'session_1h': current = Math.min(longestSessionSeconds, 3600); break;
        case 'session_3h': current = Math.min(longestSessionSeconds, 10800); break;
        // Tempo total (em segundos)
        case 'total_10h': current = Math.min(totalSeconds, 36000); break;
        case 'total_50h': current = Math.min(totalSeconds, 180000); break;
        case 'total_100h': current = Math.min(totalSeconds, 360000); break;
        // Longevidade (em dias)
        case 'account_7d': current = Math.min(accountAgeDays, 7); break;
        case 'account_30d': current = Math.min(accountAgeDays, 30); break;
        case 'account_90d': current = Math.min(accountAgeDays, 90); break;
        default: current = 0;
      }

      const isUnlocked = unlockedMap[a.slug] !== undefined || current >= a.threshold;
      const progress = Math.min(100, (current / a.threshold) * 100);

      return {
        ...a,
        current,
        progress: Math.round(progress),
        unlocked: isUnlocked,
        unlocked_at: unlockedMap[a.slug]?.unlocked_at || null,
      };
    });

    // Auto-desbloquear conquistas que atingiram o threshold mas não foram salvas
    const toUnlock = achievementsWithProgress.filter(a => a.unlocked && !unlockedMap[a.slug]);
    if (toUnlock.length > 0) {
      try {
        const inserts = toUnlock.map(a => ({
          user_id: userId,
          achievement_id: a.id,
          achievement_slug: a.slug,
          achievement_name: a.name,
          unlocked_at: new Date().toISOString(),
          progress: 100
        }));
        const { error: upsertError } = await supabase
          .from('user_achievements')
          .upsert(inserts, { onConflict: 'user_id,achievement_id' });
        if (upsertError) console.error('Upsert achievements error:', upsertError);
      } catch (e) {
        console.error('Failed to auto-unlock achievements:', e);
      }
    }

    const totalUnlocked = achievementsWithProgress.filter(a => a.unlocked).length;
    const totalAchievements = ACHIEVEMENTS.length;

    res.json({
      achievements: achievementsWithProgress,
      stats: {
        unlocked: totalUnlocked,
        total: totalAchievements,
        percentage: Math.round((totalUnlocked / totalAchievements) * 100),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar conquistas' });
  }
});

export default router;
