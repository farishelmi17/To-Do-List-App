import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const categories = await db.all(`
    SELECT id, name, sort_order, created_at
    FROM categories WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC
  `, [req.user.id]);
  res.json({ categories });
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name required' });
  }
  const maxOrder = await db.get('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories WHERE user_id = ?', [req.user.id]);
  const result = await db.run('INSERT INTO categories (user_id, name, sort_order) VALUES (?, ?, ?)', [req.user.id, name.trim(), maxOrder.next]);
  const category = await db.get('SELECT id, name, sort_order, created_at FROM categories WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(category);
});

router.get('/:id', async (req, res) => {
  const category = await db.get('SELECT id, name, sort_order, created_at FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

router.patch('/:id', async (req, res) => {
  const { name, sort_order } = req.body;
  const category = await db.get('SELECT id FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const updates = [];
  const values = [];
  if (name !== undefined) { updates.push('name = ?'); values.push(String(name).trim()); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
  if (updates.length === 0) {
    const current = await db.get('SELECT id, name, sort_order, created_at FROM categories WHERE id = ?', [req.params.id]);
    return res.json(current);
  }
  values.push(req.params.id);
  await db.run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
  const updated = await db.get('SELECT id, name, sort_order, created_at FROM categories WHERE id = ?', [req.params.id]);
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const result = await db.run('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.status(204).send();
});

export default router;
