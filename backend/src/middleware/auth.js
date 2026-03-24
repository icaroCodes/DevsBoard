import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.userId;
    
    // Suporte a Contexto de Equipe
    const teamIdStr = req.headers['x-team-id'];
    if (teamIdStr && teamIdStr !== 'null' && teamIdStr !== 'undefined') {
      req.teamId = parseInt(teamIdStr); // Converter para Number para bater com BIGINT no Banco
    } else {
      req.teamId = null;
    }
    
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
