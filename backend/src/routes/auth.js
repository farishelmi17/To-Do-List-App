import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  try {
    const result = await db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email.trim().toLowerCase(), hash]);
    const user = await db.get('SELECT id, email, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ user: { id: user.id, email: user.email, created_at: user.created_at }, token });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = await db.get('SELECT id, email, password_hash, created_at FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ user: { id: user.id, email: user.email, created_at: user.created_at }, token });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
