import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseForRequest } from '../utils/supabaseClient.js';
import { authenticate } from '../middleware/auth.js';
import config from '../config/index.js';

const router = Router();


router.use(authenticate);




router.get('/', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    
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
        .select('id, name:display_name, email, avatar_url')
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
    const supabase = await supabaseForRequest(req);
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
    const supabase = await supabaseForRequest(req);
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
    const supabase = await supabaseForRequest(req);
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
    const supabase = await supabaseForRequest(req);
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
        .select('id, name:display_name, email, username, avatar_url')
        .eq('id', user_id)
        .maybeSingle();
      invitedUser = data || null;
    } else if (username) {
      const cleaned = String(username).trim().replace(/^@/, '').toLowerCase();
      const { data } = await supabase
        .from('users')
        .select('id, name:display_name, email, username, avatar_url')
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
      .select('name:display_name, email, avatar_url, username')
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

// =============================================================================
// Invite-by-link (revocable).
//
// Previously the token was a self-contained 7-day JWT with no DB row, which
// meant any leak (screenshot, paste, browser history) was uncurable until
// expiry. Now each link is backed by a row in `team_invite_links` keyed by
// the JWT's `jti`. Acceptance requires the row to exist, not be revoked, and
// not be past its `expires_at`. Owners/admins can list and revoke links.
// =============================================================================
router.post('/:id/invitations/links', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
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
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: insertErr } = await supabase
      .from('team_invite_links')
      .insert({
        jti,
        team_id: id,
        created_by: req.userId,
        role,
        expires_at: expiresAt.toISOString(),
      });
    if (insertErr) {
      console.error('Erro ao gravar invite link:', insertErr);
      return res.status(500).json({ error: 'Erro ao gerar link' });
    }

    const token = jwt.sign(
      { purpose: 'team_invite', team_id: id, role, invited_by: req.userId, jti },
      config.jwt.accessSecret,
      { expiresIn: '7d', jwtid: jti }
    );

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.status(201).json({
      token,
      url: `${frontend}/invite/${token}`,
      expires_in_days: 7,
      expires_at: expiresAt.toISOString(),
      jti,
      role,
    });
  } catch (err) {
    console.error('Erro ao gerar link de convite:', err);
    res.status(500).json({ error: 'Erro ao gerar link' });
  }
});

router.get('/:id/invitations/links', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const { id } = req.params;

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', req.userId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Apenas administradores podem ver links' });
    }

    const { data, error } = await supabase
      .from('team_invite_links')
      .select('jti, role, expires_at, revoked_at, created_at, created_by')
      .eq('team_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Erro ao listar links:', err);
    res.status(500).json({ error: 'Erro ao listar links' });
  }
});

router.post('/:id/invitations/links/:jti/revoke', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const { id, jti } = req.params;

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', req.userId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'Apenas administradores podem revogar' });
    }

    const { data, error } = await supabase
      .from('team_invite_links')
      .update({ revoked_at: new Date().toISOString(), revoked_by: req.userId })
      .eq('jti', jti)
      .eq('team_id', id)
      .is('revoked_at', null)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Link não encontrado ou já revogado' });
    }
    res.json({ ok: true, jti });
  } catch (err) {
    console.error('Erro ao revogar link:', err);
    res.status(500).json({ error: 'Erro ao revogar link' });
  }
});

// Authenticated. Trade an invite token for a team_members row. The token's
// JWT signature proves it came from us; we additionally require the matching
// `team_invite_links` row to still be active (not revoked, not expired) so
// leaked links can be cut off.
router.post('/invitations/accept-link', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
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

    if (decoded.purpose !== 'team_invite' || !decoded.team_id || !decoded.jti) {
      return res.status(400).json({ error: 'invite_link_invalid' });
    }

    // Look up the persisted row keyed by jti. This is what makes the link
    // revocable: even with a valid JWT signature, an attacker holding a
    // leaked token gets nothing once the row is revoked.
    const { data: linkRow, error: linkErr } = await supabase
      .from('team_invite_links')
      .select('jti, team_id, role, revoked_at, expires_at')
      .eq('jti', decoded.jti)
      .maybeSingle();

    if (linkErr || !linkRow) return res.status(400).json({ error: 'invite_link_invalid' });
    if (String(linkRow.team_id) !== String(decoded.team_id)) {
      return res.status(400).json({ error: 'invite_link_invalid' });
    }
    if (linkRow.revoked_at) return res.status(400).json({ error: 'invite_link_revoked' });
    if (linkRow.expires_at && new Date(linkRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'invite_link_expired' });
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
      return res.json({ already_member: true, team });
    }

    // Trust the persisted role over the JWT payload — if an admin generated
    // a "member" link and somehow the JWT carried "admin", the DB row wins.
    const role = ['admin', 'member'].includes(linkRow.role) ? linkRow.role : 'member';

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
    const supabase = await supabaseForRequest(req);
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
        .select('name:display_name, email, avatar_url')
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
    const supabase = await supabaseForRequest(req);
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
        .select('name:display_name, email, avatar_url')
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
    const supabase = await supabaseForRequest(req);
    
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
      .select('*, user:users(display_name, avatar_url), team:teams(name)')
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
    const supabase = await supabaseForRequest(req);
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
    const supabase = await supabaseForRequest(req);
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
    const supabase = await supabaseForRequest(req);
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
    const supabase = await supabaseForRequest(req);
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




