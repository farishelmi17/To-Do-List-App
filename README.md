# To Do List App

Full-stack to-do app with Microsoft To Do–inspired features: multiple lists, due dates, reminders, importance, and smart views (Planned, Completed). Sign in once and stay logged in (JWT in localStorage).

## Stack

- **Frontend**: React (Vite), React Router
- **Backend**: Node.js, Express, SQLite (better-sqlite3), JWT auth

## Run locally

1. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env   # optional: set JWT_SECRET, PORT
   npm run dev
   ```
   API: http://localhost:3001

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   App: http://localhost:5173

3. Open http://localhost:5173 → Register or Sign in → create lists and tasks.

## Features

- **Auth**: Register, login; JWT stored so you stay signed in.
- **Lists**: Create, rename, delete; select in sidebar.
- **Tasks**: Add in list view; checkbox to complete; click task for details (due date, reminder, important, notes).
- **Views**: **Planned** (tasks with due dates), **Completed** (done tasks).
