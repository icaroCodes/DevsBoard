import supabase from '../database/connection.js';

export const interceptMembers = (entityType) => {
  return async (req, res, next) => {
    
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
      return next();
    }

    try {
      
      
      
      
      const teamId = req.teamId;
      if (!teamId) return next(); 

      
      const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', req.userId)
        .single();

      if (!member) return next();

      
      if (['owner', 'admin'].includes(member.role)) {
        return next();
      }

      
      
      let actionType = 'update';
      if (req.method === 'POST') actionType = 'create';
      if (req.method === 'DELETE') actionType = 'delete';

      
      
      let entityId = null;
      const match = req.path.match(/^\/([^/]+)/);
      if (match) {
        entityId = match[1];
      }

      
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
