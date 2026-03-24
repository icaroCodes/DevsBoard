import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET all lists with their cards (optionally filtered by board_id)
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('task_lists')
      .select('*')
      .eq('user_id', req.userId)
      .order('position', { ascending: true });

    if (req.query.board_id) {
      query = query.eq('board_id', req.query.board_id);
    }

    const { data: lists, error: listErr } = await query;
    if (listErr) throw listErr;

    // Fetch cards for these lists
    const listIds = lists.map(l => l.id);
    let cards = [];
    if (listIds.length > 0) {
      const { data: cardData, error: cardErr } = await supabase
        .from('task_cards')
        .select('*')
        .in('list_id', listIds)
        .eq('user_id', req.userId)
        .order('position', { ascending: true });
      if (cardErr) throw cardErr;
      cards = cardData || [];
    }

    const result = lists.map(list => ({
      ...list,
      cards: cards.filter(c => c.list_id === list.id),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar listas' });
  }
});

// POST create list
router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Determine next position
    const { data: existing } = await supabase
      .from('task_lists')
      .select('position')
      .eq('user_id', req.userId)
      .eq('board_id', req.body.board_id)
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('task_lists')
      .insert({ user_id: req.userId, name: req.body.name, position: nextPos, board_id: req.body.board_id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, cards: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar lista' });
  }
});

// PUT update list name
router.put('/:id', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('task_lists')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!existing) return res.status(404).json({ error: 'Lista não encontrada' });

    const { data, error } = await supabase
      .from('task_lists')
      .update({ name: req.body.name })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar lista' });
  }
});

// DELETE list (cascade deletes cards via DB or manually)
router.delete('/:id', async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('task_lists')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!existing) return res.status(404).json({ error: 'Lista não encontrada' });

    // Delete cards first
    await supabase.from('task_cards').delete().eq('list_id', req.params.id).eq('user_id', req.userId);

    const { error } = await supabase
      .from('task_lists')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir lista' });
  }
});

export default router;
