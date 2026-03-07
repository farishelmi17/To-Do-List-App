# Deploy frontend to Vercel

The **frontend** (Vite/React) can be deployed on Vercel for free. The **backend** (Node/Express + SQLite) should stay on another host (e.g. [Render](https://render.com)); see DEPLOY.md if you use Render.

## 1. Push to GitHub

If you haven’t already:

1. Create a new repository on GitHub named **to-do-list-app** (or "To Do List App").
2. Do **not** add a README, .gitignore, or license (the project already has them).
3. In your project folder, run (replace `YOUR_USERNAME` with your GitHub username):

```bash
cd "/Users/muhammadfariskamal/Documents/To Do List App"
git remote add origin https://github.com/YOUR_USERNAME/to-do-list-app.git
git branch -M main
git push -u origin main
```

## 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project** and import your **to-do-list-app** repo.
3. Configure the project:
   - **Root Directory:** click **Edit**, choose **frontend**, then **Continue**.
   - **Framework Preset:** Vite (should be auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
4. **Environment variables:** Add:
   - **Name:** `VITE_API_URL`
   - **Value:** your backend API URL (e.g. `https://your-backend.onrender.com`).
   If the backend isn’t deployed yet, use a placeholder and add the real URL later, then redeploy.
5. Click **Deploy**. Vercel will build and give you a URL like `https://to-do-list-app-xxx.vercel.app`.

## 3. After backend is deployed

Once the backend is running (e.g. on Render):

1. In Vercel: **Project** → **Settings** → **Environment Variables**.
2. Set **VITE_API_URL** to your backend URL (e.g. `https://todo-api-xxxx.onrender.com`).
3. **Redeploy** (Deployments → … → Redeploy) so the frontend uses the new API URL.

## Note

Only the **frontend** is on Vercel. The backend must run elsewhere (e.g. Render free tier). The app will work once both are deployed and **VITE_API_URL** points to the backend.
