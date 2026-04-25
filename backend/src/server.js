import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/index.js';

import authRoutes from './routes/auth.js';
import githubRoutes from './routes/github.js';
import dashboardRoutes from './routes/dashboard.js';
import financesRoutes from './routes/finances.js';
import tasksRoutes from './routes/tasks.js';
import routinesRoutes from './routes/routines.js';
import goalsRoutes from './routes/goals.js';
import projectsRoutes from './routes/projects.js';
import projectTasksRoutes from './routes/project-tasks.js';
import projectGithubRoutes from './routes/project-github.js';
import settingsRoutes from './routes/settings.js';
import taskListsRoutes from './routes/task-lists.js';
import taskCardsRoutes from './routes/task-cards.js';
import taskBoardsRoutes from './routes/task-boards.js';
import teamsRoutes from './routes/teams.js';
import achievementsRoutes from './routes/achievements.js';
import sessionsRoutes from './routes/sessions.js';
import { interceptMembers } from './middleware/interceptMembers.js';
import { authenticate, checksOwnership } from './middleware/auth.js';
import { securityHeaders, apiRateLimiter } from './middleware/security.js';
import { updateDailyStreak } from './utils/streak.js';

const app = express();



app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(cookieParser());
app.use(cors({ 
  origin: ['http://localhost:5173', 'https://mydevsboard.vercel.app'],
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-team-id']
}));
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(apiRateLimiter);


app.use('/auth', authRoutes);
app.use('/auth/github', githubRoutes);
app.use('/project-github', projectGithubRoutes);


app.use(authenticate);


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
app.use('/project-board', projectTasksRoutes);
app.use('/settings', settingsRoutes);
app.use('/task-lists', interceptMembers('task_lists'), taskListsRoutes);
app.use('/task-cards', interceptMembers('task_cards'), taskCardsRoutes);
app.use('/task-boards', interceptMembers('task_boards'), taskBoardsRoutes);
app.use('/teams', teamsRoutes);
app.use('/achievements', achievementsRoutes);
app.use('/sessions', sessionsRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});


app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`DevsBoard API Segura rodando em http://localhost:${PORT}`);
});
