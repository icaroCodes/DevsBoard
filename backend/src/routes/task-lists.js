import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);


// In team context, scope by team_id (so all members share the same data
// and Supabase Realtime team channel filters match). In personal context,
// scope by user_id with team_id IS NULL.
function scopeQuery(query, req) {
  if (req.teamId) return query.eq('team_id', req.teamId);
  return query.eq('user_id', req.userId).is('team_id', null);
}


router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('task_lists')
      .select('*')
      .order('position', { ascending: true });

    query = scopeQuery(query, req);

    if (req.query.board_id) {
      query = query.eq('board_id', req.query.board_id);
    }

    const { data: lists, error: listErr } = await query;
    if (listErr) throw listErr;

    const listIds = lists.map(l => l.id);
    let cards = [];
    if (listIds.length > 0) {
      let cardsQuery = supabase
        .from('task_cards')
        .select('*')
        .in('list_id', listIds)
        .order('position', { ascending: true });
      cardsQuery = scopeQuery(cardsQuery, req);
      const { data: cardData, error: cardErr } = await cardsQuery;
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


router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    let posQuery = supabase
      .from('task_lists')
      .select('position')
      .eq('board_id', req.body.board_id)
      .order('position', { ascending: false })
      .limit(1);
    posQuery = scopeQuery(posQuery, req);
    const { data: existing } = await posQuery;

    const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const insertData = {
      user_id: req.userId,
      name: req.body.name,
      position: nextPos,
      board_id: req.body.board_id,
    };
    if (req.teamId) insertData.team_id = req.teamId;

    const { data, error } = await supabase
      .from('task_lists')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, cards: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar lista' });
  }
});


router.put('/:id', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
    let existsQuery = supabase
      .from('task_lists')
      .select('id')
      .eq('id', req.params.id);
    existsQuery = scopeQuery(existsQuery, req);
    const { data: existing } = await existsQuery.single();

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


router.delete('/:id', async (req, res) => {
  try {
    let existsQuery = supabase
      .from('task_lists')
      .select('id')
      .eq('id', req.params.id);
    existsQuery = scopeQuery(existsQuery, req);
    const { data: existing } = await existsQuery.single();

    if (!existing) return res.status(404).json({ error: 'Lista não encontrada' });

    let cardsDel = supabase.from('task_cards').delete().eq('list_id', req.params.id);
    cardsDel = scopeQuery(cardsDel, req);
    await cardsDel;

    let listDel = supabase.from('task_lists').delete().eq('id', req.params.id);
    listDel = scopeQuery(listDel, req);
    const { error } = await listDel;

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir lista' });
  }
});


router.post('/reorder', [
  body('items').isArray({ min: 1 }).withMessage('items deve ser um array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items } = req.body;

    const updates = await Promise.all(
      items.map(({ id, position }) => {
        let q = supabase.from('task_lists').update({ position }).eq('id', id);
        q = scopeQuery(q, req);
        return q;
      })
    );

    const failed = updates.find(({ error }) => error);
    if (failed) throw failed.error;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reordenar listas' });
  }
});

export default router;
