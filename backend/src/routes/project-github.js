import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import supabase from '../database/connection.js';
import config from '../config/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const GITHUB_CLIENT_ID     = (process.env.GITHUB_CLIENT_ID || '').trim();
const GITHUB_CLIENT_SECRET = (process.env.GITHUB_CLIENT_SECRET || '').trim();
const FRONTEND_URL         = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
const REPO_CALLBACK_URL    = (process.env.GITHUB_REPO_CALLBACK_URL
                             || 'http://localhost:3001/project-github/callback').trim();
const WEBHOOK_SECRET       = (process.env.GITHUB_WEBHOOK_SECRET || '').trim();

// ---- token encryption (AES-256-GCM, key derived from JWT secret) -----
const ENC_KEY = crypto.createHash('sha256').update(config.jwt.accessSecret).digest();

function encryptToken(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decryptToken(stored) {
  const buf = Buffer.from(stored, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

async function gh(path, accessToken, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'DevsBoard',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const err = new Error(`GitHub ${res.status}: ${txt.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function ensureProjectAccess(req, projectId) {
  let q = supabase.from('projects').select('id, user_id, team_id').eq('id', projectId);
  if (req.teamId) q = q.eq('team_id', req.teamId);
  else q = q.eq('user_id', req.userId).is('team_id', null);
  const { data } = await q.single();
  return data || null;
}

async function getUserToken(userId) {
  const { data } = await supabase
    .from('user_github_integrations')
    .select('access_token, github_username, github_user_id')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  try {
    return { ...data, access_token: decryptToken(data.access_token) };
  } catch {
    return null;
  }
}


// =====================================================================
// OAUTH — conexão de REPOSITÓRIO (escopo `repo`)
// =====================================================================
//
// Diferente de /auth/github (que loga no DevsBoard), aqui pedimos o scope
// `repo` para conseguir ler commits/PRs.
//
// Fluxo:
//   GET  /project-github/connect?redirect=/projects   (autenticado)
//        -> redireciona para o GitHub
//   GET  /project-github/callback?code=...&state=...  (público — GitHub bate aqui)
//        -> grava o token no user_github_integrations e redireciona pro front

router.get('/connect', authenticate, (req, res) => {
  // state assinado contém o userId — o callback é público mas só age sobre esse user
  const state = jwt.sign(
    { userId: req.userId, redirect: req.query.redirect || '/projects' },
    config.jwt.accessSecret,
    { expiresIn: '10m' }
  );
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REPO_CALLBACK_URL,
    scope: 'repo read:user',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.redirect(`${FRONTEND_URL}/projects?gh=invalid`);

  let payload;
  try { payload = jwt.verify(state, config.jwt.accessSecret); }
  catch { return res.redirect(`${FRONTEND_URL}/projects?gh=expired`); }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REPO_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[GH Repo OAuth] sem token:', tokenData);
      return res.redirect(`${FRONTEND_URL}/projects?gh=falhou`);
    }

    const ghUser = await gh('/user', tokenData.access_token);
    const encrypted = encryptToken(tokenData.access_token);

    await supabase.from('user_github_integrations').upsert({
      user_id: payload.userId,
      github_user_id: ghUser.id,
      github_username: ghUser.login,
      github_avatar_url: ghUser.avatar_url,
      access_token: encrypted,
      scope: tokenData.scope,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    res.redirect(`${FRONTEND_URL}${payload.redirect || '/projects'}?gh=connected`);
  } catch (err) {
    console.error('[GH Repo OAuth Error]', err);
    res.redirect(`${FRONTEND_URL}/projects?gh=erro`);
  }
});


// =====================================================================
// WEBHOOK — receptor público (assinado por HMAC SHA-256)
// =====================================================================
//
// Configuração no GitHub:
//   Settings -> Webhooks -> Add webhook
//   Payload URL:  https://SEU_DOMINIO/project-github/webhook/<PROJECT_ID>
//   Content type: application/json
//   Secret:       valor de GITHUB_WEBHOOK_SECRET no .env do backend
//   Events:       Pushes, Pull requests
//
// Webhook handler exportado — montado diretamente no app (server.js)
// para garantir isolamento total do middleware de autenticação.
// NÃO registrar aqui no router.


// Daqui pra baixo tudo precisa de auth
router.use(authenticate);


// status da integração
router.get('/status', async (req, res) => {
  try {
    const { data } = await supabase
      .from('user_github_integrations')
      .select('github_username, github_avatar_url, scope, connected_at')
      .eq('user_id', req.userId).single();
    res.json({ connected: !!data, ...(data || {}) });
  } catch (err) {
    res.json({ connected: false });
  }
});

router.delete('/disconnect', async (req, res) => {
  try {
    await supabase.from('user_github_integrations').delete().eq('user_id', req.userId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao desconectar' });
  }
});


// listar repositórios do usuário
router.get('/repos', async (req, res) => {
  try {
    const tok = await getUserToken(req.userId);
    if (!tok) return res.status(400).json({ error: 'GitHub não conectado' });

    const repos = await gh(
      '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
      tok.access_token
    );
    res.json(repos.map(r => ({
      id: r.id,
      full_name: r.full_name,
      name: r.name,
      private: r.private,
      description: r.description,
      default_branch: r.default_branch,
      html_url: r.html_url,
      updated_at: r.updated_at,
      language: r.language,
    })));
  } catch (err) {
    console.error('[GH repos]', err);
    res.status(500).json({ error: err.message });
  }
});


// vincular um repo a um projeto
router.post('/projects/:projectId/repo', [
  body('full_name').trim().notEmpty(),
  body('id').isInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const tok = await getUserToken(req.userId);
    if (!tok) return res.status(400).json({ error: 'GitHub não conectado' });

    const repo = await gh(`/repos/${req.body.full_name}`, tok.access_token);

    const { data, error } = await supabase
      .from('projects').update({
        github_repo_id: repo.id,
        github_repo_name: repo.full_name,
        github_repo_url: repo.html_url,
        github_default_branch: repo.default_branch,
        github_connected_at: new Date().toISOString(),
      }).eq('id', req.params.projectId).select().single();
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('[GH link repo]', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/projects/:projectId/repo', async (req, res) => {
  try {
    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    await supabase.from('projects').update({
      github_repo_id: null,
      github_repo_name: null,
      github_repo_url: null,
      github_default_branch: null,
      github_connected_at: null,
    }).eq('id', req.params.projectId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao desvincular repo' });
  }
});


// sincroniza commits do repo p/ o banco (e dispara o trigger de auto-link)
router.post('/projects/:projectId/sync', async (req, res) => {
  try {
    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data: full } = await supabase
      .from('projects').select('github_repo_name, github_default_branch, github_last_sync_at')
      .eq('id', req.params.projectId).single();
    if (!full?.github_repo_name) return res.status(400).json({ error: 'Repo não conectado ao projeto' });

    const tok = await getUserToken(req.userId);
    if (!tok) return res.status(400).json({ error: 'GitHub não conectado' });

    const branch = full.github_default_branch || 'main';
    const since = full.github_last_sync_at
      ? `&since=${encodeURIComponent(full.github_last_sync_at)}`
      : '';
    const commits = await gh(
      `/repos/${full.github_repo_name}/commits?sha=${encodeURIComponent(branch)}&per_page=100${since}`,
      tok.access_token
    );

    let inserted = 0;
    for (const c of commits) {
      const { error } = await supabase.from('project_github_commits').upsert({
        project_id: req.params.projectId,
        sha: c.sha,
        message: c.commit.message,
        author_name: c.commit.author?.name,
        author_email: c.commit.author?.email,
        author_login: c.author?.login,
        author_avatar_url: c.author?.avatar_url,
        html_url: c.html_url,
        branch,
        committed_at: c.commit.author?.date || c.commit.committer?.date,
        raw: c,
      }, { onConflict: 'project_id,sha' });
      if (!error) inserted++;
    }

    await supabase.from('projects')
      .update({ github_last_sync_at: new Date().toISOString() })
      .eq('id', req.params.projectId);

    res.json({ ok: true, fetched: commits.length, upserted: inserted });
  } catch (err) {
    console.error('[GH sync]', err);
    res.status(500).json({ error: err.message });
  }
});


// listar commits já salvos
router.get('/projects/:projectId/commits', async (req, res) => {
  try {
    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const { data, error } = await supabase
      .from('project_github_commits')
      .select('*, project_task_commits(task_id, closes_task, linked_via)')
      .eq('project_id', req.params.projectId)
      .order('committed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar commits' });
  }
});


// link manual commit <-> task
router.post('/tasks/:taskId/commits/:commitId', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('project_tasks').select('project_id').eq('id', req.params.taskId).single();
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    const project = await ensureProjectAccess(req, task.project_id);
    if (!project) return res.status(403).json({ error: 'Sem acesso' });

    const { data, error } = await supabase
      .from('project_task_commits')
      .upsert({
        task_id: req.params.taskId,
        commit_id: req.params.commitId,
        linked_via: 'manual',
        closes_task: !!req.body.closes_task,
      }, { onConflict: 'task_id,commit_id' })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao vincular commit' });
  }
});

router.delete('/tasks/:taskId/commits/:commitId', async (req, res) => {
  try {
    const { error } = await supabase.from('project_task_commits')
      .delete().eq('task_id', req.params.taskId).eq('commit_id', req.params.commitId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao desvincular commit' });
  }
});


// heatmap
router.get('/projects/:projectId/heatmap', async (req, res) => {
  try {
    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data, error } = await supabase
      .from('v_project_commit_heatmap').select('*').eq('project_id', req.params.projectId);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar heatmap' });
  }
});

// ranking
router.get('/projects/:projectId/ranking', async (req, res) => {
  try {
    const project = await ensureProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data, error } = await supabase
      .from('v_project_contributors_ranking').select('*')
      .eq('project_id', req.params.projectId)
      .order('total_commits', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar ranking' });
  }
});


export const webhookHandler = async (req, res) => {
  console.log('🔥 webhook hit', {
    event: req.headers['x-github-event'],
    projectId: req.params.projectId,
    method: req.method,
    url: req.originalUrl,
  });

  try {
    if (!WEBHOOK_SECRET) {
      console.warn('[GH webhook] GITHUB_WEBHOOK_SECRET ausente — recusando');
      return res.status(503).json({ error: 'webhook não configurado' });
    }

    const sig = req.headers['x-hub-signature-256'];
    if (!sig) return res.status(401).json({ error: 'sem assinatura' });

    const raw = req.rawBody;
    if (!raw) {
      console.error('[GH webhook] req.rawBody ausente');
      return res.status(500).json({ error: 'raw body não capturado' });
    }

    const expected = 'sha256=' + crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(raw)
      .digest('hex');

    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).json({ error: 'assinatura inválida' });
    }

    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'ping') {
      return res.status(200).json({ ok: true, msg: 'pong' });
    }

    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, github_repo_id, github_default_branch')
      .eq('id', req.params.projectId).single();

    if (projErr || !project) {
      console.error('[GH webhook] projeto não encontrado:', req.params.projectId, projErr);
      return res.status(404).json({ error: 'projeto não existe' });
    }

    if (!project.github_repo_id || project.github_repo_id !== payload.repository?.id) {
      return res.status(400).json({ error: 'repo não confere com o projeto' });
    }

    if (event === 'push') {
      const branch = (payload.ref || '').replace('refs/heads/', '');
      const commits = payload.commits || [];
      for (const c of commits) {
        await supabase.from('project_github_commits').upsert({
          project_id: project.id,
          sha: c.id,
          message: c.message,
          author_name: c.author?.name,
          author_email: c.author?.email,
          author_login: c.author?.username,
          author_avatar_url: null,
          html_url: c.url,
          branch,
          committed_at: c.timestamp,
          additions: c.added?.length || null,
          deletions: c.removed?.length || null,
          files_changed: (c.added?.length || 0) + (c.modified?.length || 0) + (c.removed?.length || 0) || null,
          raw: c,
        }, { onConflict: 'project_id,sha' });
      }
      await supabase.from('projects')
        .update({ github_last_sync_at: new Date().toISOString() })
        .eq('id', project.id);

      return res.status(200).json({ ok: true, processed: commits.length });
    }

    if (event === 'pull_request') {
      const pr = payload.pull_request;
      if (!pr) return res.status(200).json({ ok: true });

      let state = pr.state;
      if (pr.draft) state = 'draft';
      else if (pr.merged) state = 'merged';

      await supabase.from('project_github_pull_requests').upsert({
        project_id: project.id,
        github_pr_id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state,
        html_url: pr.html_url,
        author_login: pr.user?.login,
        author_avatar_url: pr.user?.avatar_url,
        base_branch: pr.base?.ref,
        head_branch: pr.head?.ref,
        created_at_gh: pr.created_at,
        merged_at: pr.merged_at,
        closed_at: pr.closed_at,
        fetched_at: new Date().toISOString(),
        raw: pr,
      }, { onConflict: 'project_id,github_pr_id' });

      const action = payload.action;
      if (action === 'opened' || action === 'reopened') {
        await supabase.from('project_activity').insert({
          project_id: project.id, type: 'pr_opened',
          payload: { number: pr.number, title: pr.title, author: pr.user?.login },
        });
      } else if (pr.merged && action === 'closed') {
        await supabase.from('project_activity').insert({
          project_id: project.id, type: 'pr_merged',
          payload: { number: pr.number, title: pr.title, author: pr.user?.login },
        });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true, ignored: event });
  } catch (err) {
    console.error('[GH webhook] ERRO:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'erro processando webhook' });
    }
  }
};


export default router;
