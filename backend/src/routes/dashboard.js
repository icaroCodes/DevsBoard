import { Router } from 'express';
import pool from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { userId } = req;

    const [finances] = await pool.query(
      `SELECT type, SUM(amount) as total FROM finances WHERE user_id = ? GROUP BY type`,
      [userId]
    );
    const income = finances.find(f => f.type === 'income')?.total || 0;
    const expense = finances.find(f => f.type === 'expense')?.total || 0;
    const balance = Number(income) - Number(expense);

    const [transactions] = await pool.query(
      'SELECT * FROM finances WHERE user_id = ? ORDER BY transaction_date DESC, id DESC LIMIT 5',
      [userId]
    );

    const [tasks] = await pool.query(
      'SELECT COUNT(*) as total, SUM(completed) as completed FROM tasks WHERE user_id = ?',
      [userId]
    );

    const [goals] = await pool.query(
      'SELECT COUNT(*) as total, SUM(completed) as completed FROM goals WHERE user_id = ?',
      [userId]
    );

    res.json({
      finance: {
        balance,
        income: Number(income),
        expense: Number(expense),
        recentTransactions: transactions,
      },
      tasks: tasks[0] || { total: 0, completed: 0 },
      goals: goals[0] || { total: 0, completed: 0 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

export default router;
