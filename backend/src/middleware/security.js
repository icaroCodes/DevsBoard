import rateLimit from 'express-rate-limit';
import helmet from 'helmet';


export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { error: 'Muitas tentativas de acesso. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});


export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 100, 
  message: { error: 'Limite de requisições excedido.' },
});


export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
});
