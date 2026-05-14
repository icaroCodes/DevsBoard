import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseForRequest } from '../utils/supabaseClient.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);


router.get('/', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    let query = supabase.from('task_boards').select('*');
    
    
    if (req.teamId) {
      query = query.eq('team_id', req.teamId);
    } else {
      query = query.eq('user_id', req.userId).is('team_id', null);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar quadros' });
  }
});


router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, color } = req.body;
    const insertData = { 
      user_id: req.userId, 
      name, 
      color: color || '#2C2C2E' 
    };

    if (req.teamId) {
      insertData.team_id = req.teamId;
    }

    const { data, error } = await supabase
      .from('task_boards')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar quadro' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const { name, color } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (color) updates.color = color;

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nada para atualizar' });

    // Scope the UPDATE the same way DELETE/GET do (by team in team context,
    // by user in personal context). The earlier `user_id`-only filter was a
    // confused-deputy: a board created by user A inside team T could only be
    // edited by user A even after team membership changed, and worse, the
    // matcher used the *requester's* user_id which silently no-ops on rows
    // they don't own instead of returning a clean 404/403.
    let q = supabase.from('task_boards').update(updates).eq('id', req.params.id);
    if (req.teamId) q = q.eq('team_id', req.teamId);
    else q = q.eq('user_id', req.userId).is('team_id', null);
    const { data, error } = await q.select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Quadro não encontrado' });
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar quadro' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const scope = (q) => req.teamId
      ? q.eq('team_id', req.teamId)
      : q.eq('user_id', req.userId).is('team_id', null);

    let listsQuery = supabase
      .from('task_lists')
      .select('id')
      .eq('board_id', req.params.id);
    listsQuery = scope(listsQuery);
    const { data: lists } = await listsQuery;

    if (lists && lists.length > 0) {
      const listIds = lists.map(l => l.id);
      let cardsDel = supabase.from('task_cards').delete().in('list_id', listIds);
      cardsDel = scope(cardsDel);
      await cardsDel;
      let listsDel = supabase.from('task_lists').delete().in('id', listIds);
      listsDel = scope(listsDel);
      await listsDel;
    }

    let boardDel = supabase.from('task_boards').delete().eq('id', req.params.id);
    boardDel = scope(boardDel);
    const { data, error } = await boardDel.select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Quadro não encontrado' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir quadro' });
  }
});

export default router;
