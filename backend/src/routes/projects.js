import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';
import { assertProjectAccess, uploadBase64Image } from '../utils/projectAccess.js';

const router = Router();
router.use(authenticate);

const FIELDS = ['name', 'description', 'color', 'icon', 'cover_url'];

router.get('/', async (req, res) => {
  try {
    const { userId, teamId } = req;
    let q = supabase.from('projects').select('*');
    if (teamId) q = q.eq('team_id', teamId);
    else q = q.eq('user_id', userId).is('team_id', null);
    const { data, error } = await q.order('id', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const { data, error } = await supabase.from('projects').select('*').eq('id', req.projectId).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar projeto' });
  }
});

router.post('/', [body('name').trim().notEmpty().withMessage('Nome é obrigatório')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const insert = { user_id: req.userId };
    if (req.teamId) insert.team_id = req.teamId;
    FIELDS.forEach(f => { if (req.body[f] !== undefined) insert[f] = req.body[f]; });

    const { data, error } = await supabase.from('projects').insert(insert).select().single();
    if (error) throw error;

    if (req.body.logo_base64) {
      const logo_url = await uploadBase64Image(req.body.logo_base64, req.userId, data.id, 'logo');
      const { data: upd } = await supabase.from('projects').update({ logo_url }).eq('id', data.id).select().single();
      return res.status(201).json(upd);
    }
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

router.put('/:id', [body('name').optional().trim().notEmpty()], async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const pid = req.projectId;

    const updates = {};
    FIELDS.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.body.logo_url !== undefined) updates.logo_url = req.body.logo_url;
    if (req.body.logo_base64) {
      updates.logo_url = await uploadBase64Image(req.body.logo_base64, req.userId, pid, 'logo');
    }
    if (req.body.cover_base64) {
      updates.cover_url = await uploadBase64Image(req.body.cover_base64, req.userId, pid, 'cover');
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { data, error } = await supabase.from('projects').update(updates).eq('id', pid).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const { error } = await supabase.from('projects').delete().eq('id', req.projectId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir projeto' });
  }
});

// ============ TASKS ============
router.get('/:id/tasks', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const { data, error } = await supabase.from('project_tasks').select('*').eq('project_id', req.projectId).order('position').order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao listar tarefas' }); }
});

router.post('/:id/tasks', [body('title').trim().notEmpty().withMessage('Título é obrigatório')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { title, description = null, status = 'todo' } = req.body;
    if (!['todo', 'doing', 'done'].includes(status)) return res.status(400).json({ error: 'Status inválido' });

    const { data, error } = await supabase.from('project_tasks')
      .insert({ project_id: req.projectId, title, description, status })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao criar tarefa' }); }
});

router.put('/:id/tasks/:taskId', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const updates = {};
    if (req.body.title !== undefined) {
      if (!String(req.body.title).trim()) return res.status(400).json({ error: 'Título é obrigatório' });
      updates.title = req.body.title;
    }
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.status !== undefined) {
      if (!['todo', 'doing', 'done'].includes(req.body.status)) return res.status(400).json({ error: 'Status inválido' });
      updates.status = req.body.status;
    }
    if (req.body.position !== undefined) updates.position = Number(req.body.position) || 0;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nada para atualizar' });

    const { data, error } = await supabase.from('project_tasks').update(updates)
      .eq('id', req.params.taskId).eq('project_id', req.projectId)
      .select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao atualizar tarefa' }); }
});

router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const { error } = await supabase.from('project_tasks').delete()
      .eq('id', req.params.taskId).eq('project_id', req.projectId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao excluir tarefa' }); }
});

// ============ DOC ============
router.get('/:id/doc', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const pid = req.projectId;
    const { data } = await supabase.from('project_docs').select('*').eq('project_id', pid).maybeSingle();
    res.json(data || { project_id: pid, content: '', updated_at: null });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao carregar documentação' }); }
});

router.put('/:id/doc', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const pid = req.projectId;
    const content = typeof req.body.content === 'string' ? req.body.content : '';
    const { data, error } = await supabase.from('project_docs')
      .upsert({ project_id: pid, content }, { onConflict: 'project_id' })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao salvar documentação' }); }
});


