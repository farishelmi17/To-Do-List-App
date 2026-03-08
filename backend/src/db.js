/**
 * Database layer: Postgres (when DATABASE_URL is set) or SQLite (local dev).
 * Exposes async get(), all(), run() with ? placeholders; Postgres uses $1, $2 internally.
 */

function toPgParams(sql) {
  let n = 0;
  const out = sql.replace(/\?/g, () => `$${++n}`);
  return out;
}

let dbMode = 'sqlite';
let pgPool = null;
let sqliteDb = null;

if (process.env.DATABASE_URL) {
  dbMode = 'pg';
  const pg = await import('pg');
  const { Pool } = pg.default;
  const url = process.env.DATABASE_URL;
  pgPool = new Pool({
    connectionString: url,
    ssl: url && !url.includes('localhost') ? { rejectUnauthorized: false } : false,
  });
} else {
  const Database = (await import('better-sqlite3')).default;
  const { fileURLToPath } = await import('url');
  const path = await import('path');
  const fs = await import('fs');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'todos.sqlite');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  sqliteDb = new Database(dbPath);
}

async function initSchema() {
  if (dbMode === 'pg') {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        due_date TEXT,
        reminder TEXT,
        important INTEGER DEFAULT 0,
        notes TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS today_focus (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        focused_date DATE NOT NULL,
        PRIMARY KEY (user_id, task_id)
      );
      CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
      CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
    CREATE INDEX IF NOT EXISTS idx_today_focus_user_date ON today_focus(user_id, focused_date);
  `);
  return;
  }

  return new Promise((resolve) => {
  sqliteDb.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
    CREATE INDEX IF NOT EXISTS idx_today_focus_user_date ON today_focus(user_id, focused_date);
  `);
  resolve();
  });
}

const db = {
  async get(sql, params = []) {
    if (dbMode === 'pg') {
      const r = await pgPool.query(toPgParams(sql), params);
      return r.rows[0] ?? null;
    }
    const stmt = sqliteDb.prepare(sql);
    return Promise.resolve(stmt.get(...params) ?? null);
  },
  async all(sql, params = []) {
    if (dbMode === 'pg') {
      const r = await pgPool.query(toPgParams(sql), params);
      return r.rows;
    }
    const stmt = sqliteDb.prepare(sql);
    return Promise.resolve(stmt.all(...params));
  },
  async run(sql, params = []) {
    if (dbMode === 'pg') {
      const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
      const hasReturning = /RETURNING\s+/i.test(sql);
      let finalSql = sql;
      if (isInsert && !hasReturning) finalSql = sql.replace(/;\s*$/, '') + ' RETURNING id';
      const r = await pgPool.query(toPgParams(finalSql), params);
      const lastInsertRowid = r.rows[0]?.id ?? null;
      return { lastInsertRowid, changes: r.rowCount ?? 0 };
    }
    const stmt = sqliteDb.prepare(sql);
    const info = stmt.run(...params);
    return Promise.resolve({ lastInsertRowid: info.lastInsertRowid, changes: info.changes });
  },
};

await initSchema();
export default db;
export { dbMode };
