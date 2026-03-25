import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(authenticate);

// ============================================
// GET /teams — Listar meus times
// ============================================
router.get('/', async (req, res) => {
  try {
    // Buscar times do usuário via team_members
    const { data: memberships, error: memErr } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', req.userId);

    if (memErr) throw memErr;

    if (!memberships || memberships.length === 0) {
      return res.json([]);
    }

    const teamIds = memberships.map(m => m.team_id);

    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds)
      .order('created_at', { ascending: false });

    if (teamsErr) throw teamsErr;

    // Enriquecer com role do usuário e contagem de membros
    const enriched = await Promise.all(teams.map(async (team) => {
      const membership = memberships.find(m => m.team_id === team.id);

      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);

      // Buscar membros com seus dados
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, role, joined_at')
        .eq('team_id', team.id);

      // Buscar info de cada membro
      const memberIds = members?.map(m => m.user_id) || [];
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', memberIds);

      const membersWithInfo = members?.map(m => ({
        ...m,
        user: users?.find(u => u.id === m.user_id) || null
      })) || [];

      return {
        ...team,
        my_role: membership?.role || 'member',
        member_count: count || 0,
        members: membersWithInfo
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Erro ao listar times:', err);
    res.status(500).json({ error: 'Erro ao listar times' });
  }
});

// ============================================
// POST /teams — Criar time/família
// ============================================
router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('type').isIn(['team', 'family']).withMessage('Tipo deve ser "team" ou "family"'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, type } = req.body;

    // Criar time
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({ name, type, owner_id: req.userId })
      .select('*')
      .single();

    if (teamErr) throw teamErr;

    // Adicionar criador como membro owner
    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: req.userId, role: 'owner' });

    if (memberErr) throw memberErr;

    res.status(201).json(team);
  } catch (err) {
    console.error('Erro ao criar time:', err);
    res.status(500).json({ error: 'Erro ao criar time' });
  }
});

// ============================================
// PUT /teams/:id — Atualizar time
// ============================================
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
], async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se é owner/admin
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', req.userId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Sem permissão para editar este time' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.type) updates.type = req.body.type;

    const { data: team, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    res.json(team);
  } catch (err) {
    console.error('Erro ao atualizar time:', err);
    res.status(500).json({ error: 'Erro ao atualizar time' });
  }
});

// ============================================
// DELETE /teams/:id — Deletar time
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Apenas owner pode deletar
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!team || team.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Apenas o criador pode deletar o time' });
    }

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar time:', err);
    res.status(500).json({ error: 'Erro ao deletar time' });
  }
});

// ============================================
// POST /teams/:id/invite — Convidar por email
// ============================================
router.post('/:id/invite', [
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { email } = req.body;

    // Verificar se é membro do time
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', req.userId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Você não é membro deste time' });
    }

    // Verificar se não está convidando a si mesmo
    const { data: selfUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.userId)
      .single();

    if (selfUser?.email === email) {
      return res.status(400).json({ error: 'Você não pode convidar a si mesmo' });
    }

    // Buscar usuário pelo email
    const { data: invitedUser } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (!invitedUser) {
      return res.status(404).json({ error: 'Nenhum usuário encontrado com este email' });
    }

    // Verificar se já é membro
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', id)
      .eq('user_id', invitedUser.id)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'Este usuário já é membro do time' });
    }

    // Verificar se já tem convite pendente
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('team_id', id)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return res.status(400).json({ error: 'Já existe um convite pendente para este email' });
    }

    // Criar convite
    const { data: invitation, error: invErr } = await supabase
      .from('team_invitations')
      .insert({
        team_id: id,
        invited_by: req.userId,
        invited_email: email,
        invited_user_id: invitedUser.id,
        status: 'pending'
      })
      .select('*')
      .single();

    if (invErr) throw invErr;

    // Buscar info do time e do remetente para retornar completo
    const { data: team } = await supabase
      .from('teams')
      .select('name, type')
      .eq('id', id)
      .single();

    const { data: inviter } = await supabase
      .from('users')
      .select('name, email, avatar_url')
      .eq('id', req.userId)
      .single();

    res.status(201).json({
      ...invitation,
      team,
      invited_by_user: inviter,
      invited_user: invitedUser
    });
  } catch (err) {
    console.error('Erro ao enviar convite:', err);
    res.status(500).json({ error: 'Erro ao enviar convite' });
  }
});

