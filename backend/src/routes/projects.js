import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const PROJECT_FIELDS = ['name', 'concept', 'objective', 'problem', 'target_audience', 'initial_scope', 'functional_requirements', 'interface_requirements'];

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('projects').select('*').eq('user_id', req.userId).order('id', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
});

router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const insert = { user_id: req.userId };
    PROJECT_FIELDS.forEach(f => { insert[f] = req.body[f] || null; });

    const { data, error } = await supabase.from('projects').insert(insert).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
], async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('projects').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!existing) return res.status(404).json({ error: 'Projeto não encontrado' });

    const updates = {};
    PROJECT_FIELDS.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase.from('projects').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects').delete().eq('id', req.params.id).eq('user_id', req.userId).select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir projeto' });
  }
});

export default router;
