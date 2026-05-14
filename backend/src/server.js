import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/index.js';

import authRoutes from './routes/auth.js';
import githubRoutes from './routes/github.js';
import googleRoutes from './routes/google.js';
import dashboardRoutes from './routes/dashboard.js';
import financesRoutes from './routes/finances.js';
import tasksRoutes from './routes/tasks.js';
import routinesRoutes from './routes/routines.js';
import goalsRoutes from './routes/goals.js';
import projectsRoutes from './routes/projects.js';
import settingsRoutes from './routes/settings.js';
import taskBoardsRoutes from './routes/task-boards.js';
import taskListsRoutes from './routes/task-lists.js';
import taskCardsRoutes from './routes/task-cards.js';
import teamsRoutes from './routes/teams.js';
import achievementsRoutes from './routes/achievements.js';
import sessionsRoutes from './routes/sessions.js';
import publicRoutes from './routes/public.js';
import alarmsRoutes from './routes/alarms.js';
import profilesRoutes from './routes/profiles.js';
import { interceptMembers } from './middleware/interceptMembers.js';
import { authenticate, checksOwnership } from './middleware/auth.js';
import { securityHeaders, apiRateLimiter, authRateLimiter, csrfGuard } from './middleware/security.js';
import { updateDailyStreak } from './utils/streak.js';

const app = express();



app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(cookieParser());
const allowedOrigins = [
  'http://localhost:5173',
  'https://mydevsboard.vercel.app',
  'https://devsboard.com.br',
  'https://www.devsboard.com.br'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.startsWith('https://') && origin.endsWith('-mydevsboard.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-team-id']
}));

// Body-size limits per route prefix. The previous global 50 MB cap made every
// endpoint (including unauthenticated ones like /public/feedbacks) a free
// memory-exhaustion target. Path-specific parsers below short-circuit before
// the 1 MB default kicks in.
app.use('/settings', express.json({ limit: '15mb' }));   // avatar + wallpaper + audio uploads
app.use('/projects', express.json({ limit: '10mb' }));   // logos, covers, asset images, comment attachments
app.use('/public/feedbacks', express.json({ limit: '4mb' })); // optional 2 MB photo (base64-inflated ~2.7 MB)
app.use(express.json({ limit: '1mb' }));                 // default for every other route

app.use(apiRateLimiter);


// Auth surfaces get a tighter limiter on top of the global one. Without this,
// /auth/refresh, /auth/exchange and the OAuth callbacks rely only on the
// 100 req/min global cap — wide open to credential / refresh-token brute force.
app.use('/auth', authRateLimiter, authRoutes);
app.use('/auth/github', authRateLimiter, githubRoutes);
app.use('/auth/google', authRateLimiter, googleRoutes);
app.use('/public', publicRoutes);


app.use(authenticate);

// CSRF guard for cookie-auth mutations. Mounted AFTER authenticate (so we
// know whether a Bearer was supplied) and BEFORE the route handlers. GETs and
// any request that supplies its own Authorization header pass straight
// through. See middleware/security.js for the threat model.
app.use(csrfGuard);


app.use((req, _res, next) => {
  if (req.userId) updateDailyStreak(req.userId);
  next();
});

app.use(checksOwnership);

app.use('/dashboard', dashboardRoutes);
app.use('/finances', interceptMembers('finances'), financesRoutes);
app.use('/tasks', interceptMembers('tasks'), tasksRoutes);
app.use('/routines', interceptMembers('routines'), routinesRoutes);
app.use('/goals', interceptMembers('goals'), goalsRoutes);
app.use('/projects', interceptMembers('projects'), projectsRoutes);
app.use('/settings', settingsRoutes);
app.use('/profiles', profilesRoutes);
app.use('/task-boards', interceptMembers('task_boards'), taskBoardsRoutes);
app.use('/task-lists', interceptMembers('task_lists'), taskListsRoutes);
app.use('/task-cards', interceptMembers('task_cards'), taskCardsRoutes);
app.use('/teams', teamsRoutes);
app.use('/achievements', achievementsRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/alarms', alarmsRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});


// Central error handler. Production must NEVER leak stack traces, SQL
// fragments, or Supabase error payloads to the client — those routinely
// contain table/column names and constraint identifiers an attacker can use
// to map the schema. Internally we log the full error; externally we send a
// generic message keyed off well-known status conditions.
app.use((err, req, res, _next) => {
  const requestId = Math.random().toString(36).slice(2, 10);

  // Log internally with as much context as we want. Do NOT include req.body
  // — it can contain credentials, base64 uploads, and PII.
  console.error('[error]', {
    requestId,
    method: req.method,
    path: req.path,
    userId: req.userId || null,
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
  });

  // express.json() throws SyntaxError for malformed bodies and a 413-class
  // error when the body exceeds the route limit.
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_too_large', requestId });
  }
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'invalid_json', requestId });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.', requestId });
  }

  // Default — never echo `err.message` to the client. The requestId lets
  // support correlate a complaint with the server log.
  res.status(500).json({ error: 'Erro interno do servidor', requestId });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`DevsBoard API Segura rodando em http://localhost:${PORT}`);
});
