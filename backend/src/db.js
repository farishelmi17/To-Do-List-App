import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'todos.sqlite');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    due_date TEXT,
    reminder TEXT,
    important INTEGER DEFAULT 0,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS today_focus (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    focused_date TEXT NOT NULL,
    PRIMARY KEY (user_id, task_id)
  );

  CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
  CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS idx_today_focus_user_date ON today_focus(user_id, focused_date);
`);

// Migration: existing DB with lists -> tasks with category_id only
try {
  db.prepare('SELECT list_id FROM tasks LIMIT 1').get();
  // Old schema: tasks have list_id. Ensure each user has a category, then migrate.
  const listUserIds = db.prepare('SELECT DISTINCT user_id FROM lists').all().map((r) => r.user_id);
  for (const uid of listUserIds) {
    const hasCat = db.prepare('SELECT 1 FROM categories WHERE user_id = ? LIMIT 1').get(uid);
    if (!hasCat) {
      db.prepare('INSERT INTO categories (user_id, name, sort_order) VALUES (?, ?, 0)').run(uid, 'Uncategorized');
    }
  }
  db.exec(`
    CREATE TABLE tasks_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      due_date TEXT,
      reminder TEXT,
      important INTEGER DEFAULT 0,
      notes TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO tasks_new (id, category_id, title, completed, due_date, reminder, important, notes, sort_order, created_at, updated_at)
    SELECT t.id, COALESCE(l.category_id, (SELECT id FROM categories WHERE user_id = l.user_id LIMIT 1)), t.title, t.completed, t.due_date, t.reminder, t.important, t.notes, t.sort_order, t.created_at, t.updated_at
    FROM tasks t JOIN lists l ON t.list_id = l.id;
    DROP TABLE tasks;
    ALTER TABLE tasks_new RENAME TO tasks;
    DROP TABLE IF EXISTS lists;
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id)');
} catch (_) {
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id)');
  } catch (_) {}
}

export default db;
