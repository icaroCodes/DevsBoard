import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET all boards for user/team
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('task_boards').select('*');
    
    // ISOLAMENTO ESTRITO - Evita misturar quadros pessoais com de equipe
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

// POST create board
router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
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

// PUT update board
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (color) updates.color = color;

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nada para atualizar' });

    const { data, error } = await supabase
      .from('task_boards')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Quadro não encontrado' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar quadro' });
  }
});

// DELETE board (cascade: lists + cards)
router.delete('/:id', async (req, res) => {
  try {
    // Get lists in this board
    const { data: lists } = await supabase
      .from('task_lists')
      .select('id')
      .eq('board_id', req.params.id)
      .eq('user_id', req.userId);

    if (lists && lists.length > 0) {
      const listIds = lists.map(l => l.id);
      // Delete cards in those lists
      await supabase.from('task_cards').delete().in('list_id', listIds).eq('user_id', req.userId);
      // Delete lists
      await supabase.from('task_lists').delete().in('id', listIds).eq('user_id', req.userId);
    }

    const { data, error } = await supabase
      .from('task_boards')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Quadro não encontrado' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir quadro' });
  }
});

export default router;