// =============================================================================
// Change-request approval — security-critical.
//
// A member can only submit a change_request indirectly (today via
// `interceptMembers`, which only queues DELETEs). However, the approval
// handler accepts payloads as-is and was the only line of defense against:
//   1. Field injection: a payload claiming `is_premium=true`, `role='owner'`,
//      or shifting `user_id` to another user — silently rubber-stamped when
//      an admin clicks "approve".
//   2. Cross-team writes: an entity_id pointing at a row in a different team.
//   3. Arbitrary-table writes: a forged entity_type bypassing PostgREST's
//      table policies.
// We mitigate all three with: a per-entity column allowlist, forced ownership
// fields, an entity_type allowlist, and a target-row ownership check.
// =============================================================================
const ENTITY_WRITABLE_COLUMNS = {
  finances:    new Set(['category', 'description', 'amount', 'type', 'transaction_date']),
  tasks:       new Set(['title', 'description', 'priority', 'completed', 'alarm_time']),
  task_boards: new Set(['name', 'color']),
  task_lists:  new Set(['name', 'position', 'board_id']),
  task_cards:  new Set(['name', 'list_id', 'position', 'cover_url', 'due_date', 'completed', 'alarm_time', 'description']),
  routines:    new Set(['name', 'visual_type', 'position']),
  goals:       new Set(['name', 'type', 'deadline_type', 'deadline_date', 'target_value', 'year', 'completed']),
  projects:    new Set(['name', 'description', 'color', 'icon', 'cover_url', 'logo_url']),
};

const filterToAllowedColumns = (entityType, payload) => {
  const allowed = ENTITY_WRITABLE_COLUMNS[entityType];
  if (!allowed) return null;
  const filtered = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (allowed.has(k)) filtered[k] = v;
  }
  return filtered;
};

router.post('/change-requests/:id/approve', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const { id } = req.params;
    const { data: request } = await supabase.from('change_requests').select('*').eq('id', id).single();
    if (!request) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const { data: myMembership } = await supabase.from('team_members').select('role').eq('team_id', request.team_id).eq('user_id', req.userId).single();
    if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) return res.status(403).json({ error: 'Sem permissão' });

    if (request.status !== 'pending') return res.status(400).json({ error: 'Já processada' });

    // Reject unknown entity types up front — entity_type is used as a table
    // name. The allowlist is the only thing standing between us and an
    // attacker-chosen INSERT/UPDATE/DELETE target.
    if (!ENTITY_WRITABLE_COLUMNS[request.entity_type]) {
      return res.status(400).json({ error: 'Tipo de entidade inválido.' });
    }
    if (!['create', 'update', 'delete'].includes(request.action_type)) {
      return res.status(400).json({ error: 'Ação inválida.' });
    }

    const entity = request.entity_type;

    let updateErr = null;
    if (request.action_type === 'create') {
      // Strip every column not on the allowlist (defeats `is_premium`,
      // arbitrary FKs, `id` collisions, etc.). user_id / team_id are then
      // forced from the change_request row — NOT from the member's payload.
      const safe = filterToAllowedColumns(entity, request.payload);
      safe.user_id = request.user_id;
      safe.team_id = request.team_id;

      // Validate referenced parent rows still exist AND belong to the same
      // team. A member could otherwise queue a `task_lists` create with a
      // `board_id` from a team they no longer have access to.
      if (entity === 'task_lists' && safe.board_id) {
        const { data: board } = await supabase
          .from('task_boards')
          .select('id, team_id, user_id')
          .eq('id', safe.board_id)
          .maybeSingle();
        if (!board || (board.team_id ? board.team_id !== request.team_id : board.user_id !== request.user_id)) {
          await supabase.from('change_requests').update({ status: 'rejected' }).eq('id', id);
          return res.status(409).json({ error: 'O quadro referenciado não pertence a este time ou foi removido.' });
        }
      }
      if (entity === 'task_cards' && safe.list_id) {
        const { data: list } = await supabase
          .from('task_lists')
          .select('id, team_id, user_id')
          .eq('id', safe.list_id)
          .maybeSingle();
        if (!list || (list.team_id ? list.team_id !== request.team_id : list.user_id !== request.user_id)) {
          await supabase.from('change_requests').update({ status: 'rejected' }).eq('id', id);
          return res.status(409).json({ error: 'A coluna referenciada não pertence a este time ou foi removida.' });
        }
      }

      const { error } = await supabase.from(entity).insert(safe);
      updateErr = error;
    } else if (request.action_type === 'update') {
      // Strip non-allowed columns; never let user_id / team_id / id move via
      // a member-submitted update. Scope the UPDATE by team to neutralize a
      // forged entity_id pointing outside the requester's team.
      const safe = filterToAllowedColumns(entity, request.payload);
      if (Object.keys(safe).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });
      }
      const { error } = await supabase
        .from(entity)
        .update(safe)
        .eq('id', request.entity_id)
        .eq('team_id', request.team_id);
      updateErr = error;
    } else if (request.action_type === 'delete') {
      // Same scope-by-team protection: a member submitting a delete for an
      // entity_id outside their team must not affect that other row.
      const { error } = await supabase
        .from(entity)
        .delete()
        .eq('id', request.entity_id)
        .eq('team_id', request.team_id);
      updateErr = error;
    }

    if (updateErr) {
      console.error('Erro do banco ao processar aprovação:', updateErr);
      // Don't surface raw Supabase messages — they include table/column names.
      return res.status(400).json({ error: 'Falha ao aplicar solicitação.' });
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
    const supabase = await supabaseForRequest(req);
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