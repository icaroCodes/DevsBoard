import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects WHERE user_id = ? ORDER BY id DESC', [req.userId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('concept').optional().trim(),
  body('objective').optional().trim(),
  body('problem').optional().trim(),
  body('target_audience').optional().trim(),
  body('initial_scope').optional().trim(),
  body('functional_requirements').optional().trim(),
  body('interface_requirements').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const fields = ['name', 'concept', 'objective', 'problem', 'target_audience', 'initial_scope', 'functional_requirements', 'interface_requirements'];
    const values = [req.userId, ...fields.map(f => req.body[f] || null)];

    const [result] = await pool.query(
      `INSERT INTO projects (user_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})`,
      values
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('concept').optional().trim(),
  body('objective').optional().trim(),
  body('problem').optional().trim(),
  body('target_audience').optional().trim(),
  body('initial_scope').optional().trim(),
  body('functional_requirements').optional().trim(),
  body('interface_requirements').optional().trim(),
], async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Projeto não encontrado' });

    const fields = ['name', 'concept', 'objective', 'problem', 'target_audience', 'initial_scope', 'functional_requirements', 'interface_requirements'];
    const updates = [];
    const values = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });
    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    values.push(req.params.id);
    await pool.query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
    const [updated] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir projeto' });
  }
});

export default router;
