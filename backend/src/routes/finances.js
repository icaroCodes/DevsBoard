import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('finances').select('*').eq('user_id', req.userId);
    if (req.query.type && ['income', 'expense'].includes(req.query.type)) {
      query = query.eq('type', req.query.type);
    }
    const { data, error } = await query.order('transaction_date', { ascending: false }).order('id', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar finanças' });
  }
});

router.post('/', [
  body('category').trim().notEmpty().withMessage('Categoria é obrigatória'),
  body('description').optional().trim(),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valor inválido'),
  body('type').isIn(['income', 'expense']).withMessage('Tipo inválido'),
  body('transaction_date').isDate().withMessage('Data inválida'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { category, description, amount, type, transaction_date } = req.body;
    const { data, error } = await supabase
      .from('finances')
      .insert({ user_id: req.userId, category, description: description || null, amount, type, transaction_date })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

router.put('/:id', [
  body('category').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('type').optional().isIn(['income', 'expense']),
  body('transaction_date').optional().isDate(),
], async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('finances').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!existing) return res.status(404).json({ error: 'Transação não encontrada' });

    const updates = {};
    ['category', 'description', 'amount', 'type', 'transaction_date'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase.from('finances').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('finances').delete().eq('id', req.params.id).eq('user_id', req.userId).select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Transação não encontrada' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

export default router;
