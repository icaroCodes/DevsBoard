import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const TASK_TYPES = ['feature', 'fix', 'urgent', 'critical', 'improvement', 'common'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES   = ['todo', 'in_progress', 'in_review', 'blocked', 'done'];


async function ensureProjectAccess(req, projectId) {
  let q = supabase.from('projects').select('id, user_id, team_id').eq('id', projectId);
  if (req.teamId) q = q.eq('team_id', req.teamId);
  else q = q.eq('user_id', req.userId).is('team_id', null);
  const { data } = await q.single();
  return data || null;
}


// =====================================================================
// COLUMNS
// =====================================================================

router.get('/projects/:projectId/columns', async (req, res) => {
  try {
    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data, error } = await supabase
      .from('project_task_columns')
      .select('*')
      .eq('project_id', req.params.projectId)
      .order('position', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar colunas' });
  }
});

router.post('/projects/:projectId/columns', [
  body('name').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data: existing } = await supabase
      .from('project_task_columns')
      .select('position')
      .eq('project_id', req.params.projectId)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('project_task_columns')
      .insert({
        project_id: req.params.projectId,
        user_id: req.userId,
        name: req.body.name,
        color: req.body.color || null,
        is_done_col: !!req.body.is_done_col,
        position: nextPos,
      })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar coluna' });
  }
});

