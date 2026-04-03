import { Router } from 'express';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Definição de todas as conquistas disponíveis
const ACHIEVEMENTS = [
  // Tarefas
  { id: 1, slug: 'first_task', name: 'Primeiro Passo', description: 'Complete sua primeira tarefa', icon: '🎯', category: 'tasks', threshold: 1 },
  { id: 2, slug: 'task_10', name: 'Produtivo', description: 'Complete 10 tarefas', icon: '⚡', category: 'tasks', threshold: 10 },
  { id: 3, slug: 'task_50', name: 'Imparável', description: 'Complete 50 tarefas', icon: '🔥', category: 'tasks', threshold: 50 },
  { id: 4, slug: 'task_100', name: 'Centurião', description: 'Complete 100 tarefas', icon: '💎', category: 'tasks', threshold: 100 },
  { id: 5, slug: 'task_500', name: 'Lendário', description: 'Complete 500 tarefas', icon: '👑', category: 'tasks', threshold: 500 },
  
  // Metas
  { id: 6, slug: 'first_goal', name: 'Visionário', description: 'Crie sua primeira meta', icon: '🌟', category: 'goals', threshold: 1 },
  { id: 7, slug: 'goal_complete', name: 'Conquistador', description: 'Complete sua primeira meta', icon: '🏆', category: 'goals', threshold: 1 },
  { id: 8, slug: 'goal_5', name: 'Ambicioso', description: 'Complete 5 metas', icon: '🚀', category: 'goals', threshold: 5 },
  
  // Finanças
  { id: 9, slug: 'first_income', name: 'Primeiro Salário', description: 'Registre sua primeira receita', icon: '💰', category: 'finances', threshold: 1 },
  { id: 10, slug: 'saver_1k', name: 'Poupador', description: 'Acumule R$ 1.000 em receitas', icon: '🏦', category: 'finances', threshold: 1000 },
  { id: 11, slug: 'saver_10k', name: 'Investidor', description: 'Acumule R$ 10.000 em receitas', icon: '📈', category: 'finances', threshold: 10000 },
  
  // Rotinas
  { id: 12, slug: 'first_routine', name: 'Disciplinado', description: 'Crie sua primeira rotina', icon: '🔄', category: 'routines', threshold: 1 },
  { id: 13, slug: 'routine_tasks_10', name: 'Metódico', description: 'Adicione 10 tarefas em rotinas', icon: '📋', category: 'routines', threshold: 10 },
  
  // Projetos
  { id: 14, slug: 'first_project', name: 'Empreendedor', description: 'Crie seu primeiro projeto', icon: '📂', category: 'projects', threshold: 1 },
  { id: 15, slug: 'project_5', name: 'Portfólio', description: 'Tenha 5 projetos cadastrados', icon: '💼', category: 'projects', threshold: 5 },
  
  // Times
  { id: 16, slug: 'first_team', name: 'Líder', description: 'Crie ou participe de um time', icon: '👥', category: 'teams', threshold: 1 },
  
  // Especiais
  { id: 17, slug: 'streak_7', name: 'Consistente', description: 'Use o app por 7 dias seguidos', icon: '📅', category: 'special', threshold: 7 },
  { id: 18, slug: 'all_modules', name: 'Explorador', description: 'Use todos os módulos do sistema', icon: '🗺️', category: 'special', threshold: 1 },
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
    const [tasksRes, goalsRes, goalsCompletedRes, financesRes, routinesRes, routineTasksRes, projectsRes, teamsRes] = await Promise.all([
      supabase.from('tasks').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true),
      supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true),
      supabase.from('finances').select('type, amount').eq('user_id', userId),
      supabase.from('routines').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('routine_tasks').select('id, routine_id').eq('completed', false),
      supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('team_members').select('id', { count: 'exact' }).eq('user_id', userId),
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
          achievement_slug: a.slug,
          achievement_name: a.name,
          unlocked_at: new Date().toISOString(),
        }));
        const { error: upsertError } = await supabase
          .from('user_achievements')
          .upsert(inserts, { onConflict: 'user_id,achievement_slug' });
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
