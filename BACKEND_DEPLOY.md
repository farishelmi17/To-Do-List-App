# Deploy the backend (free tier)

The backend is a **Node.js + Express + SQLite** API. The easiest free option is **[Render](https://render.com)**.

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

5. **Environment variables** (optional for basic run):
   - `NODE_ENV` = `production`

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
- **Ephemeral disk:** SQLite is stored on the server’s local disk. On the free tier this is **not persistent**: data can be lost when the service restarts or redeploys. Fine for testing/demos; for real data consider a paid Render instance with a persistent disk or a hosted database (e.g. Postgres).

---

## Health check

Open in a browser or with curl:

```text
https://your-backend-url.onrender.com/api/health
```

You should see: `{"ok":true}`.

---

## Troubleshooting

- **Build fails:** Ensure **Root Directory** is `backend` and **Start Command** is `npm start`.
- **App crashes on start:** Check **Logs** in the Render dashboard. Common causes: wrong **Start Command** or missing **Root Directory**.
- **Frontend can’t reach API:** Confirm **VITE_API_URL** in Vercel is exactly the Render URL (with `https://`) and that you redeployed after changing it.
