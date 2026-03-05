import { Router } from 'express';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { userId } = req;

    const [
      { data: financeData },
      { data: transactions },
      { data: tasks },
      { data: goals },
    ] = await Promise.all([
      supabase.from('finances').select('type, amount').eq('user_id', userId),
      supabase.from('finances').select('*').eq('user_id', userId).order('transaction_date', { ascending: false }).order('id', { ascending: false }).limit(5),
      supabase.from('tasks').select('completed').eq('user_id', userId),
      supabase.from('goals').select('completed').eq('user_id', userId),
    ]);

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
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.completed).length || 0,
      },
      goals: {
        total: goals?.length || 0,
        completed: goals?.filter(g => g.completed).length || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

export default router;
