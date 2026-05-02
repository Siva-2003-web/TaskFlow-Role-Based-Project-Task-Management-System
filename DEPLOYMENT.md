# TaskFlow Deployment Guide (Railway)

This guide documents deployment using Railway for a complete full-stack setup.

- Frontend: Railway (React + Vite)
- Backend: Railway (Express API)
- Database: Neon PostgreSQL

## 1. Architecture

- Railway hosts both frontend and backend as separate services.
- Neon hosts PostgreSQL.
- Both services communicate via Railway's internal networking.

**URL Pattern:**

- Frontend: `https://taskflow-frontend.railway.app` (or custom domain)
- Backend: `https://taskflow-backend.railway.app` (or custom domain)
- API route prefix: `/api`

## 2. Prerequisites

- GitHub repository with latest code pushed
- Railway account (free tier available)
- Neon account (free tier available)

## 3. Neon Setup (Database)

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Create a database (e.g., `taskflow`)
4. Copy connection details:
   - Host (e.g., `ep-xyz.us-east-1.neon.tech`)
   - Port (usually `5432`)
   - Database name (e.g., `taskflow`)
   - User (e.g., `neondb_owner`)
   - Password (auto-generated)

### Initialize Database Schema

Use Neon SQL Editor to run initialization:

```sql
-- Copy content from backend/db/init.sql and run in Neon SQL Editor
-- Or use the migration script after deployment
```

## 4. Railway Setup

### Step 1: Create a New Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `TaskFlow-Role-Based-Project-Task-Management-System` repository

### Step 2: Deploy Backend Service

1. Click "Add Service" → "GitHub Repo"
2. Select the same repository
3. Configure backend deployment:
   - **Service name**: `backend`
   - **Root directory**: `backend`
   - **Build command**: `npm install`
   - **Start command**: `npm start`

### Step 3: Configure Backend Environment Variables

In Railway dashboard, go to Backend Service → Variables:

```env
NODE_ENV=production
PORT=3000
CLIENT_URL=https://taskflow-frontend.railway.app

# Database (from Neon)
DB_HOST=ep-xyz.us-east-1.neon.tech
DB_PORT=5432
DB_NAME=taskflow
DB_USER=neondb_owner
DB_PASSWORD=<your_neon_password>
DB_SSL=true

# JWT
JWT_SECRET=<generate_strong_random_string_here>
JWT_EXPIRES_IN=1d
```

### Step 4: Deploy Frontend Service

1. Click "Add Service" → "GitHub Repo"
2. Select the same repository
3. Configure frontend deployment:
   - **Service name**: `frontend`
   - **Root directory**: (leave empty)
   - **Build command**: `npm run build`
   - **Start command**: `npm run preview` (or `eval $(echo $RAILWAY_STATIC_URL | sed 's/https:\/\///') && npx http-server dist -p $PORT`

### Step 5: Configure Frontend Environment Variables

In Railway dashboard, go to Frontend Service → Variables:

```env
VITE_API_URL=https://taskflow-backend.railway.app/api
```

**Alternative**: If you want the frontend to auto-detect backend URL:

- Leave `VITE_API_URL` empty
- Frontend will use relative `/api` paths (works via Railway routing)

## 5. Initialize Database (First Time Only)

After backend is deployed and running:

### Option A: Using Railway CLI

```bash
# From backend directory
npm run db:init
npm run db:seed
```

### Option B: Using Railway Task Scheduler (If Enabled)

Or trigger via POST request to a temporary admin endpoint.

### Option C: Manual via Neon SQL Editor

Copy content from `backend/db/init.sql` and `backend/db/seed.js` logic into Neon SQL Editor.

## 6. CORS & Cookie Authentication

Current backend uses `httpOnly` JWT cookies for authentication.

**Required settings for Railway:**

- Backend `CLIENT_URL` must match frontend domain exactly
- Backend CORS credentials: `true` (already configured)
- Frontend axios `withCredentials`: `true` (already configured)
- Cookies use `sameSite: "lax"` (works with Railway domains)

**Within same domain (Railway):**

- Frontend and backend on same root domain share cookies automatically
- No additional proxy configuration needed

## 7. Deploy Order & Testing

### Order:

1. **Neon**: Create database and capture connection details
2. **Backend**: Deploy to Railway, set environment variables
3. **Database Init**: Run `npm run db:init` and `npm run db:seed`
4. **Frontend**: Deploy to Railway, set `VITE_API_URL`
5. **Test**: Full end-to-end authentication flow

### Test Checklist:

```bash
# 1. Backend health check
curl https://taskflow-backend.railway.app/api/health

# 2. Backend should respond with
# {"status":"ok","message":"TaskFlow API is running"}

# 3. Open frontend in browser
# https://taskflow-frontend.railway.app

# 4. Test registration → login → dashboard access
```

## 8. Post-Deploy Checklist

- ✅ Backend health endpoint returns 200
- ✅ Registration creates user successfully
- ✅ Login sets cookie and redirects to dashboard
- ✅ Protected routes enforce authorization
- ✅ Manager can create projects/tasks
- ✅ Employee can view assigned tasks
- ✅ Admin can manage users
- ✅ Browser refresh works on nested routes
- ✅ Logout clears cookie

## 9. Database Migrations (After Initial Deploy)

To add new columns or update schema on existing database:

```bash
# Run from backend directory
npm run db:migrate
```

This executes `backend/db/migrate.sql` on your Neon database.

## 10. Troubleshooting

### Backend won't start / Port binding error

- Ensure PORT is set in Railway environment or defaults to 3000
- Check `npm start` command in backend/package.json

### 401/403 authentication errors

- Verify `CLIENT_URL` in backend env matches frontend domain exactly
- Check browser cookies are being set (DevTools → Application → Cookies)
- Ensure `withCredentials: true` in frontend axios config

### Frontend API calls fail / 502 Bad Gateway

- Confirm Backend service is running (`npm run dev` locally or check Railway logs)
- Verify backend `VITE_API_URL` matches backend service URL
- Check CORS is enabled in backend (`cors({ credentials: true })`)

### Database connection timeout

- Verify Neon credentials are correct
- Ensure SSL is enabled: `DB_SSL=true` in backend env
- Check Neon database is not in read-only mode

### Frontend shows blank page after build

- Check build output: `npm run build` locally to verify
- Verify dist/ folder is created with index.html
- Check Railway logs for build errors

## 11. Monitoring & Logs

In Railway dashboard:

- **Logs tab**: Real-time application logs
- **Metrics tab**: CPU, memory, build status
- **Variables tab**: Edit environment variables and redeploy
- **Deployments tab**: History of all deploys with rollback option

## 12. Environment-Specific URLs

Once deployed, update any hardcoded URLs:

| Environment       | Frontend URL                            | Backend URL                            |
| ----------------- | --------------------------------------- | -------------------------------------- |
| Local Development | `http://localhost:5173`                 | `http://localhost:5000`                |
| Staging (Railway) | `https://taskflow-frontend.railway.app` | `https://taskflow-backend.railway.app` |
| Production        | `https://taskflow.yourdomain.com`       | `https://api.taskflow.yourdomain.com`  |

## 13. Custom Domain Setup (Optional)

To use your own domain instead of railway.app:

1. In Railway project → Settings → Domains
2. Add custom domain
3. Update DNS records per Railway instructions
4. Update `CLIENT_URL` in backend environment variables

## 14. Suggested Production Files

- Backend env: Configured in Railway dashboard (not in version control)
- Frontend env: `VITE_API_URL` in Railway dashboard variables
- Database: Neon with auto-backups enabled
- Monitoring: Enable Railway alerts for service downtime
