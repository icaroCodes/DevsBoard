import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('goals').select('*');
    
    if (req.teamId) {
      query = query.eq('team_id', req.teamId);
    } else {
      query = query.eq('user_id', req.userId).is('team_id', null);
    }

    const { data, error } = await query.order('id', { ascending: false });
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
  body('year').optional({ nullable: true }).isInt({ min: 2000, max: 2100 }).withMessage('Ano inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, type, deadline_type = 'indefinite', deadline_date, target_value, year } = req.body;
    const insertData = {
      user_id: req.userId,
      name,
      type,
      deadline_type,
      deadline_date: deadline_date || null,
      target_value: target_value || 0,
      year: year ?? null,
    };

    if (req.teamId) {
      insertData.team_id = req.teamId;
    }

    const { data, error } = await supabase
      .from('goals')
      .insert(insertData)
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
  body('add_amount').optional().isFloat({ min: 0.01 }), 
  body('remove_amount').optional().isFloat({ min: 0.01 }),
  body('year').optional({ nullable: true }).isInt({ min: 2000, max: 2100 }).withMessage('Ano inválido'),
], async (req, res) => {
  try {
    const { userId, teamId } = req;
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', req.params.id)
      .eq(teamId ? 'team_id' : 'user_id', teamId ? teamId : userId)
      .single();

    if (goalError) {
      console.error('Supabase error in PUT /goals (select goal):', goalError);
    }

    if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

    const updates = {};
    const transactions = [];

    
    let currentBalance = null;
    if (req.body.add_amount !== undefined && goal.type === 'financial') {
      let finQuery = supabase.from('finances').select('type, amount');
      if (teamId) finQuery = finQuery.eq('team_id', teamId);
      else finQuery = finQuery.eq('user_id', userId).is('team_id', null);
      
      const { data: financeData, error: financeError } = await finQuery;

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

      
      if (updates.saved_amount >= Number(goal.target_value)) {
        updates.completed = true;
      }

      const tx = {
        user_id: userId,
        type: 'expense',
        category: 'Outros',
        description: `Transferência para meta: ${goal.name}`,
        amount: amountToAdd,
        transaction_date: new Date().toISOString().split('T')[0]
      };
      if (teamId) tx.team_id = teamId;
      transactions.push(tx);
    }

    if (req.body.remove_amount !== undefined && goal.type === 'financial') {
      const amountToRemove = Math.min(Number(req.body.remove_amount), Number(goal.saved_amount));

      if (amountToRemove > 0) {
        updates.saved_amount = Number(goal.saved_amount) - amountToRemove;

        const tx = {
          user_id: userId,
          type: 'income',
          category: 'Outros',
          description: `Resgate da meta: ${goal.name}`,
          amount: amountToRemove,
          transaction_date: new Date().toISOString().split('T')[0]
        };
        if (teamId) tx.team_id = teamId;
        transactions.push(tx);
      }
    }

    ['name', 'deadline_type', 'deadline_date', 'target_value', 'completed', 'year'].forEach(f => {
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
    const { userId, teamId } = req;
    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', req.params.id)
      .eq(teamId ? 'team_id' : 'user_id', teamId ? teamId : userId)
      .single();
      
    if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });

    
    if (goal.type === 'financial' && Number(goal.saved_amount) > 0) {
      const txData = {
        user_id: userId,
        type: 'income',
        category: 'Outros',
        description: `Saldo retornado da meta excluída: ${goal.name}`,
        amount: Number(goal.saved_amount),
        transaction_date: new Date().toISOString().split('T')[0]
      };
      if (teamId) txData.team_id = teamId;
      
      const { error: txError } = await supabase.from('finances').insert(txData);
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
