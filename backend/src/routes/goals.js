import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', req.userId).order('id', { ascending: false });
    if (error) throw error;
    res.json(data);
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
    const { data, error } = await supabase
      .from('goals')
      .insert({ user_id: req.userId, name, type, deadline_type, deadline_date: deadline_date || null, target_value: target_value || 0 })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
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
    const { data: goal } = await supabase
      .from('goals').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

    const updates = {};

    if (req.body.add_amount !== undefined && goal.type === 'financial') {
      updates.saved_amount = Number(goal.saved_amount) + Number(req.body.add_amount);
    }
    if (req.body.remove_amount !== undefined && goal.type === 'financial') {
      const remove = Math.min(Number(req.body.remove_amount), Number(goal.saved_amount));
      updates.saved_amount = Number(goal.saved_amount) - remove;
    }

    ['name', 'deadline_type', 'deadline_date', 'target_value', 'completed'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase.from('goals').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data: goal } = await supabase
      .from('goals').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

    if (goal.type === 'financial' && Number(goal.saved_amount) > 0) {
      return res.status(400).json({ error: 'Deposite os valores guardados antes de excluir a meta' });
    }

    const { error } = await supabase.from('goals').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir meta' });
  }
});

export default router;
