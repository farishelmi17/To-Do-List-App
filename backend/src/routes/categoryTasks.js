import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const category = await db.get('SELECT id FROM categories WHERE id = ? AND user_id = ?', [req.params.categoryId, req.user.id]);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const tasks = await db.all('SELECT * FROM tasks WHERE category_id = ? ORDER BY sort_order ASC, created_at ASC', [req.params.categoryId]);
  res.json({ tasks });
});

router.post('/', async (req, res) => {
  const category = await db.get('SELECT id FROM categories WHERE id = ? AND user_id = ?', [req.params.categoryId, req.user.id]);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const { title, due_date, reminder, important, notes } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title required' });
  }
  const maxOrder = await db.get('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM tasks WHERE category_id = ?', [req.params.categoryId]);
  const result = await db.run(`
    INSERT INTO tasks (category_id, title, due_date, reminder, important, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [req.params.categoryId, title.trim(), due_date || null, reminder || null, important ? 1 : 0, notes || null, maxOrder.next]);
  const task = await db.get('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(task);
});

export default router;
