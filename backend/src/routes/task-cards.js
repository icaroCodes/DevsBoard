import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// POST create card in a list
router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('list_id').notEmpty().withMessage('list_id é obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, list_id } = req.body;

    // Verify list ownership
    const { data: list } = await supabase
      .from('task_lists')
      .select('id')
      .eq('id', list_id)
      .eq('user_id', req.userId)
      .single();

    if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

    // Determine next position within list
    const { data: existing } = await supabase
      .from('task_cards')
      .select('position')
      .eq('list_id', list_id)
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('task_cards')
      .insert({ user_id: req.userId, list_id, name, position: nextPos })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar cartão' });
  }
});

// PUT update card (name and/or move to different list)
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('list_id').optional(),
  body('position').optional().isInt(),
], async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('task_cards')
      .select('id, list_id')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!existing) return res.status(404).json({ error: 'Cartão não encontrado' });

    const updates = {};
    ['name', 'list_id', 'position', 'cover_url', 'due_date', 'completed'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase
      .from('task_cards')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar cartão' });
  }
});

// POST reorder cards in bulk (within a list or cross-list)
// Body: { items: [{id, position}] }
router.post('/reorder', [
  body('items').isArray({ min: 1 }).withMessage('items deve ser um array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items } = req.body;

    // Update each card sequentially (Supabase JS v2 doesn't support bulk upsert with per-row filter)
    const updates = await Promise.all(
      items.map(({ id, position }) =>
        supabase
          .from('task_cards')
          .update({ position })
          .eq('id', id)
          .eq('user_id', req.userId)
      )
    );

    const failed = updates.find(({ error }) => error);
    if (failed) throw failed.error;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reordenar cartões' });
  }
});

// PUT update card (name and/or move to different list)
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('list_id').optional(),
  body('position').optional().isInt(),
], async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('task_cards')
      .select('id, list_id')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!existing) return res.status(404).json({ error: 'Cartão não encontrado' });

    const updates = {};
    ['name', 'list_id', 'position'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase
      .from('task_cards')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar cartão' });
  }
});

// DELETE card
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('task_cards')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Cartão não encontrado' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir cartão' });
  }
});

export default router;

