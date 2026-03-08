# Deploy the backend (free tier)

The backend is **Node.js + Express** with **SQLite** (local) or **Postgres** (when `DATABASE_URL` is set). Deploy on **[Render](https://render.com)** and use a **free Postgres** database so sign-ups and data persist.

---

## 0. Get a free Postgres database (so data persists)

Without this, Render’s free tier uses an ephemeral disk and data is lost on restart.

1. **Supabase** – [supabase.com](https://supabase.com) → New project → **Settings → Database** → copy the **Connection string (URI)**. Use the “Session mode” or “Transaction” URI (includes password).
2. **Neon** – [neon.tech](https://neon.tech) → Create project → copy the connection string.

You’ll add this as **`DATABASE_URL`** on Render in the next section.

---

## 1. Push your repo to GitHub

If you haven’t already, push this project to GitHub (see **VERCEL.md** for git commands). Render will deploy from the same repo.

---

## 2. Deploy on Render

### Create a Web Service

1. Go to [render.com](https://render.com) and sign in with **GitHub**.
2. Click **New +** → **Web Service**.
3. Connect your repository (e.g. **to-do-list-app**). If it’s not listed, click **Configure account** and grant access to the repo.
4. Configure the service:

   | Field | Value |
   |-------|--------|
   | **Name** | `todo-api` (or any name) |
   | **Region** | Choose closest to you |
   | **Root Directory** | `backend` |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |

   **Important:** In **Settings → Build & Deploy**, set **Package Manager** to **npm** (not Yarn). The project uses `package-lock.json`.

5. **Environment variables** (required for persistent data):
   - **`DATABASE_URL`** = your Postgres connection string from Supabase or Neon (e.g. `postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres`).
   - `NODE_ENV` = `production` (optional).

   If you omit `DATABASE_URL`, the app uses SQLite and data will **not** persist on Render’s free tier.

6. Click **Create Web Service**. Render will install dependencies and start the app.

7. When the deploy finishes, copy your service URL, e.g.  
   `https://todo-api-xxxx.onrender.com`

---

## 3. Use the backend URL in the frontend

Your frontend (e.g. on Vercel) must call this URL:

1. In **Vercel**: Project → **Settings** → **Environment Variables**.
2. Set **`VITE_API_URL`** = `https://todo-api-xxxx.onrender.com` (your real Render URL).
3. **Redeploy** the frontend so the new API URL is used.

---

## Free tier limits (Render)

- **Spins down** after about 15 minutes with no traffic. The first request after that may take 30–60 seconds to respond.
- **Data:** With **`DATABASE_URL`** set to Supabase or Neon Postgres, all data (users, categories, tasks) is stored in that database and **persists** across deploys and restarts.

---

## Health check

Open in a browser or with curl:

```text
https://your-backend-url.onrender.com/api/health
```

You should see: `{"ok":true}`.

---

## Troubleshooting

- **Build fails:** Ensure **Root Directory** is `backend`, **Start Command** is `npm start`, and **Package Manager** is set to **npm** (Settings → Build & Deploy).
- **Render is using Yarn:** In the service **Settings → Build & Deploy**, change **Package Manager** to **npm** and redeploy.
- **App crashes on start:** Check **Logs** in the Render dashboard. Common causes: wrong **Start Command**, missing **Root Directory**, or invalid **DATABASE_URL** (e.g. wrong password or SSL issues). For Supabase/Neon, use the URI they give you as-is.
- **Frontend can’t reach API:** Confirm **VITE_API_URL** in Vercel is exactly the Render URL (with `https://`) and that you redeployed after changing it.
