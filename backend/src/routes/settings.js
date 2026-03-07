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
  body('avatar_url').optional().isURL().withMessage('Avatar inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, avatar_url, avatar_base64 } = req.body;
    let finalAvatarUrl = avatar_url;

    // Se houver uma imagem em base64, fazer o upload para o Supabase Storage
    if (avatar_base64) {
      const buffer = Buffer.from(avatar_base64.split(',')[1], 'base64');
      const fileExt = avatar_base64.split(';')[0].split('/')[1];
      const fileName = `${req.userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (uploadError) {
        console.error('Erro no upload Storage:', uploadError);
        // Prosseguir sem atualizar o avatar se o upload falhar, ou retornar erro?
        // Vamos retornar erro para garantir.
        return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      finalAvatarUrl = publicUrl;
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name, avatar_url: finalAvatarUrl })
      .eq('id', req.userId)
      .select('id, name, email, avatar_url')
      .single();

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
