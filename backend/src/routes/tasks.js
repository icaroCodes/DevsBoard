import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('tasks').select('*');

    if (req.teamId) {
      query = query.eq('team_id', req.teamId);
    } else {
      query = query.eq('user_id', req.userId).is('team_id', null);
    }

    const { data, error } = await query
      .order('id', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar tarefas' });
  }
});

router.post('/', [
  body('title').trim().notEmpty().withMessage('Título é obrigatório'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'none']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, priority = 'medium' } = req.body;
    const insertData = {
      user_id: req.userId,
      title,
      description: description || null,
      priority
    };

    if (req.teamId) {
      insertData.team_id = req.teamId;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'none']),
  body('completed').optional().isBoolean(),
], async (req, res) => {
  try {
    const { userId, teamId } = req;
    let query = supabase.from('tasks').select('id').eq('id', req.params.id);
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.eq('user_id', userId).is('team_id', null);
    }
    const { data: existing } = await query.single();
    if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const updates = {};
    ['title', 'description', 'priority', 'completed'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { userId, teamId } = req;
    let query = supabase.from('tasks').select('id').eq('id', req.params.id);
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.eq('user_id', userId).is('team_id', null);
    }
    const { data: existing } = await query.single();
    if (!existing) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
});

export default router;
