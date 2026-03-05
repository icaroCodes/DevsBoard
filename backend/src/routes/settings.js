import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('id, name, email, avatar_url, created_at').eq('id', req.userId).single();
    if (error || !data) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

router.put('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { data, error } = await supabase
      .from('users').update({ name: req.body.name }).eq('id', req.userId).select('id, name, email').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.userId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
});

export default router;
