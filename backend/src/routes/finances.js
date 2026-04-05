import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';
import { processRecurring } from '../utils/recurrenceProcessor.js';

const router = Router();
router.use(authenticate);

router.get('/list', async (req, res) => {
  try {
    let query = supabase.from('finances').select('*');
    
    // ISOLAMENTO ESTRITO - Evita misturar pessoal com equipe
    if (req.teamId) {
      query = query.eq('team_id', req.teamId);
    } else {
      query = query.eq('user_id', req.userId).is('team_id', null);
    }
    
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
    const insertData = { 
      user_id: req.userId, 
      category, 
      description: description || null, 
      amount, 
      type, 
      transaction_date 
    };
    
    if (req.teamId) {
      insertData.team_id = req.teamId;
    }
    
    const { data, error } = await supabase
      .from('finances')
      .insert(insertData)
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


// --- TRANSAÇÕES RECORRENTES ---

// GET /finances/recurring/list - Listar transações recorrentes ativas
router.get('/recurring/list', async (req, res) => {
  try {
    let query = supabase.from('recurring_transactions').select('*');
    if (req.teamId) {
      query = query.eq('team_id', req.teamId);
    } else {
      query = query.eq('user_id', req.userId).is('team_id', null);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar transações recorrentes' });
  }
});

// POST /finances/recurring - Criar nova transação recorrente
router.post('/recurring', [
  body('category').trim().notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('type').isIn(['income', 'expense']),
  body('start_date').isDate(),
  body('recurrence_interval').isIn(['weekly', 'biweekly', 'monthly']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { category, description, amount, type, start_date, recurrence_interval, day_of_month, day_of_week } = req.body;
    
    const insertData = {
      user_id: req.userId,
      category,
      description: description || null,
      amount,
      type,
      start_date,
      recurrence_interval,
      day_of_month,
      day_of_week,
      is_active: true
    };
    
    if (req.teamId) insertData.team_id = req.teamId;

    const { data, error } = await supabase.from('recurring_transactions').insert(insertData).select().single();
    if (error) throw error;

    // Após criar, já processa para gerar a primeira incidência se necessário
    await processRecurring(req.userId, req.teamId);

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar transação recorrente' });
  }
});

// DELETE /finances/recurring/:id - Deletar recorrente
router.delete('/recurring/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteAll } = req.query; // ?deleteAll=true para limpar histórico

    // 1. Verificar se existe
    const { data: existing } = await supabase
      .from('recurring_transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();
    
    if (!existing) return res.status(404).json({ error: 'Recorrência não encontrada' });

    // 2. Se deleteAll for true, apaga o histórico gerado
    if (deleteAll === 'true') {
      const { error: histErr } = await supabase
        .from('finances')
        .delete()
        .eq('recurring_id', id);
      if (histErr) throw histErr;
    }

    // 3. Apaga a própria recorrente
    const { error: delErr } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id);
    
    if (delErr) throw delErr;

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir recorrência' });
  }
});

// Atualizar a listagem normal para processar recorrências automaticamente ao abrir
router.get('/', async (req, res) => {
  try {
    // Processar antes de listar
    await processRecurring(req.userId, req.teamId);

    let query = supabase.from('finances').select('*');
    if (req.teamId) {
      query = query.eq('team_id', req.teamId);
    } else {
      query = query.eq('user_id', req.userId).is('team_id', null);
    }
    
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

export default router;

