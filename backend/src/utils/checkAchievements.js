import supabase from '../database/connection.js';

export const ACHIEVEMENTS = [
  
  { id: 1,  slug: 'task_1',         name: 'Start Brutal',           description: 'Complete sua primeira tarefa',                  icon: '⚡', category: 'tasks',    threshold: 1,      tier: 'bronze'  },
  { id: 2,  slug: 'task_5',         name: 'Em Movimento',           description: '5 tarefas concluídas',                          icon: '🏃', category: 'tasks',    threshold: 5,      tier: 'bronze'  },
  { id: 3,  slug: 'task_20',        name: 'Ritmo Insano',           description: '20 tarefas — você entrou no fluxo',             icon: '🔥', category: 'tasks',    threshold: 20,     tier: 'prata'   },
  { id: 4,  slug: 'task_50',        name: 'Modo Máquina',           description: '50 tarefas — disciplina absurda',               icon: '🤖', category: 'tasks',    threshold: 50,     tier: 'ouro'    },
  { id: 5,  slug: 'task_150',       name: 'Predador de Resultados', description: '150 tarefas — elite absoluta',                  icon: '👑', category: 'tasks',    threshold: 150,    tier: 'ouro'    },
  
  { id: 6,  slug: 'goal_1',         name: 'Visão Ativada',          description: 'Crie sua primeira meta',                        icon: '🎯', category: 'goals',    threshold: 1,      tier: 'bronze'  },
  { id: 7,  slug: 'goal_complete_1',name: 'Sem Desculpas',          description: 'Complete 1 meta',                               icon: '🏆', category: 'goals',    threshold: 1,      tier: 'prata'   },
  { id: 8,  slug: 'goal_complete_5',name: 'Executor',               description: 'Complete 5 metas',                              icon: '🚀', category: 'goals',    threshold: 5,      tier: 'ouro'    },
  
  { id: 9,  slug: 'money_1',        name: 'Primeiro Real',          description: 'Registre uma entrada',                         icon: '💰', category: 'finances', threshold: 1,      tier: 'bronze'  },
  { id: 10, slug: 'money_1k',       name: 'Subindo de Nível',       description: 'Acumule R$1.000',                               icon: '📈', category: 'finances', threshold: 1000,   tier: 'prata'   },
  { id: 11, slug: 'money_10k',      name: 'Mentalidade Forte',      description: 'R$10.000 registrados',                          icon: '💎', category: 'finances', threshold: 10000,  tier: 'ouro'    },
  
  { id: 12, slug: 'routine_1',      name: 'Disciplina Inicial',     description: 'Crie uma rotina',                               icon: '🔁', category: 'routines', threshold: 1,      tier: 'bronze'  },
  { id: 13, slug: 'routine_7d',     name: 'Sem Falhar',             description: '7 dias de streak',                              icon: '📅', category: 'routines', threshold: 7,      tier: 'prata'   },
  { id: 14, slug: 'routine_30d',    name: 'Inquebrável',            description: '30 dias de streak',                             icon: '🧠', category: 'routines', threshold: 30,     tier: 'ouro'    },
  
  { id: 15, slug: 'project_1',      name: 'Criador',                description: 'Crie um projeto',                               icon: '📂', category: 'projects', threshold: 1,      tier: 'bronze'  },
  { id: 16, slug: 'project_3',      name: 'Construtor',             description: '3 projetos ativos',                             icon: '🏗️', category: 'projects', threshold: 3,      tier: 'prata'   },
  { id: 17, slug: 'project_10',     name: 'Império',                description: '10 projetos — você constrói sistemas',          icon: '🏛️', category: 'projects', threshold: 10,     tier: 'ouro'    },
  
  { id: 18, slug: 'session_30m',    name: 'Entrou no Jogo',         description: '30 minutos em uma sessão',                      icon: '⏱️', category: 'tempo',    threshold: 1800,   tier: 'bronze'  },
  { id: 19, slug: 'session_2h',     name: 'Imersão Total',          description: '2 horas seguidas',                              icon: '🧠', category: 'tempo',    threshold: 7200,   tier: 'prata'   },
  { id: 20, slug: 'total_20h',      name: 'Comprometido',           description: '20 horas totais',                               icon: '⌛', category: 'tempo',    threshold: 72000,  tier: 'prata'   },
  { id: 21, slug: 'total_100h',     name: 'Veterano',               description: '100 horas totais',                              icon: '🏅', category: 'tempo',    threshold: 360000, tier: 'ouro'    },
  
  { id: 22, slug: 'streak_3',       name: 'Não Parou',              description: '3 dias seguidos',                               icon: '🔥', category: 'streak',   threshold: 3,      tier: 'bronze'  },
  { id: 23, slug: 'streak_7',       name: 'Focado',                 description: '7 dias seguidos',                               icon: '⚡', category: 'streak',   threshold: 7,      tier: 'prata'   },
  { id: 24, slug: 'streak_21',      name: 'Obcecado',               description: '21 dias seguidos',                              icon: '👁️', category: 'streak',   threshold: 21,     tier: 'ouro'    },
  
  { id: 25, slug: 'night_mode',     name: 'Coruja',                 description: 'Acesse a plataforma entre 00:00 e 05:00 (Brasília)', icon: '🌙', category: 'hidden',   threshold: 1,      tier: 'prata',  hidden: true },
  { id: 26, slug: 'speed_run',      name: 'Speedrunner',            description: 'Complete 5 tarefas em menos de 10 minutos',     icon: '💨', category: 'hidden',   threshold: 5,      tier: 'ouro',   hidden: true },
  
  { id: 27, slug: 'platinum',       name: 'DEVSBOARD GOD',          description: 'Desbloqueie TODAS as conquistas',               icon: '💀', category: 'ultimate', threshold: 1,      tier: 'platina' },
];


