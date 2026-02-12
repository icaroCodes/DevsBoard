import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const categories = ['Salário', 'Freelance', 'Investimentos', 'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros'];

router.get('/', async (req, res) => {
  try {
    const { userId } = req;
    const { type } = req.query;

    let sql = 'SELECT * FROM finances WHERE user_id = ?';
    const params = [userId];

    if (type && ['income', 'expense'].includes(type)) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY transaction_date DESC, id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar finanças' });
  }
});

router.post('/', [
  body('category').trim().notEmpty().withMessage('Categoria é obrigatória'),
  body('description').optional().trim(),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valor inválido'),
  body('type').isIn(['income', 'expense']).withMessage('Tipo inválido'),
  body('transaction_date').isDate().withMessage('Data inválida'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { category, description, amount, type, transaction_date } = req.body;
    const [result] = await pool.query(
      'INSERT INTO finances (user_id, category, description, amount, type, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, category, description || null, amount, type, transaction_date]
    );
    res.status(201).json({ id: result.insertId, category, description, amount, type, transaction_date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

router.put('/:id', [
  body('category').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('type').optional().isIn(['income', 'expense']),
  body('transaction_date').optional().isDate(),
], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id FROM finances WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Transação não encontrada' });

    const updates = [];
    const values = [];

    ['category', 'description', 'amount', 'type', 'transaction_date'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    values.push(req.params.id);
    await pool.query(`UPDATE finances SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM finances WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM finances WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Transação não encontrada' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

export { categories };
export default router;
