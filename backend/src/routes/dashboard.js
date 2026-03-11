import { Router } from 'express';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { userId } = req;

    const results = await Promise.all([
      supabase.from('finances').select('type, amount').eq('user_id', userId),
      supabase.from('finances').select('*').eq('user_id', userId).order('transaction_date', { ascending: false }).order('id', { ascending: false }).limit(5),
      supabase.from('tasks').select('id, completed').eq('user_id', userId),
      supabase.from('tasks').select('*').eq('user_id', userId).order('id', { ascending: false }).limit(6),
      supabase.from('goals').select('id, completed').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId).order('id', { ascending: false }).limit(5),
      supabase.from('routines').select('*, routine_tasks(*)').eq('user_id', userId).order('id', { ascending: false }),
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

    const income = (financeData || []).filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);
    const expense = (financeData || []).filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0);

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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

export default router;
