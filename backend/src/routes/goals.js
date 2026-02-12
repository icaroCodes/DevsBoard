import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM goals WHERE user_id = ? ORDER BY id DESC', [req.userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar metas' });
  }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('type').isIn(['performance', 'financial']).withMessage('Tipo inválido'),
  body('deadline_type').optional().isIn(['monthly', 'yearly', 'indefinite']),
  body('deadline_date').optional().isDate(),
  body('target_value').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, type, deadline_type = 'indefinite', deadline_date, target_value } = req.body;
    const [result] = await pool.query(
      'INSERT INTO goals (user_id, name, type, deadline_type, deadline_date, target_value) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, name, type, deadline_type, deadline_date || null, target_value || 0]
    );
    res.status(201).json({
      id: result.insertId,
      name,
      type,
      deadline_type,
      deadline_date,
      target_value: target_value || 0,
      saved_amount: 0,
      completed: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
});

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('deadline_type').optional().isIn(['monthly', 'yearly', 'indefinite']),
  body('deadline_date').optional().isDate(),
  body('target_value').optional().isFloat({ min: 0 }),
  body('completed').optional().isBoolean(),
  body('add_amount').optional().isFloat({ min: 0 }),
  body('remove_amount').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Meta não encontrada' });

    const goal = rows[0];

    if (req.body.add_amount !== undefined && goal.type === 'financial') {
      const newAmount = Number(goal.saved_amount) + Number(req.body.add_amount);
      await pool.query('UPDATE goals SET saved_amount = ? WHERE id = ?', [newAmount, req.params.id]);
    }

    if (req.body.remove_amount !== undefined && goal.type === 'financial') {
      const current = Number(goal.saved_amount);
      const remove = Math.min(Number(req.body.remove_amount), current);
      const newAmount = current - remove;
      await pool.query('UPDATE goals SET saved_amount = ? WHERE id = ?', [newAmount, req.params.id]);
    }

    const updates = [];
    const values = [];
    ['name', 'deadline_type', 'deadline_date', 'target_value', 'completed'].forEach(field => {
      if (req.body[field] !== undefined && field !== 'add_amount' && field !== 'remove_amount') {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });
    if (updates.length > 0) {
      values.push(req.params.id);
      await pool.query(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await pool.query('SELECT * FROM goals WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Meta não encontrada' });

    const goal = rows[0];
    if (goal.type === 'financial' && Number(goal.saved_amount) > 0) {
      return res.status(400).json({ error: 'Deposite os valores guardados antes de excluir a meta' });
    }

    await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir meta' });
  }
});

export default router;
