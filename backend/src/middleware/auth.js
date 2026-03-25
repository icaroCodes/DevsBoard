import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import supabase from '../database/connection.js';

export const authenticate = (req, res, next) => {
  // Prefer cookies for security (HttpOnly)
  let token = req.cookies?.accessToken;

  // Fallback for current clients or API testing
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    req.userId = decoded.userId;
    
    // Team Context
    const teamIdStr = req.headers['x-team-id'];
    if (teamIdStr && teamIdStr !== 'null' && teamIdStr !== 'undefined') {
      req.teamId = parseInt(teamIdStr);
    } else {
      req.teamId = null;
    }
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Assinatura expirada' });
    }
    return res.status(401).json({ error: 'Sessão inválida' });
  }
};

/**
 * Anti-IDOR: Garante que o usuário pertence ao time solicitado
 */
export const checksOwnership = async (req, res, next) => {
  if (!req.teamId) return next();

  try {
    const { data: member, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', req.teamId)
      .eq('user_id', req.userId)
      .single();

    if (error || !member) {
      return res.status(403).json({ error: 'Acesso negado: Você não pertence a este time.' });
    }

    req.userRole = member.role;
    next();
  } catch (err) {
    console.error('[Ownership Check Error]', err);
    res.status(500).json({ error: 'Erro ao validar permissões' });
  }
};
