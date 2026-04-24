import { Router } from 'express';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { userId, teamId } = req;

    const baseQuery = (table) => {
      let q = supabase.from(table).select('*');
      if (teamId) {
        return q.eq('team_id', teamId);
      } else {
        return q.eq('user_id', userId).is('team_id', null);
      }
    };

    const results = await Promise.all([
      baseQuery('finances').select('type, amount'),
      baseQuery('finances').order('transaction_date', { ascending: false }).order('id', { ascending: false }).limit(5),
      baseQuery('tasks').select('id, completed'),
      baseQuery('tasks').order('id', { ascending: false }).limit(6),
      baseQuery('goals').select('id, completed'),
      baseQuery('goals').order('id', { ascending: false }).limit(5),
      baseQuery('routines').select('*, routine_tasks(*)').order('id', { ascending: false }),
      supabase.from('users').select('current_streak, longest_streak, last_access_date').eq('id', userId).single(),
    ]);

    results.forEach((res, i) => {
      if (res.error) console.error(`Dashboard Supabase error [${i}]:`, res.error);
    });

    const financeData = results[0].data || [];
    const transactions = results[1].data || [];
    const tasksAll = results[2].data || [];
    const tasks = results[3].data || [];
    const goalsAll = results[4].data || [];
    const goals = results[5].data || [];
    const routinesRaw = results[6].data || [];
    const routines = routinesRaw.map(({ routine_tasks, ...r }) => ({
      ...r,
      tasks: routine_tasks || [],
    }));
    const streak = results[7]?.data || {};

    const income = (financeData || []).filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);
    const expense = (financeData || []).filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0);

    
    const routineTasksAll = routines.flatMap(r => r.tasks || []);
    const routineTasksDone = routineTasksAll.filter(t => t.completed).length;

    res.json({
      finance: {
        balance: income - expense,
        income,
        expense,
        recentTransactions: transactions || [],
      },
      tasks: {
        total: tasksAll?.length || 0,
        completed: tasksAll?.filter(t => t.completed).length || 0,
        items: tasks || [],
      },
      goals: {
        total: goalsAll?.length || 0,
        completed: goalsAll?.filter(g => g.completed).length || 0,
        items: goals || [],
      },
      routines: routines || [],
      routineSummary: {
        total: routineTasksAll.length,
        completed: routineTasksDone,
      },
      streak: {
        current: streak.current_streak || 0,
        longest: streak.longest_streak || 0,
        last_access_date: streak.last_access_date || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

export default router;
