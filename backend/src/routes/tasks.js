import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/completed', async (req, res) => {
  const tasks = await db.all(`
    SELECT t.id, t.category_id, t.title, t.completed, t.due_date, t.reminder, t.important, t.notes, t.sort_order, t.created_at, t.updated_at,
           c.name AS category_name
    FROM tasks t
    JOIN categories c ON c.id = t.category_id
    WHERE c.user_id = ? AND t.completed = 1
    ORDER BY t.updated_at DESC
  `, [req.user.id]);
  res.json({ tasks });
});

router.get('/:id', async (req, res) => {
  const task = await db.get(`
    SELECT t.*, c.name AS category_name FROM tasks t
    JOIN categories c ON c.id = t.category_id WHERE t.id = ? AND c.user_id = ?
  `, [req.params.id, req.user.id]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.patch('/:id', async (req, res) => {
  const task = await db.get(`
    SELECT t.id, t.category_id FROM tasks t
    JOIN categories c ON c.id = t.category_id WHERE t.id = ? AND c.user_id = ?
  `, [req.params.id, req.user.id]);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, completed, due_date, reminder, important, notes, sort_order } = req.body;
  const updates = ['updated_at = CURRENT_TIMESTAMP'];
  const values = [];
  if (title !== undefined) { updates.push('title = ?'); values.push(String(title).trim()); }
  if (completed !== undefined) { updates.push('completed = ?'); values.push(completed ? 1 : 0); }
  if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date || null); }
  if (reminder !== undefined) { updates.push('reminder = ?'); values.push(reminder || null); }
  if (important !== undefined) { updates.push('important = ?'); values.push(important ? 1 : 0); }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes == null ? null : String(notes)); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }

  values.push(req.params.id);
  await db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
  const updated = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const result = await db.run(`
    DELETE FROM tasks WHERE id = ? AND category_id IN (SELECT id FROM categories WHERE user_id = ?)
  `, [req.params.id, req.user.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.status(204).send();
});

export default router;
