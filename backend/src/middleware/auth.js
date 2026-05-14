import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { supabaseAdmin as supabase } from '../database/connection.js';

export const authenticate = (req, res, next) => {
  
  let token = req.cookies?.accessToken;

  
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

    // Preserva o ID como string: o tipo real da coluna `teams.id` pode ser
    // BIGINT ou UUID, e o Supabase/PostgREST coage strings pra ambos.
    // `parseInt` em UUID quebra (retorna NaN), então mantemos cru.
    //
    // IMPORTANT: the x-team-id header is attacker-controlled. We park the
    // raw value on `req._unverifiedTeamId` and ONLY promote it to
    // `req.teamId` after `checksOwnership` confirms membership. Any route
    // mounted before that middleware (or any code that reads `req.teamId`
    // directly) will see `null` until the check has passed — making it
    // impossible to write a route that trusts the header by mistake.
    const teamIdStr = req.headers['x-team-id'];
    if (teamIdStr && teamIdStr !== 'null' && teamIdStr !== 'undefined') {
      req._unverifiedTeamId = String(teamIdStr);
    } else {
      req._unverifiedTeamId = null;
    }
    req.teamId = null;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Assinatura expirada' });
    }
    return res.status(401).json({ error: 'Sessão inválida' });
  }
};


export const checksOwnership = async (req, res, next) => {
  // No team header → personal context. Make doubly sure req.teamId stays null
  // even if upstream middleware ever sets it.
  if (!req._unverifiedTeamId) {
    req.teamId = null;
    return next();
  }

  try {
    const { data: member, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', req._unverifiedTeamId)
      .eq('user_id', req.userId)
      .single();

    if (error || !member) {
      // Do NOT promote the header value. Keep `req.teamId` null so any
      // accidental downstream read can't operate on an unverified team.
      return res.status(403).json({ error: 'Acesso negado: Você não pertence a este time.' });
    }

    req.teamId = req._unverifiedTeamId;
    req.userRole = member.role;
    next();
  } catch (err) {
    console.error('[Ownership Check Error]', err);
    res.status(500).json({ error: 'Erro ao validar permissões' });
  }
};
