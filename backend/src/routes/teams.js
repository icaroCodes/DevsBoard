import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';
import config from '../config/index.js';

const router = Router();


router.use(authenticate);




router.get('/', async (req, res) => {
  try {
    
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

    
    const enriched = await Promise.all(teams.map(async (team) => {
      const membership = memberships.find(m => m.team_id === team.id);

      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);

      
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, role, joined_at')
        .eq('team_id', team.id);

      
      const memberIds = members?.map(m => m.user_id) || [];
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name as name, email, avatar_url')
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




router.post('/', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('type').isIn(['team', 'family']).withMessage('Tipo deve ser "team" ou "family"'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, type } = req.body;

    
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .insert({ name, type, owner_id: req.userId })
      .select('*')
      .single();

    if (teamErr) throw teamErr;

    
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




router.put('/:id', [
  body('name').optional().trim().notEmpty(),
], async (req, res) => {
  try {
    const { id } = req.params;

    
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




router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    
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




// Phase 4: invite by username or user_id. Username is the
// preferred form because it's stable and unique.
router.post('/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, user_id } = req.body || {};
    if (!username && !user_id) {
      return res.status(400).json({ error: 'Forneça username ou user_id' });
    }

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', req.userId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Você não é membro deste time' });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Apenas administradores podem convidar membros' });
    }

    // Resolve the invited user. Order: user_id (most specific) → username
    // → email. We *do not* fall back from one to the next within a single
    // request; the caller picks the mode.
    let invitedUser = null;

    if (user_id) {
      const { data } = await supabase
        .from('users')
        .select('id, display_name as name, email, username, avatar_url')
        .eq('id', user_id)
        .maybeSingle();
      invitedUser = data || null;
    } else if (username) {
      const cleaned = String(username).trim().replace(/^@/, '').toLowerCase();
      const { data } = await supabase
        .from('users')
        .select('id, display_name as name, email, username, avatar_url')
        .ilike('username', cleaned)
        .maybeSingle();
      invitedUser = data || null;
      if (!invitedUser) {
        return res.status(404).json({ error: 'username_not_found' });
      }
    }

    if (invitedUser.id === req.userId) {
      return res.status(400).json({ error: 'Você não pode convidar a si mesmo' });
    }

    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', id)
      .eq('user_id', invitedUser.id)
      .maybeSingle();

    if (existingMember) {
      return res.status(400).json({ error: 'Este usuário já é membro do time' });
    }

    const { data: existingInvite } = await supabase
      .from('team_invites')
      .select('id')
      .eq('team_id', id)
      .eq('invited_user_id', invitedUser.id)
      .maybeSingle();

    if (existingInvite) {
      return res.status(400).json({ error: 'Já existe um convite pendente para este usuário' });
    }

    const { data: invitation, error: invErr } = await supabase
      .from('team_invites')
      .insert({
        team_id: id,
        invited_by: req.userId,
        invited_username: invitedUser.username,
        invited_user_id: invitedUser.id,
      })
      .select('*')
      .single();

    if (invErr) throw invErr;

    const { data: team } = await supabase
      .from('teams')
      .select('name, type')
      .eq('id', id)
      .single();

    const { data: inviter } = await supabase
      .from('users')
      .select('display_name as name, email, avatar_url, username')
      .eq('id', req.userId)
      .single();

    res.status(201).json({
      ...invitation,
      team,
      invited_by_user: inviter,
      invited_user: invitedUser,
    });
  } catch (err) {
    console.error('Erro ao enviar convite:', err);
    res.status(500).json({ error: 'Erro ao enviar convite' });
  }
});

// Phase 4: invite-by-link. Admin generates a signed token; anyone with
// the link can join by hitting POST /teams/invitations/accept-link
// authenticated. Token is a JWT signed with the same access secret —
// no DB row, so it's not revocable. 7-day TTL.
router.post('/:id/invitations/links', async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.body?.role && ['admin', 'member'].includes(req.body.role)
      ? req.body.role
      : 'member';

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', req.userId)
      .single();

    if (!membership) return res.status(403).json({ error: 'Você não é membro deste time' });
    if (!['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Apenas administradores podem gerar links' });
    }

    // Don't let admins generate "owner" links — only one owner per team,
    // and ownership transfer should be explicit, not via a stale link.
    const token = jwt.sign(
      { purpose: 'team_invite', team_id: id, role, invited_by: req.userId },
      config.jwt.accessSecret,
      { expiresIn: '7d' }
    );

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.status(201).json({
      token,
      url: `${frontend}/invite/${token}`,
      expires_in_days: 7,
      role,
    });
  } catch (err) {
    console.error('Erro ao gerar link de convite:', err);
    res.status(500).json({ error: 'Erro ao gerar link' });
  }
});

// Authenticated. Trade an invite token for a team_members row. The token's
// JWT signature proves it came from us; we still re-check membership and
// team existence in case the team was deleted after the link was issued.
router.post('/invitations/accept-link', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token_missing' });

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'invite_link_expired' });
      }
      return res.status(400).json({ error: 'invite_link_invalid' });
    }

    if (decoded.purpose !== 'team_invite' || !decoded.team_id) {
      return res.status(400).json({ error: 'invite_link_invalid' });
    }

    const { data: team } = await supabase
      .from('teams')
      .select('id, name, type')
      .eq('id', decoded.team_id)
      .maybeSingle();
    if (!team) return res.status(410).json({ error: 'team_not_found' });

    const { data: existing } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('team_id', team.id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (existing) {
      // Idempotent: already a member, just acknowledge.
      return res.json({ already_member: true, team });
    }

    const role = ['admin', 'member'].includes(decoded.role) ? decoded.role : 'member';

    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: req.userId, role });
    if (memberErr) throw memberErr;

    res.status(201).json({ already_member: false, team, role });
  } catch (err) {
    console.error('Erro ao aceitar link:', err);
    res.status(500).json({ error: 'Erro ao aceitar convite' });
  }
});




