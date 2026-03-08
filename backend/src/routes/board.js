import { Router } from 'express';
import db, { dbMode } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const categories = await db.all(`
    SELECT id, name, sort_order, created_at
    FROM categories WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC
  `, [req.user.id]);
  const categoryIds = categories.map((c) => c.id);
  const placeholders = categoryIds.map(() => '?').join(',');
  const tasks = categoryIds.length
    ? await db.all(
        `SELECT * FROM tasks WHERE category_id IN (${placeholders}) ORDER BY category_id, sort_order ASC, created_at ASC`,
        categoryIds
      )
    : [];
  const tasksByCategory = {};
  for (const t of tasks) {
    if (!tasksByCategory[t.category_id]) tasksByCategory[t.category_id] = [];
    tasksByCategory[t.category_id].push(t);
  }
  const result = categories.map((c) => ({
    id: c.id,
    name: c.name,
    sort_order: c.sort_order,
    created_at: c.created_at,
    tasks: (tasksByCategory[c.id] || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }));
  res.json({ categories: result });
});

/** Today Focus: tasks the user pinned for today. Clears automatically (we only return where focused_date = today). */
router.get('/today-focus', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db.all(`
    SELECT t.id, t.category_id, t.title, t.completed, t.due_date, t.important, t.notes, c.name AS category_name
    FROM today_focus f
    JOIN tasks t ON t.id = f.task_id
    JOIN categories c ON c.id = t.category_id
    WHERE f.user_id = ? AND f.focused_date = ?
    ORDER BY t.created_at ASC
  `, [req.user.id, today]);
  res.json({ tasks: rows });
});

router.post('/today-focus', async (req, res) => {
  const { task_id } = req.body || {};
  if (!task_id) return res.status(400).json({ error: 'task_id required' });
  const task = await db.get('SELECT id, category_id FROM tasks WHERE id = ?', [task_id]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const cat = await db.get('SELECT user_id FROM categories WHERE id = ?', [task.category_id]);
  if (!cat || cat.user_id !== req.user.id) return res.status(403).json({ error: 'Not your task' });
  if (dbMode === 'pg') {
    await db.run(`
      INSERT INTO today_focus (user_id, task_id, focused_date) VALUES (?, ?, CURRENT_DATE)
      ON CONFLICT (user_id, task_id) DO UPDATE SET focused_date = CURRENT_DATE
    `, [req.user.id, task_id]);
  } else {
    await db.run(`INSERT OR REPLACE INTO today_focus (user_id, task_id, focused_date) VALUES (?, ?, date('now'))`, [req.user.id, task_id]);
  }
  res.json({ ok: true });
});

router.delete('/today-focus/:taskId', async (req, res) => {
  const taskId = req.params.taskId;
  const result = await db.run('DELETE FROM today_focus WHERE user_id = ? AND task_id = ?', [req.user.id, taskId]);
  if (result.changes === 0) return res.status(404).json({ error: 'Not in today focus' });
  res.json({ ok: true });
});

export default router;
