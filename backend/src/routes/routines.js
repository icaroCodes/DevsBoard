import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*, routine_tasks(*)')
      .eq('user_id', req.userId)
      .order('position', { ascending: true })
      .order('id', { ascending: false });
    if (error) throw error;
    res.json(data.map(r => ({ 
      ...r, 
      tasks: (r.routine_tasks || []).sort((a, b) => {
        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
        if (a.start_time) return -1;
        if (b.start_time) return 1;
        return a.position - b.position || a.id - b.id;
      }) 
    })));
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
    const { data, error } = await supabase
      .from('routines').insert({ user_id: req.userId, name, visual_type }).select().single();
    if (error) throw error;
    res.status(201).json({ ...data, tasks: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar rotina' });
  }
});

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('visual_type').optional().isIn(['daily', 'weekly', 'monthly']),
], async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('routines').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!existing) return res.status(404).json({ error: 'Rotina não encontrada' });

    const updates = {};
    ['name', 'visual_type'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase.from('routines').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar rotina' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('routines').delete().eq('id', req.params.id).eq('user_id', req.userId).select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Rotina não encontrada' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir rotina' });
  }
});

router.post('/:id/tasks', [
  body('title').trim().notEmpty().withMessage('Título é obrigatório'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('start_time').optional().matches(/^([01]\d|2[0-3]):?([0-5]\d)$/).withMessage('Horário inválido'),
  body('day_of_week').optional().isInt({ min: 0, max: 6 }).withMessage('Dia inválido'),
], async (req, res) => {
  try {
    const { data: routine } = await supabase
      .from('routines').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!routine) return res.status(404).json({ error: 'Rotina não encontrada' });

    const { title, description, priority = 'medium', start_time, day_of_week } = req.body;
    const { data, error } = await supabase
      .from('routine_tasks')
      .insert({ 
        routine_id: req.params.id, 
        title, 
        description: description || null, 
        priority,
        start_time: start_time || null,
        day_of_week: day_of_week !== undefined ? day_of_week : null
      })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
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
    const { data: routine } = await supabase
      .from('routines').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!routine) return res.status(404).json({ error: 'Rotina não encontrada' });

    const updates = {};
    ['title', 'description', 'priority', 'completed', 'start_time', 'day_of_week'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase
      .from('routine_tasks').update(updates).eq('id', req.params.taskId).eq('routine_id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

router.post('/reorder', async (req, res) => {
  try {
    const { items } = req.body; // [{id, position}]
    for (const item of items) {
      await supabase.from('routines').update({ position: item.position }).eq('id', item.id).eq('user_id', req.userId);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reordenar rotinas' });
  }
});

router.post('/:id/tasks/reorder', async (req, res) => {
  try {
    const { items } = req.body; // [{id, position}]
    const { data: routine } = await supabase.from('routines').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!routine) return res.status(404).json({ error: 'Rotina não encontrada' });

    for (const item of items) {
      await supabase.from('routine_tasks').update({ position: item.position }).eq('id', item.id).eq('routine_id', req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reordenar tarefas' });
  }
});

router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const { data: routine } = await supabase
      .from('routines').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!routine) return res.status(404).json({ error: 'Rotina não encontrada' });

    const { error } = await supabase
      .from('routine_tasks').delete().eq('id', req.params.taskId).eq('routine_id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
});

export default router;