router.put('/columns/:id', async (req, res) => {
  try {
    const { data: col } = await supabase
      .from('project_task_columns').select('id, project_id').eq('id', req.params.id).single();
    if (!col) return res.status(404).json({ error: 'Coluna não encontrada' });
    const project = await ensureProjectAccess(req, col.project_id);
    if (!project) return res.status(403).json({ error: 'Sem acesso' });

    const updates = {};
    ['name', 'color', 'position', 'is_done_col'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const { data, error } = await supabase
      .from('project_task_columns').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar coluna' });
  }
});

router.delete('/columns/:id', async (req, res) => {
  try {
    const { data: col } = await supabase
      .from('project_task_columns').select('id, project_id').eq('id', req.params.id).single();
    if (!col) return res.status(404).json({ error: 'Coluna não encontrada' });
    const project = await ensureProjectAccess(req, col.project_id);
    if (!project) return res.status(403).json({ error: 'Sem acesso' });

    const { error } = await supabase.from('project_task_columns').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir coluna' });
  }
});

router.post('/columns/reorder', [
  body('items').isArray({ min: 1 }),
], async (req, res) => {
  try {
    const updates = await Promise.all(
      req.body.items.map(({ id, position }) =>
        supabase.from('project_task_columns').update({ position }).eq('id', id)
      )
    );
    const failed = updates.find(({ error }) => error);
    if (failed) throw failed.error;
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reordenar colunas' });
  }
});


// =====================================================================
// TASKS
// =====================================================================

router.get('/projects/:projectId/tasks', async (req, res) => {
  try {
    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data: tasks, error } = await supabase
      .from('project_tasks')
      .select('*, project_subtasks(*)')
      .eq('project_id', req.params.projectId)
      .order('position', { ascending: true });
    if (error) throw error;

    // commits vinculados
    const taskIds = (tasks || []).map(t => t.id);
    let links = [];
    if (taskIds.length > 0) {
      const { data: linkRows } = await supabase
        .from('project_task_commits')
        .select('task_id, closes_task, linked_via, project_github_commits(*)')
        .in('task_id', taskIds);
      links = linkRows || [];
    }

    const tasksWithCommits = (tasks || []).map(t => ({
      ...t,
      commits: links
        .filter(l => l.task_id === t.id)
        .map(l => ({ ...l.project_github_commits, closes_task: l.closes_task, linked_via: l.linked_via })),
    }));

    res.json(tasksWithCommits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar tarefas' });
  }
});

router.post('/projects/:projectId/tasks', [
  body('title').trim().notEmpty(),
  body('type').optional().isIn(TASK_TYPES),
  body('priority').optional().isIn(PRIORITIES),
  body('status').optional().isIn(STATUSES),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { column_id } = req.body;
    let nextPos = 0;
    if (column_id) {
      const { data: existing } = await supabase
        .from('project_tasks').select('position').eq('column_id', column_id)
        .order('position', { ascending: false }).limit(1);
      nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;
    }

    const insert = {
      project_id: req.params.projectId,
      user_id: req.userId,
      team_id: req.teamId || null,
      column_id: column_id || null,
      title: req.body.title,
      description: req.body.description || null,
      type: req.body.type || 'common',
      priority: req.body.priority || 'medium',
      status: req.body.status || 'todo',
      assignee_id: req.body.assignee_id || null,
      due_date: req.body.due_date || null,
      position: nextPos,
    };

    const { data, error } = await supabase
      .from('project_tasks').insert(insert).select('*, project_subtasks(*)').single();
    if (error) throw error;

    await supabase.from('project_activity').insert({
      project_id: req.params.projectId,
      user_id: req.userId,
      task_id: data.id,
      type: 'task_created',
      payload: { title: data.title, type: data.type },
    });

    res.status(201).json({ ...data, commits: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('project_tasks').select('id, project_id, status').eq('id', req.params.id).single();
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    const project = await ensureProjectAccess(req, task.project_id);
    if (!project) return res.status(403).json({ error: 'Sem acesso' });

    const updates = {};
    ['title', 'description', 'type', 'priority', 'status', 'column_id',
     'position', 'assignee_id', 'due_date'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (updates.type && !TASK_TYPES.includes(updates.type)) {
      return res.status(400).json({ error: 'type inválido' });
    }
    if (updates.priority && !PRIORITIES.includes(updates.priority)) {
      return res.status(400).json({ error: 'priority inválida' });
    }
    if (updates.status && !STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: 'status inválido' });
    }

    const { data, error } = await supabase
      .from('project_tasks').update(updates).eq('id', req.params.id)
      .select('*, project_subtasks(*)').single();
    if (error) throw error;

    if (updates.status && updates.status !== task.status) {
      await supabase.from('project_activity').insert({
        project_id: task.project_id,
        user_id: req.userId,
        task_id: task.id,
        type: updates.status === 'done' ? 'task_completed' : 'task_status_changed',
        payload: { from: task.status, to: updates.status },
      });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('project_tasks').select('id, project_id').eq('id', req.params.id).single();
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    const project = await ensureProjectAccess(req, task.project_id);
    if (!project) return res.status(403).json({ error: 'Sem acesso' });

    const { error } = await supabase.from('project_tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
});

router.post('/tasks/reorder', [
  body('items').isArray({ min: 1 }),
], async (req, res) => {
  try {
    const updates = await Promise.all(
      req.body.items.map(({ id, column_id, position }) => {
        const patch = { position };
        if (column_id !== undefined) patch.column_id = column_id;
        return supabase.from('project_tasks').update(patch).eq('id', id);
      })
    );
    const failed = updates.find(({ error }) => error);
    if (failed) throw failed.error;
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reordenar tarefas' });
  }
});


// =====================================================================
// SUBTASKS
// =====================================================================

router.post('/tasks/:taskId/subtasks', [
  body('title').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { data: task } = await supabase
      .from('project_tasks').select('id, project_id').eq('id', req.params.taskId).single();
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    const project = await ensureProjectAccess(req, task.project_id);
    if (!project) return res.status(403).json({ error: 'Sem acesso' });

    const { data: existing } = await supabase
      .from('project_subtasks').select('position').eq('task_id', req.params.taskId)
      .order('position', { ascending: false }).limit(1);
    const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('project_subtasks')
      .insert({
        task_id: req.params.taskId,
        user_id: req.userId,
        title: req.body.title,
        position: nextPos,
      })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar subtarefa' });
  }
});

router.put('/subtasks/:id', async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('project_subtasks').select('id, task_id').eq('id', req.params.id).single();
    if (!sub) return res.status(404).json({ error: 'Subtarefa não encontrada' });

    const { data: task } = await supabase
      .from('project_tasks').select('project_id').eq('id', sub.task_id).single();
    const project = await ensureProjectAccess(req, task.project_id);
    if (!project) return res.status(403).json({ error: 'Sem acesso' });

    const updates = {};
    ['title', 'completed', 'position'].forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const { data, error } = await supabase
      .from('project_subtasks').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar subtarefa' });
  }
});

router.delete('/subtasks/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('project_subtasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir subtarefa' });
  }
});


// =====================================================================
// TIMELINE / ACTIVITY
// =====================================================================

router.get('/projects/:projectId/activity', async (req, res) => {
  try {
    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data, error } = await supabase
      .from('project_activity')
      .select('*, project_github_commits(sha, message, author_login, author_avatar_url, html_url, committed_at)')
      .eq('project_id', req.params.projectId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar atividade' });
  }
});


export default router;
