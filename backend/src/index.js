import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import boardRoutes from './routes/board.js';
import tasksRoutes from './routes/tasks.js';
import categoryTasksRoutes from './routes/categoryTasks.js';
import './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories/:categoryId/tasks', categoryTasksRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/tasks', tasksRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
