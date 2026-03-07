import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', (req, res) => {
  const category = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(req.params.categoryId, req.user.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const tasks = db.prepare('SELECT * FROM tasks WHERE category_id = ? ORDER BY sort_order ASC, created_at ASC').all(req.params.categoryId);
  res.json({ tasks });
});

router.post('/', (req, res) => {
  const category = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(req.params.categoryId, req.user.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const { title, due_date, reminder, important, notes } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title required' });
  }
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM tasks WHERE category_id = ?').get(req.params.categoryId);
  const result = db.prepare(`
    INSERT INTO tasks (category_id, title, due_date, reminder, important, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.categoryId,
    title.trim(),
    due_date || null,
    reminder || null,
    important ? 1 : 0,
    notes || null,
    maxOrder.next
  );
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

export default router;
