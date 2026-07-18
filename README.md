# Shift Ledger — Ride Earnings Tracker

Full-stack web app to log Rapido/Uber rides and daily expenses, view auto-calculated dashboards, and download Excel reports — no spreadsheet filling by hand.

**Stack:** React + Vite · Node.js + Express · MongoDB Atlas

---

## Project Structure

```
ride-tracker/
├── backend/       Express API (Vercel Serverless)
│   ├── api/
│   │   └── index.js       ← Vercel serverless entry point
│   ├── app.js             ← Express app (no listen())
│   ├── server.js          ← Local dev runner only
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── vercel.json
└── frontend/      React (Vite) SPA
    ├── src/
    └── vercel.json
```

---

## Local Development

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in your MONGO_URI
npm install
npm run dev          # → http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Set: VITE_API_URL=http://localhost:5001/api
npm install
npm run dev          # → http://localhost:5173
```

---

## Deployment to Vercel (Two Projects)

Both the backend and frontend are deployed as **separate Vercel projects** from the same monorepo.

### Step 1 — Push to GitHub

```bash
cd /path/to/ride-tracker
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ride-tracker.git
git push -u origin main
```

---

### Step 2 — Deploy the Backend

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo
2. Set **Root Directory** to `backend`
3. Framework Preset: **Other**
4. Leave Build Command and Output Directory **empty** (Vercel reads `vercel.json`)
5. Add these **Environment Variables**:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/MyExpenses?retryWrites=true&w=majority` |
   | `FRONTEND_URL` | *(leave blank for now — fill in after deploying frontend)* |

6. Click **Deploy**
7. Copy the deployment URL e.g. `https://ride-tracker-backend.vercel.app`

---

### Step 3 — Deploy the Frontend

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import the **same** GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework Preset: **Vite** (auto-detected)
4. Add this **Environment Variable**:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://ride-tracker-backend.vercel.app/api` |

5. Click **Deploy**
6. Copy the frontend URL e.g. `https://ride-tracker-frontend.vercel.app`

---

### Step 4 — Wire Up CORS

Go back to your **backend** Vercel project → Settings → Environment Variables → add:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | `https://ride-tracker-frontend.vercel.app` |

Then **Redeploy** the backend (Deployments → click the three-dot menu → Redeploy).

---

## MongoDB Atlas Setup

1. [Sign up free](https://www.mongodb.com/cloud/atlas/register) → Create a free M0 cluster
2. **Database Access** → Add a user with a password
3. **Network Access** → Add `0.0.0.0/0` (allow connections from anywhere — needed for Vercel)
4. **Connect** → **Drivers** → copy the `mongodb+srv://...` connection string
5. Replace `<password>` with your actual password and paste as `MONGO_URI`

---

## Setting Your Opening Balance (First Time Only)

Your accounts won't be at ₹0 when you start. Set real balances once:

```bash
curl -X POST https://ride-tracker-backend.vercel.app/api/summary/opening-balance \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "month": 7, "BOB": 5000, "Kotak": 2000, "Airtel": 500, "Cash": 800}'
```

After that, every month's opening balance is calculated automatically from the previous month.

---

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/rides` | List / add a ride (`?month=&year=`) |
| PUT/DELETE | `/api/rides/:id` | Edit / delete a ride |
| GET/POST | `/api/expenses` | List / add an expense (`?month=&year=`) |
| PUT/DELETE | `/api/expenses/:id` | Edit / delete an expense |
| GET | `/api/summary/month?year=&month=` | Monthly totals + account balances |
| GET | `/api/summary/year?year=` | 12-month breakdown |
| POST | `/api/summary/opening-balance` | Set/override an opening balance |
| GET | `/api/export/month?year=&month=` | Download month Excel |
| GET | `/api/export/year?year=` | Download year Excel |

---

## Notes

- No authentication — single-user personal tool. Add middleware if you ever share it publicly.
- Vercel serverless functions have a 10s timeout on the free tier. Excel export for large datasets should still be well within limits.
- MongoDB connections are cached between serverless invocations to avoid reconnecting on every request.
