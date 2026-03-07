# To Do List API

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set JWT_SECRET (required in production), optional PORT and DATABASE_PATH
```

## Run

- Development (with watch): `npm run dev`
- Production: `npm start`

Defaults: port 3001, SQLite at `./data/todos.sqlite`.

## Env

- `PORT` – server port (default 3001)
- `JWT_SECRET` – secret for signing JWTs (set in production)
- `DATABASE_PATH` – path to SQLite file (default `./data/todos.sqlite`)
