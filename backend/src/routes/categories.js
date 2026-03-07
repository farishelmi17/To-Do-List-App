import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT id, name, sort_order, created_at
    FROM categories WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC
  `).all(req.user.id);
  res.json({ categories });
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name required' });
  }
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories WHERE user_id = ?').get(req.user.id);
  const result = db.prepare('INSERT INTO categories (user_id, name, sort_order) VALUES (?, ?, ?)').run(
    req.user.id, name.trim(), maxOrder.next
  );
  const category = db.prepare('SELECT id, name, sort_order, created_at FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(category);
});

router.get('/:id', (req, res) => {
  const category = db.prepare('SELECT id, name, sort_order, created_at FROM categories WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

router.patch('/:id', (req, res) => {
  const { name, sort_order } = req.body;
  const category = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const updates = [];
  const values = [];
  if (name !== undefined) { updates.push('name = ?'); values.push(String(name).trim()); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
  if (updates.length === 0) {
    const current = db.prepare('SELECT id, name, sort_order, created_at FROM categories WHERE id = ?').get(req.params.id);
    return res.json(current);
  }
  values.push(req.params.id);
  db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT id, name, sort_order, created_at FROM categories WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.status(204).send();
});

export default router;
