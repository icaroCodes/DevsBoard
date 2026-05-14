import { supabaseAdmin as supabase } from '../database/connection.js';

// Permission model:
//   • Personal context (no team): always pass through.
//   • Team context, owner/admin: always pass through.
//   • Team context, member: can read (GET), create (POST) and edit (PUT/PATCH)
//     directly. DELETE is intercepted and queued as a change_request for an
//     owner/admin to approve. Team-level config (managed under /teams/*) is
//     guarded inline by the team routes themselves and is not affected here.
//
// Rationale: drag-and-drop, quick edits and creating items should feel
// frictionless for the whole team. Destructive actions are the only ones
// that need a second pair of eyes.
export const interceptMembers = (entityType) => {
  return async (req, res, next) => {
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) return next();

    // Only DELETE is restricted for members. Everything else flows through.
    if (req.method !== 'DELETE') return next();

    try {
      const teamId = req.teamId;
      if (!teamId) return next();

      const { data: member, error: memberErr } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', req.userId)
        .single();

      // Fail closed: if we can't confirm membership (DB error, missing row,
      // anything weird) we must NOT let the destructive action through. The
      // earlier `checksOwnership` middleware should already have rejected
      // non-members, so reaching here without a row is suspicious.
      if (memberErr || !member) {
        console.warn('[interceptMembers] membership lookup failed', { teamId, userId: req.userId, memberErr });
        return res.status(403).json({ error: 'Acesso negado: associação ao time não pôde ser confirmada.' });
      }

      if (['owner', 'admin'].includes(member.role)) {
        return next();
      }

      // Member trying to delete — queue as change_request
      let entityId = null;
      const match = req.path.match(/^\/([^/]+)/);
      if (match) entityId = match[1];

      const { data: request, error } = await supabase
        .from('change_requests')
        .insert({
          team_id: teamId,
          user_id: req.userId,
          entity_type: entityType,
          entity_id: entityId,
          action_type: 'delete',
          payload: req.body,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating change request:', error);
        return res.status(500).json({ error: 'Erro ao criar solicitação de exclusão' });
      }

      return res.status(202).json({
        message: 'Exclusão enviada para aprovação de um administrador.',
        is_change_request: true,
        request,
      });
    } catch (err) {
      // Fail closed on unexpected errors: a destructive request should never
      // slip through because of an exception we didn't anticipate.
      console.error('[interceptMembers] unexpected error', err);
      return res.status(500).json({ error: 'Erro ao validar permissões' });
    }
  };
};