// ============ ASSETS ============
router.get('/:id/assets', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const { data, error } = await supabase.from('assets').select('*')
      .eq('project_id', req.projectId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao listar assets' }); }
});

router.post('/:id/assets', [body('title').trim().notEmpty().withMessage('Título é obrigatório')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const pid = req.projectId;
    const { title, type, url, image_base64 } = req.body;
    if (!['logo', 'screen', 'figma', 'inspiration', 'link'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' });

    let image_url = null;
    if (image_base64) {
      image_url = await uploadBase64Image(image_base64, req.userId, pid, `asset-${Date.now()}`);
    }
    const finalUrl = url || null;
    if (!finalUrl && !image_url) return res.status(400).json({ error: 'Informe uma URL ou imagem' });

    const { data, error } = await supabase.from('assets')
      .insert({ project_id: pid, title, type, url: finalUrl, image_url })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao adicionar asset' }); }
});

router.delete('/:id/assets/:assetId', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const { error } = await supabase.from('assets').delete()
      .eq('id', req.params.assetId).eq('project_id', req.projectId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao excluir asset' }); }
});

// ============ COMENTÁRIOS DE PÁGINA ============
router.get('/:id/comments', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const pid = req.projectId;
    const { data: comments, error } = await supabase.from('project_comments')
      .select('*')
      .eq('project_id', pid)
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Backfill on-the-fly: para comentários sem snapshot, busca em users e atualiza a linha
    const needs = (comments || []).filter(c => !c.user_name);
    if (needs.length > 0) {
      const ids = [...new Set(needs.map(c => c.user_id))];
      const { data: users, error: uerr } = await supabase.from('users')
        .select('id, name, avatar_url, email').in('id', ids);

      if (uerr) {
        console.error('[comments] lookup users falhou:', uerr.message, 'ids:', ids);
      } else {
        console.log('[comments] backfill: encontrei', (users || []).length, 'de', ids.length, 'usuários');
        const map = Object.fromEntries((users || []).map(u => [String(u.id), u]));
        for (const c of needs) {
          const u = map[String(c.user_id)];
          if (!u) continue;
          c.user_name   = u.name || u.email?.split('@')[0] || null;
          c.user_avatar = u.avatar_url || null;
          // Persist (fire-and-forget)
          supabase.from('project_comments')
            .update({ user_name: c.user_name, user_avatar: c.user_avatar })
            .eq('id', c.id)
            .then(({ error: werr }) => { if (werr) console.error('[comments] backfill write:', werr.message); });
        }
      }
    }

    res.json((comments || []).map(c => ({
      ...c,
      user_name: c.user_name || 'Usuário',
      user_avatar: c.user_avatar || null,
    })));
  } catch (err) { console.error('[comments GET]', err); res.status(500).json({ error: 'Erro ao listar comentários' }); }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    let content = (typeof req.body.content === 'string' ? req.body.content : '').trim();

    if (req.body.attachment_base64) {
      const url = await uploadBase64Image(
        req.body.attachment_base64, req.userId, req.params.id, `comment-${Date.now()}`
      );
      content = (content ? content + '\n\n' : '') + `![anexo](${url})`;
    }

    if (!content) return res.status(400).json({ error: 'Comentário vazio' });

    // Snapshot do usuário no momento do insert — independente de joins funcionarem.
    const { data: u, error: uerr } = await supabase.from('users')
      .select('id, name, avatar_url, email').eq('id', req.userId).maybeSingle();
    if (uerr) console.error('[comments] user fetch on insert:', uerr);

    const userName   = u?.name || u?.email?.split('@')[0] || null;
    const userAvatar = u?.avatar_url || null;

    const insertPayload = {
        project_id: req.projectId,
        user_id: req.userId,
        content,
        user_name: userName,
        user_avatar: userAvatar,
      };
    if (req.body.parent_id) insertPayload.parent_id = req.body.parent_id;

    const { data: c, error } = await supabase.from('project_comments')
      .insert(insertPayload)
      .select('*').single();
    if (error) throw error;

    res.status(201).json({
      ...c,
      user_name: c.user_name || userName || 'Usuário',
      user_avatar: c.user_avatar || userAvatar || null,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao criar comentário' }); }
});

router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const { error } = await supabase.from('project_comments')
      .delete()
      .eq('id', req.params.commentId)
      .eq('project_id', req.projectId)
      .eq('user_id', req.userId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao excluir comentário' }); }
});

// ============ COMENTÁRIOS DE CÓDIGO ============
router.get('/:id/code-comments', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data, error } = await supabase.from('code_comments')
      .select('*, replies:code_comment_replies(*)')
      .eq('project_id', req.projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Sort replies by created_at
    const result = (data || []).map(c => ({
      ...c,
      replies: (c.replies || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    }));

    res.json(result);
  } catch (err) { console.error('[code-comments GET]', err); res.status(500).json({ error: 'Erro ao listar' }); }
});