export async function checkAndUnlock(userId) {
  
  const { data: saved } = await supabase
    .from('user_achievements')
    .select('achievement_slug, unlocked_at')
    .eq('user_id', userId);

  const savedMap = {};
  (saved || []).forEach(a => { savedMap[a.achievement_slug] = a; });

  
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const brasiliaHour = parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false
  }).format(new Date()));
  const isNightTime = brasiliaHour >= 0 && brasiliaHour < 5;

  const [
    tasksRes, goalsRes, goalsCompletedRes,
    financesRes, routinesRes, projectsRes,
    sessionsRes, userRes, recentTasksRes,
  ] = await Promise.all([
    supabase.from('tasks').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true),
    supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true),
    supabase.from('finances').select('type, amount').eq('user_id', userId),
    supabase.from('routines').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('user_sessions').select('active_seconds').eq('user_id', userId),
    supabase.from('users').select('current_streak').eq('id', userId).single(),
    supabase.from('tasks').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true).gte('updated_at', tenMinutesAgo),
  ]);

  const completedTasks   = tasksRes.count        || 0;
  const totalGoals       = goalsRes.count         || 0;
  const completedGoals   = goalsCompletedRes.count|| 0;
  const firstIncome      = (financesRes.data || []).some(f => f.type === 'income');
  const totalIncome      = (financesRes.data || []).filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);
  const totalRoutines    = routinesRes.count      || 0;
  const totalProjects    = projectsRes.count      || 0;
  const allSessions      = sessionsRes.data       || [];
  const totalSeconds     = allSessions.reduce((sum, s) => sum + (s.active_seconds || 0), 0);
  const longestSession   = allSessions.length > 0 ? Math.max(...allSessions.map(s => s.active_seconds || 0)) : 0;
  const currentStreak    = userRes.data?.current_streak || 0;
  const recentTasksCount = recentTasksRes.count   || 0;

  
  const achievementsWithProgress = ACHIEVEMENTS.map(a => {
    let current = 0;
    switch (a.slug) {
      case 'task_1':          current = Math.min(completedTasks, 1);      break;
      case 'task_5':          current = Math.min(completedTasks, 5);      break;
      case 'task_20':         current = Math.min(completedTasks, 20);     break;
      case 'task_50':         current = Math.min(completedTasks, 50);     break;
      case 'task_150':        current = Math.min(completedTasks, 150);    break;
      case 'goal_1':          current = Math.min(totalGoals, 1);          break;
      case 'goal_complete_1': current = Math.min(completedGoals, 1);      break;
      case 'goal_complete_5': current = Math.min(completedGoals, 5);      break;
      case 'money_1':         current = firstIncome ? 1 : 0;              break;
      case 'money_1k':        current = Math.min(totalIncome, 1000);      break;
      case 'money_10k':       current = Math.min(totalIncome, 10000);     break;
      case 'routine_1':       current = Math.min(totalRoutines, 1);       break;
      case 'routine_7d':      current = Math.min(currentStreak, 7);       break;
      case 'routine_30d':     current = Math.min(currentStreak, 30);      break;
      case 'project_1':       current = Math.min(totalProjects, 1);       break;
      case 'project_3':       current = Math.min(totalProjects, 3);       break;
      case 'project_10':      current = Math.min(totalProjects, 10);      break;
      case 'session_30m':     current = Math.min(longestSession, 1800);   break;
      case 'session_2h':      current = Math.min(longestSession, 7200);   break;
      case 'total_20h':       current = Math.min(totalSeconds, 72000);    break;
      case 'total_100h':      current = Math.min(totalSeconds, 360000);   break;
      case 'streak_3':        current = Math.min(currentStreak, 3);       break;
      case 'streak_7':        current = Math.min(currentStreak, 7);       break;
      case 'streak_21':       current = Math.min(currentStreak, 21);      break;
      case 'night_mode':      current = (isNightTime || savedMap['night_mode']) ? 1 : 0; break;
      case 'speed_run':       current = (recentTasksCount >= 5 || savedMap['speed_run']) ? 5 : recentTasksCount; break;
      case 'platinum':        current = 0; break;
      default:                current = 0;
    }
    const isUnlocked = savedMap[a.slug] !== undefined || current >= a.threshold;
    const progress   = Math.min(100, Math.round((current / a.threshold) * 100));
    return { ...a, current, progress, unlocked: isUnlocked, unlocked_at: savedMap[a.slug]?.unlocked_at || null };
  });

  
  const nonPlatinum      = achievementsWithProgress.filter(a => a.slug !== 'platinum');
  const allOthersUnlocked= nonPlatinum.every(a => a.unlocked);
  const platinumEntry    = achievementsWithProgress.find(a => a.slug === 'platinum');
  if (platinumEntry) {
    platinumEntry.current  = allOthersUnlocked ? 1 : 0;
    platinumEntry.unlocked = allOthersUnlocked || savedMap['platinum'] !== undefined;
    platinumEntry.progress = allOthersUnlocked
      ? 100
      : Math.round((nonPlatinum.filter(a => a.unlocked).length / nonPlatinum.length) * 100);
  }

  
  const newlyUnlocked = achievementsWithProgress.filter(a => a.unlocked && !savedMap[a.slug]);

  
  if (newlyUnlocked.length > 0) {
    const rows = newlyUnlocked.map(a => ({
      user_id:          userId,
      achievement_slug: a.slug,
      unlocked_at:      new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('user_achievements')
      .upsert(rows, { onConflict: 'user_id,achievement_slug', ignoreDuplicates: true });
    if (error) console.error('[checkAchievements] upsert error:', error.message);

    
    newlyUnlocked.forEach(a => { a.unlocked_at = new Date().toISOString(); });
  }

  return { achievementsWithProgress, newlyUnlocked };
}
