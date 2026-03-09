import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', req.userId).order('id', { ascending: false });
    if (error) {
      console.error('Supabase error in GET /goals:', error);
      throw error;
    }
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
  body('add_amount').optional().isFloat({ min: 0.01 }), // Mínimo de 0.01
  body('remove_amount').optional().isFloat({ min: 0.01 }),
], async (req, res) => {
  try {
    const { data: goal, error: goalError } = await supabase
      .from('goals').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();

    if (goalError) {
      console.error('Supabase error in PUT /goals (select goal):', goalError);
    }

    if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

    const updates = {};
    const transactions = [];

    // Calcular saldo atual do usuário no sistema financeiro se necessário
    let currentBalance = null;
    if (req.body.add_amount !== undefined && goal.type === 'financial') {
      const { data: financeData, error: financeError } = await supabase
        .from('finances').select('type, amount').eq('user_id', req.userId);

      if (financeError) {
        console.error('Supabase error in PUT /goals (select finances):', financeError);
      }

      const incomeBalance = (financeData || []).filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);
      const expenseBalance = (financeData || []).filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0);
      currentBalance = incomeBalance - expenseBalance;
    }

    if (req.body.add_amount !== undefined && goal.type === 'financial') {
      const amountToAdd = Number(req.body.add_amount);

      if (currentBalance < amountToAdd) {
        return res.status(400).json({ error: `Saldo insuficiente (R$ ${currentBalance.toFixed(2)}) para depositar na meta` });
      }

      updates.saved_amount = Number(goal.saved_amount || 0) + amountToAdd;

      transactions.push({
        user_id: req.userId,
        type: 'expense',
        category: 'Outros',
        description: `Transferência para meta: ${goal.name}`,
        amount: amountToAdd,
        transaction_date: new Date().toISOString().split('T')[0]
      });
    }

    if (req.body.remove_amount !== undefined && goal.type === 'financial') {
      const amountToRemove = Math.min(Number(req.body.remove_amount), Number(goal.saved_amount));

      if (amountToRemove > 0) {
        updates.saved_amount = Number(goal.saved_amount) - amountToRemove;

        transactions.push({
          user_id: req.userId,
          type: 'income',
          category: 'Outros',
          description: `Resgate da meta: ${goal.name}`,
          amount: amountToRemove,
          transaction_date: new Date().toISOString().split('T')[0]
        });
      }
    }

    ['name', 'deadline_type', 'deadline_date', 'target_value', 'completed'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (Object.keys(updates).length === 0 && transactions.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    if (transactions.length > 0) {
      const { error: txError } = await supabase.from('finances').insert(transactions);
      if (txError) throw txError;
    }

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

    // Se a meta é financeira e tem saldo guardado, devolve para a conta antes de excluir
    if (goal.type === 'financial' && Number(goal.saved_amount) > 0) {
      const { error: txError } = await supabase.from('finances').insert({
        user_id: req.userId,
        type: 'income',
        category: 'Outros',
        description: `Saldo retornado da meta excluída: ${goal.name}`,
        amount: Number(goal.saved_amount),
        transaction_date: new Date().toISOString().split('T')[0]
      });
      if (txError) throw txError;
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
