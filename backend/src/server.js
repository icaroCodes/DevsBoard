import express from 'express';
import cors from 'cors';
import config from './config/index.js';

import authRoutes from './routes/auth.js';
import githubRoutes from './routes/github.js';
import dashboardRoutes from './routes/dashboard.js';
import financesRoutes from './routes/finances.js';
import tasksRoutes from './routes/tasks.js';
import routinesRoutes from './routes/routines.js';
import goalsRoutes from './routes/goals.js';
import projectsRoutes from './routes/projects.js';
import settingsRoutes from './routes/settings.js';
import taskListsRoutes from './routes/task-lists.js';
import taskCardsRoutes from './routes/task-cards.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'https://mydevsboard.vercel.app'] }));
app.use(express.json({ limit: '5mb' }));

// Rotas públicas
app.use('/auth', authRoutes);
app.use('/auth/github', githubRoutes);

// Rotas protegidas
app.use('/dashboard', dashboardRoutes);
app.use('/finances', financesRoutes);
app.use('/tasks', tasksRoutes);
app.use('/routines', routinesRoutes);
app.use('/goals', goalsRoutes);
app.use('/projects', projectsRoutes);
app.use('/settings', settingsRoutes);
app.use('/task-lists', taskListsRoutes);
app.use('/task-cards', taskCardsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Erro global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`DevsBoard API rodando em http://localhost:${PORT}`);
});
