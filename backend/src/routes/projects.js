import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const PROJECT_FIELDS = ['name', 'concept', 'objective', 'problem', 'target_audience', 'initial_scope', 'functional_requirements', 'interface_requirements'];
const IMAGE_FIELDS = ['logo_url', 'figma_url'];


async function uploadProjectImage(base64, userId, projectId, type) {
  if (!base64 || typeof base64 !== 'string' || !base64.includes(';base64,')) {
    return (typeof base64 === 'string' && base64.startsWith('http')) ? base64 : null;
  }

  const parts = base64.split(',');
  if (parts.length < 2) return null;

  const buffer = Buffer.from(parts[1], 'base64');
  const fileExt = base64.split(';')[0].split('/')[1] || 'png';
  const fileName = `${userId}/${projectId}-${type}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('project-assets')
    .upload(fileName, buffer, {
      contentType: `image/${fileExt}`,
      upsert: true,
    });

  if (uploadError) {
    console.error(`Erro upload ${type}:`, uploadError);
    throw new Error(`Erro ao fazer upload da imagem (${type})`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('project-assets')
    .getPublicUrl(fileName);

  return publicUrl;
}



router.get('/', async (req, res) => {
  try {
    const { userId, teamId } = req;
    let query = supabase.from('projects').select('*, project_images(*), project_references(*)');
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.eq('user_id', userId).is('team_id', null);
    }
    const { data, error } = await query.order('id', { ascending: false });
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
    if (req.teamId) {
      insert.team_id = req.teamId;
    }
    PROJECT_FIELDS.forEach(f => { insert[f] = req.body[f] || null; });

    const { data, error } = await supabase.from('projects').insert(insert).select().single();
    if (error) throw error;

    const imageUpdates = {};
    if (req.body.logo_base64) {
      imageUpdates.logo_url = await uploadProjectImage(req.body.logo_base64, req.userId, data.id, 'logo');
    }
    if (req.body.figma_base64) {
      imageUpdates.figma_url = await uploadProjectImage(req.body.figma_base64, req.userId, data.id, 'figma');
    }

    if (Object.keys(imageUpdates).length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from('projects').update(imageUpdates).eq('id', data.id).select().single();
      if (updateError) throw updateError;
      return res.status(201).json({ ...updated, project_images: [], project_references: [] });
    }

    res.status(201).json({ ...data, project_images: [], project_references: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
], async (req, res) => {
  try {
    const { userId, teamId } = req;
    let query = supabase.from('projects').select('id').eq('id', req.params.id);
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.eq('user_id', userId).is('team_id', null);
    }
    const { data: existing } = await query.single();
    if (!existing) return res.status(404).json({ error: 'Projeto não encontrado' });

    const updates = {};
    PROJECT_FIELDS.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    IMAGE_FIELDS.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (req.body.logo_base64) {
      updates.logo_url = await uploadProjectImage(req.body.logo_base64, req.userId, req.params.id, 'logo');
    }
    if (req.body.figma_base64) {
      updates.figma_url = await uploadProjectImage(req.body.figma_base64, req.userId, req.params.id, 'figma');
    }

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
    const { userId, teamId } = req;
    let query = supabase.from('projects').select('id').eq('id', req.params.id);
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.eq('user_id', userId).is('team_id', null);
    }
    const { data: existing } = await query.single();
    if (!existing) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { error } = await supabase.from('projects').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir projeto' });
  }
});



router.post('/:id/images', async (req, res) => {
  try {
    const { title, image_base64 } = req.body;
    if (!title || !image_base64) return res.status(400).json({ error: 'Título e imagem são obrigatórios' });

    const { userId, teamId } = req;
    let query = supabase.from('projects').select('id').eq('id', req.params.id);
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.eq('user_id', userId).is('team_id', null);
    }
    const { data: proj } = await query.single();
    if (!proj) return res.status(404).json({ error: 'Projeto não encontrado' });

    const image_url = await uploadProjectImage(image_base64, req.userId, req.params.id, `img-${Date.now()}`);

    const { data, error } = await supabase
      .from('project_images')
      .insert({ project_id: req.params.id, user_id: req.userId, title, image_url })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao adicionar imagem' });
  }
});

router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { userId, teamId } = req;
    let query = supabase.from('projects').select('id').eq('id', req.params.id);
    if (teamId) query = query.eq('team_id', teamId);
    else query = query.eq('user_id', userId).is('team_id', null);
    const { data: proj } = await query.single();
    if (!proj) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data, error } = await supabase
      .from('project_images')
      .delete()
      .eq('id', req.params.imageId)
      .eq('project_id', req.params.id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Imagem não encontrada' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover imagem' });
  }
});



router.post('/:id/references', async (req, res) => {
  try {
    const { title, url, image_base64 } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

    const { userId, teamId } = req;
    let query = supabase.from('projects').select('id').eq('id', req.params.id);
    if (teamId) query = query.eq('team_id', teamId);
    else query = query.eq('user_id', userId).is('team_id', null);
    
    const { data: proj } = await query.single();
    if (!proj) return res.status(404).json({ error: 'Projeto não encontrado' });

    let image_url = null;
    if (image_base64) {
      image_url = await uploadProjectImage(image_base64, req.userId, req.params.id, `ref-${Date.now()}`);
    }

    const { data, error } = await supabase
      .from('project_references')
      .insert({ project_id: req.params.id, user_id: req.userId, title, url: url || null, image_url })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao adicionar referência' });
  }
});

router.delete('/:id/references/:refId', async (req, res) => {
  try {
    const { userId, teamId } = req;
    let query = supabase.from('projects').select('id').eq('id', req.params.id);
    if (teamId) query = query.eq('team_id', teamId);
    else query = query.eq('user_id', userId).is('team_id', null);
    const { data: proj } = await query.single();
    if (!proj) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data, error } = await supabase
      .from('project_references')
      .delete()
      .eq('id', req.params.refId)
      .eq('project_id', req.params.id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Referência não encontrada' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover referência' });
  }
});

export default router;
