import supabase from '../database/connection.js';

export const interceptMembers = (entityType) => {
  return async (req, res, next) => {
    // Only intercept POST, PUT, DELETE
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
      return next();
    }

    try {
      // Find teamId. Depending on endpoint:
      // - Some endpoints might pass teamId in headers: req.headers['x-team-id']
      // - Tasks might have it in req.body.team_id (for POST)
      // Let's use the active team id parsed by auth middleware
      const teamId = req.teamId;
      if (!teamId) return next(); // Not a team action, it's a personal action

      // Check user role in this team
      const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', req.userId)
        .single();

      if (!member) return next();

      // If owner or admin, let them pass
      if (['owner', 'admin'].includes(member.role)) {
        return next();
      }

      // User is a 'member', intercept the action!
      
      let actionType = 'update';
      if (req.method === 'POST') actionType = 'create';
      if (req.method === 'DELETE') actionType = 'delete';

      // Parse entity_id from URL (e.g., /:id or just / if create)
      // req.path will be like "/" or "/123"
      let entityId = null;
      const match = req.path.match(/^\/([^/]+)/);
      if (match) {
        entityId = match[1];
      }

      // Create change request
      const { data: request, error } = await supabase
        .from('change_requests')
        .insert({
          team_id: teamId,
          user_id: req.userId,
          entity_type: entityType,
          entity_id: entityId,
          action_type: actionType,
          payload: req.body,
          status: 'pending'
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating change request:', error);
        return res.status(500).json({ error: 'Erro ao criar solicitação de alteração' });
      }

      return res.status(202).json({
        message: 'Solicitação de alteração enviada para aprovação.',
        is_change_request: true,
        request
      });
    } catch (err) {
      console.error(err);
      return next();
    }
  };
};
