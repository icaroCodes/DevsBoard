import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Origins that the browser frontend is allowed to issue mutating requests
// from. MUST stay in sync with the CORS config in server.js. The OAuth
// callbacks (also mounted on this backend) are GET-only, so they're not
// affected by this list.
const ALLOWED_EXACT_ORIGINS = new Set([
  'http://localhost:5173',
  'https://mydevsboard.vercel.app',
  'https://devsboard.com.br',
  'https://www.devsboard.com.br'
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  if (ALLOWED_EXACT_ORIGINS.has(origin)) return true;
  if (origin.startsWith('https://') && origin.endsWith('-mydevsboard.vercel.app')) return true;
  return false;
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defense for cookie-authenticated mutations.
 *
 * The auth middleware accepts either a Bearer token or the `accessToken`
 * cookie. The cookie is httpOnly + SameSite=none in production, which means a
 * cross-site form-submit or fetch with `credentials: include` will ride the
 * cookie to the backend. Without this middleware, ANY cross-origin attacker
 * page could POST/PUT/DELETE on behalf of a logged-in user.
 *
 * Mitigation strategy (defense in depth):
 *   1. Safe methods (GET/HEAD/OPTIONS) are always allowed — they shouldn't
 *      mutate state and they're not the CSRF target anyway.
 *   2. Requests carrying an explicit `Authorization: Bearer …` header are
 *      allowed. Browsers never set this automatically; only JS that the
 *      legitimate frontend ships does. Cross-site CSRF can't add it because
 *      of the same-origin policy.
 *   3. Cookie-auth mutations are rejected unless the Origin (or, as a
 *      legacy fallback, the Referer) belongs to a known frontend.
 *
 * Note: this middleware does NOT enforce auth itself — it just blocks
 * cross-origin cookie-replay before the route handler runs.
 */
export const csrfGuard = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const authHeader = req.headers.authorization;
  if (authHeader && /^Bearer\s+\S+/i.test(authHeader)) return next();

  // From here down, the request can only be authorized via the cookie. So
  // require a same-origin assertion from the browser.
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) return next();

  // Some browsers strip Origin on same-origin POSTs in rare edge cases.
  // Fall back to Referer if Origin is missing entirely (NOT if Origin is
  // present but bad — that would let an attacker omit it to bypass).
  if (!origin) {
    const referer = req.headers.referer;
    if (referer) {
      try {
        const refOrigin = new URL(referer).origin;
        if (isAllowedOrigin(refOrigin)) return next();
      } catch {
        // Malformed Referer — fall through to reject.
      }
    }
  }

  return res.status(403).json({
    error: 'csrf_blocked',
    message: 'Requisição rejeitada por proteção CSRF (origem não permitida).',
  });
};


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