router.get('/invitations/inbox', async (req, res) => {
  try {
    const { data: invitations, error } = await supabase
      .from('team_invites')
      .select('*')
      .eq('invited_user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    
    const enriched = await Promise.all((invitations || []).map(async (inv) => {
      const { data: team } = await supabase
        .from('teams')
        .select('name, type, avatar_url')
        .eq('id', inv.team_id)
        .single();

      const { data: inviter } = await supabase
        .from('users')
        .select('display_name as name, email, avatar_url')
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




router.get('/invitations/sent', async (req, res) => {
  try {
    const { data: invitations, error } = await supabase
      .from('team_invites')
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
        .select('display_name as name, email, avatar_url')
        .eq('id', inv.invited_user_id)
        .single();

      return {
        ...inv,
        team,
        invited_user: invitedUser || null
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Erro ao buscar convites enviados:', err);
    res.status(500).json({ error: 'Erro ao buscar convites enviados' });
  }
});




router.get('/change-requests/inbox', async (req, res) => {
  try {
    
    const { data: myMemberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', req.userId)
      .in('role', ['admin', 'owner']);

    if (!myMemberships || myMemberships.length === 0) {
      return res.json([]);
    }

    const teamIds = myMemberships.map(m => m.team_id);

    
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




router.post('/invitations/:invitationId/accept', async (req, res) => {
  try {
    const { invitationId } = req.params;

    
    const { data: invitation } = await supabase
      .from('team_invites')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (invitation.invited_user_id !== req.userId) {
      return res.status(403).json({ error: 'Este convite não é para você' });
    }
    
    // We just insert the member. If successful, delete the invite
    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: invitation.team_id, user_id: req.userId, role: 'member' });

    if (memberErr) throw memberErr;
    
    const { error: updateErr } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', invitationId);

    if (updateErr) throw updateErr;

    
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




router.post('/invitations/:invitationId/reject', async (req, res) => {
  try {
    const { invitationId } = req.params;

    const { data: invitation } = await supabase
      .from('team_invites')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (invitation.invited_user_id !== req.userId) {
      return res.status(403).json({ error: 'Este convite não é para você' });
    }

    const { error } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;

    res.json({ message: 'Convite rejeitado.' });
  } catch (err) {
    console.error('Erro ao rejeitar convite:', err);
    res.status(500).json({ error: 'Erro ao rejeitar convite' });
  }
});




router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;

    
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




router.post('/change-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: request } = await supabase.from('change_requests').select('*').eq('id', id).single();
    if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const { data: myMembership } = await supabase.from('team_members').select('role').eq('team_id', request.team_id).eq('user_id', req.userId).single();
    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) return res.status(403).json({ error: 'Sem permissão' });

    if (request.status !== 'pending') return res.status(400).json({ error: 'Já processada' });

    let finalPayload = { ...(request.payload || {}) };

    if (request.action_type === 'create') {
      const entity = request.entity_type;

      // Entities scoped to a team must always carry both user_id (creator)
      // and team_id (visibility scope used by NOT NULL constraints and the
      // Supabase Realtime team channel filter).
      const TEAM_SCOPED_ENTITIES = [
        'finances', 'routines', 'goals', 'projects',
        'tasks', 'task_boards', 'task_lists', 'task_cards',
      ];

      if (TEAM_SCOPED_ENTITIES.includes(entity)) {
        finalPayload.user_id = request.user_id;
        finalPayload.team_id = request.team_id;
      }

      // Validate referenced parent rows still exist before attempting the
      // INSERT. A change_request may sit in the inbox for a while; the
      // referenced board/list could have been deleted in the meantime,
      // which would surface as a confusing FK error.
      if (entity === 'task_lists' && finalPayload.board_id) {
        const { data: board } = await supabase
          .from('task_boards')
          .select('id')
          .eq('id', finalPayload.board_id)
          .maybeSingle();
        if (!board) {
          await supabase.from('change_requests')
            .update({ status: 'rejected' })
            .eq('id', id);
          return res.status(409).json({
            error: 'O quadro referenciado não existe mais. Solicitação descartada.',
          });
        }
      }
      if (entity === 'task_cards' && finalPayload.list_id) {
        const { data: list } = await supabase
          .from('task_lists')
          .select('id')
          .eq('id', finalPayload.list_id)
          .maybeSingle();
        if (!list) {
          await supabase.from('change_requests')
            .update({ status: 'rejected' })
            .eq('id', id);
          return res.status(409).json({
            error: 'A coluna referenciada não existe mais. Solicitação descartada.',
          });
        }
      }
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