router.post('/:id/code-comments', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { block_id, line_start, line_end, content } = req.body;
    if (!block_id || !content?.trim()) return res.status(400).json({ error: 'Dados inválidos' });

    const { data: u } = await supabase.from('users')
      .select('name, avatar_url, email').eq('id', req.userId).maybeSingle();

    const { data, error } = await supabase.from('code_comments')
      .insert({
        project_id: req.projectId,
        user_id: req.userId,
        block_id,
        line_start: line_start ?? 0,
        line_end: line_end ?? line_start ?? 0,
        content: content.trim(),
        user_name: u?.name || u?.email?.split('@')[0] || 'Usuário',
        user_avatar: u?.avatar_url || null,
      })
      .select('*, replies:code_comment_replies(*)').single();
    if (error) throw error;
    res.status(201).json({ ...data, replies: [] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao criar' }); }
});

router.put('/:id/code-comments/:commentId', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const updates = {};
    if (req.body.content !== undefined) updates.content = req.body.content;
    if (req.body.resolved !== undefined) updates.resolved = req.body.resolved;
    if (req.body.reactions !== undefined) updates.reactions = req.body.reactions;

    const { data, error } = await supabase.from('code_comments')
      .update(updates)
      .eq('id', req.params.commentId)
      .eq('project_id', req.projectId)
      .select('*, replies:code_comment_replies(*)').single();
    if (error) throw error;
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao atualizar' }); }
});

router.delete('/:id/code-comments/:commentId', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });
    const { error } = await supabase.from('code_comments')
      .delete()
      .eq('id', req.params.commentId)
      .eq('project_id', req.projectId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao excluir' }); }
});

router.post('/:id/code-comments/:commentId/replies', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Resposta vazia' });

    const { data: u } = await supabase.from('users')
      .select('name, avatar_url, email').eq('id', req.userId).maybeSingle();

    const { data, error } = await supabase.from('code_comment_replies')
      .insert({
        comment_id: req.params.commentId,
        user_id: req.userId,
        content: content.trim(),
        user_name: u?.name || u?.email?.split('@')[0] || 'Usuário',
        user_avatar: u?.avatar_url || null,
      })
      .select('*').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao responder' }); }
});

router.put('/:id/code-comments/:commentId/replies/:replyId', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { content } = req.body;
    if (content === undefined || !String(content).trim()) return res.status(400).json({ error: 'Conteúdo inválido' });

    const { data: row } = await supabase.from('code_comment_replies')
      .select('id, user_id').eq('id', req.params.replyId).eq('comment_id', req.params.commentId).maybeSingle();
    if (!row) return res.status(404).json({ error: 'Resposta não encontrada' });
    if (String(row.user_id) !== String(req.userId)) return res.status(403).json({ error: 'Sem permissão' });

    const { data, error } = await supabase.from('code_comment_replies')
      .update({ content: String(content).trim() })
      .eq('id', req.params.replyId)
      .select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao atualizar resposta' }); }
});

router.delete('/:id/code-comments/:commentId/replies/:replyId', async (req, res) => {
  try {
    const ok = await assertProjectAccess(req.params.id, req);
    if (!ok) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data: row } = await supabase.from('code_comment_replies')
      .select('id, user_id').eq('id', req.params.replyId).eq('comment_id', req.params.commentId).maybeSingle();
    if (!row) return res.status(404).json({ error: 'Resposta não encontrada' });
    if (String(row.user_id) !== String(req.userId)) return res.status(403).json({ error: 'Sem permissão' });

    const { error } = await supabase.from('code_comment_replies').delete().eq('id', req.params.replyId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao excluir resposta' }); }
});

export default router;
