import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [routines] = await pool.query('SELECT * FROM routines WHERE user_id = ? ORDER BY id DESC', [req.userId]);

    for (const r of routines) {
      const [tasks] = await pool.query('SELECT * FROM routine_tasks WHERE routine_id = ? ORDER BY id', [r.id]);
      r.tasks = tasks;
    }

    res.json(routines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar rotinas' });
  }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('visual_type').isIn(['daily', 'weekly', 'monthly']).withMessage('Tipo inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, visual_type } = req.body;
    const [result] = await pool.query(
      'INSERT INTO routines (user_id, name, visual_type) VALUES (?, ?, ?)',
      [req.userId, name, visual_type]
    );
    res.status(201).json({ id: result.insertId, name, visual_type, tasks: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar rotina' });
  }
});

router.post('/:id/tasks', [
  body('title').trim().notEmpty().withMessage('Título é obrigatório'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], async (req, res) => {
  try {
    const [routines] = await pool.query('SELECT id FROM routines WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (routines.length === 0) return res.status(404).json({ error: 'Rotina não encontrada' });

    const { title, description, priority = 'medium' } = req.body;
    const [result] = await pool.query(
      'INSERT INTO routine_tasks (routine_id, title, description, priority) VALUES (?, ?, ?, ?)',
      [req.params.id, title, description || null, priority]
    );
    res.status(201).json({ id: result.insertId, title, description, priority, completed: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

router.put('/:id/tasks/:taskId', [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('completed').optional().isBoolean(),
], async (req, res) => {
  try {
    const [routines] = await pool.query('SELECT id FROM routines WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (routines.length === 0) return res.status(404).json({ error: 'Rotina não encontrada' });

    const updates = [];
    const values = [];
    ['title', 'description', 'priority', 'completed'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });
    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    await pool.query(`UPDATE routine_tasks SET ${updates.join(', ')} WHERE id = ? AND routine_id = ?`, [...values, req.params.taskId, req.params.id]);
    const [updated] = await pool.query('SELECT * FROM routine_tasks WHERE id = ?', [req.params.taskId]);
    res.json(updated[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const [routines] = await pool.query('SELECT id FROM routines WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (routines.length === 0) return res.status(404).json({ error: 'Rotina não encontrada' });

    await pool.query('DELETE FROM routine_tasks WHERE id = ? AND routine_id = ?', [req.params.taskId, req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
});

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('visual_type').optional().isIn(['daily', 'weekly', 'monthly']),
], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id FROM routines WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Rotina não encontrada' });

    const updates = [];
    const values = [];
    ['name', 'visual_type'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });
    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    values.push(req.params.id);
    await pool.query(`UPDATE routines SET ${updates.join(', ')} WHERE id = ?`, values);
    const [updated] = await pool.query('SELECT * FROM routines WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar rotina' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM routines WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Rotina não encontrada' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir rotina' });
  }
});

export default router;