// ============================================
// GET /teams/invitations/inbox — Caixa de entrada
// ============================================
router.get('/invitations/inbox', async (req, res) => {
  try {
    // Buscar email do usuário
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.userId)
      .single();

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Buscar convites pendentes pelo email OU pelo user_id
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select('*')
      .or(`invited_email.eq.${user.email},invited_user_id.eq.${req.userId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enriquecer com dados do time e remetente
    const enriched = await Promise.all((invitations || []).map(async (inv) => {
      const { data: team } = await supabase
        .from('teams')
        .select('name, type, avatar_url')
        .eq('id', inv.team_id)
        .single();

      const { data: inviter } = await supabase
        .from('users')
        .select('name, email, avatar_url')
        .eq('id', inv.invited_by)
        .single();

      return {
        ...inv,
        team,
        invited_by_user: inviter
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Erro ao buscar convites:', err);
    res.status(500).json({ error: 'Erro ao buscar convites' });
  }
});

// ============================================
// GET /teams/invitations/sent — Convites enviados
// ============================================
router.get('/invitations/sent', async (req, res) => {
  try {
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('invited_by', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await Promise.all((invitations || []).map(async (inv) => {
      const { data: team } = await supabase
        .from('teams')
        .select('name, type')
        .eq('id', inv.team_id)
        .single();

      const { data: invitedUser } = await supabase
        .from('users')
        .select('name, email, avatar_url')
        .eq('email', inv.invited_email)
        .single();

      return {
        ...inv,
        team,
        invited_user: invitedUser
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Erro ao buscar convites enviados:', err);
    res.status(500).json({ error: 'Erro ao buscar convites enviados' });
  }
});

// ============================================
// GET /teams/change-requests/inbox — Caixa de Entrada de solicitações
// ============================================
router.get('/change-requests/inbox', async (req, res) => {
  try {
    // Buscar times que sou admin ou owner
    const { data: myMemberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', req.userId)
      .in('role', ['admin', 'owner']);

    if (!myMemberships || myMemberships.length === 0) {
      return res.json([]);
    }

    const teamIds = myMemberships.map(m => m.team_id);

    // Buscar change_requests pending
    const { data, error } = await supabase
      .from('change_requests')
      .select('*, user:users(name, avatar_url), team:teams(name)')
      .in('team_id', teamIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar solicitações:', err);
    res.status(500).json({ error: 'Erro ao buscar solicitações' });
  }
});

// ============================================
// POST /teams/invitations/:invitationId/accept — Aceitar convite
// ============================================
router.post('/invitations/:invitationId/accept', async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Buscar o convite
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    // Verificar se é o destinatário
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.userId)
      .single();

    if (invitation.invited_user_id !== req.userId && invitation.invited_email !== user?.email) {
      return res.status(403).json({ error: 'Este convite não é para você' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Este convite já foi processado' });
    }

    // Atualizar status do convite
    const { error: updateErr } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted', invited_user_id: req.userId })
      .eq('id', invitationId);

    if (updateErr) throw updateErr;

    // Adicionar como membro
    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: invitation.team_id, user_id: req.userId, role: 'member' });

    if (memberErr) throw memberErr;

    // Buscar o time atualizado
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('id', invitation.team_id)
      .single();

    res.json({ message: 'Convite aceito! Você agora faz parte do time.', team });
  } catch (err) {
    console.error('Erro ao aceitar convite:', err);
    res.status(500).json({ error: 'Erro ao aceitar convite' });
  }
});

// ============================================
// POST /teams/invitations/:invitationId/reject — Rejeitar convite
// ============================================
router.post('/invitations/:invitationId/reject', async (req, res) => {
  try {
    const { invitationId } = req.params;

    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.userId)
      .single();

    if (invitation.invited_user_id !== req.userId && invitation.invited_email !== user?.email) {
      return res.status(403).json({ error: 'Este convite não é para você' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Este convite já foi processado' });
    }

    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId);

    if (error) throw error;

    res.json({ message: 'Convite rejeitado.' });
  } catch (err) {
    console.error('Erro ao rejeitar convite:', err);
    res.status(500).json({ error: 'Erro ao rejeitar convite' });
  }
});

// ============================================
// DELETE /teams/:id/members/:userId — Remover membro
// ============================================
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;

    // Verificar se é admin/owner ou removendo a si mesmo
    const { data: myMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', req.userId)
      .single();

    if (!myMembership) {
      return res.status(403).json({ error: 'Você não é membro deste time' });
    }

    const isSelf = memberId === req.userId;
    const isAdminOrOwner = ['owner', 'admin'].includes(myMembership.role);

    if (!isSelf && !isAdminOrOwner) {
      return res.status(403).json({ error: 'Sem permissão para remover membros' });
    }

    // Não pode remover o owner
    const { data: targetMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', memberId)
      .single();

    if (targetMember?.role === 'owner' && !isSelf) {
      return res.status(403).json({ error: 'Não é possível remover o criador do time' });
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('user_id', memberId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover membro:', err);
    res.status(500).json({ error: 'Erro ao remover membro' });
  }
});

// ============================================
// PUT /teams/:id/members/:memberId/role — Alterar papel
// ============================================
router.put('/:id/members/:memberId/role', async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Role inválida' });

    const { data: myMembership } = await supabase.from('team_members').select('role').eq('team_id', id).eq('user_id', req.userId).single();
    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) return res.status(403).json({ error: 'Sem permissão' });

    const { data: targetMembership } = await supabase.from('team_members').select('role').eq('team_id', id).eq('user_id', memberId).single();
    if (targetMembership?.role === 'owner') return res.status(403).json({ error: 'Não é possível alterar papel do dono' });

    const { error } = await supabase.from('team_members').update({ role }).eq('team_id', id).eq('user_id', memberId);
    if (error) throw error;
    res.json({ message: 'Papel atualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar papel do membro' });
  }
});

// ============================================
// POST /teams/change-requests/:id/approve — Approve change request
// ============================================
router.post('/change-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: request } = await supabase.from('change_requests').select('*').eq('id', id).single();
    if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const { data: myMembership } = await supabase.from('team_members').select('role').eq('team_id', request.team_id).eq('user_id', req.userId).single();
    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) return res.status(403).json({ error: 'Sem permissão' });

    if (request.status !== 'pending') return res.status(400).json({ error: 'Já processada' });

    let finalPayload = { ...(request.payload || {}) };
    
    // Injetar contexto ausente (que normalmente é inserido pela rota principal)
    if (request.action_type === 'create') {
      const entity = request.entity_type;
      
      // Apenas injeta em tabelas que sabemos que usam user_id e team_id
      if (['finances', 'routines', 'goals'].includes(entity)) {
        finalPayload.team_id = request.team_id;
        finalPayload.user_id = request.user_id;
      }
      
      if (entity === 'projects') {
        finalPayload.user_id = request.user_id; // Projects usa user_id
      }
      
      // tasks, task_lists, task_boards normalmente usam board_id e project_id (já vindo no payload)
    }

    let updateErr = null;
    if (request.action_type === 'create') {
      const { error } = await supabase.from(request.entity_type).insert(finalPayload);
      updateErr = error;
    } else if (request.action_type === 'update') {
      const { error } = await supabase.from(request.entity_type).update(finalPayload).eq('id', request.entity_id);
      updateErr = error;
    } else if (request.action_type === 'delete') {
      const { error } = await supabase.from(request.entity_type).delete().eq('id', request.entity_id);
      updateErr = error;
    }

    if (updateErr) {
      console.error('Erro do banco ao processar aprovação:', updateErr);
      return res.status(400).json({ error: 'Falha técnica ao salvar no banco. ' + (updateErr.message || JSON.stringify(updateErr)) });
    }

    await supabase.from('change_requests').update({ status: 'approved' }).eq('id', id);
    res.json({ message: 'Solicitação aprovada e aplicada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro fatal ao aprovar solicitação' });
  }
});

// ============================================
// POST /teams/change-requests/:id/reject — Reject change request
// ============================================
router.post('/change-requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: request } = await supabase.from('change_requests').select('*').eq('id', id).single();
    if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const { data: myMembership } = await supabase.from('team_members').select('role').eq('team_id', request.team_id).eq('user_id', req.userId).single();
    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) return res.status(403).json({ error: 'Sem permissão' });

    if (request.status !== 'pending') return res.status(400).json({ error: 'Já processada' });

    await supabase.from('change_requests').update({ status: 'rejected' }).eq('id', id);
    res.json({ message: 'Rejeitada' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao rejeitar' });
  }
});

export default router;
