# TaskFlow Deployment Guide

This guide documents deployment for:

- Frontend: Netlify
- Backend: Render
- Database: Neon PostgreSQL

## 1. Architecture

- Netlify serves the React app.
- Render runs the Express API.
- Neon hosts PostgreSQL.

Recommended URL pattern:

- Frontend: https://your-app.netlify.app
- Backend: https://your-api.onrender.com
- API route prefix: /api

## 2. Prerequisites

- GitHub repository with latest code
- Netlify account
- Render account
- Neon account

## 3. Neon Setup (Database)

1. Create a Neon project.
2. Create a database (for example: taskflow).
3. Copy connection details from Neon dashboard:
   - Host
   - Port
   - Database name
   - User
   - Password

Current backend DB config uses discrete env vars (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) rather than `DATABASE_URL`, so map Neon values into those fields.

## 4. Render Setup (Backend)

Create a new Web Service in Render:

- Root Directory: backend
- Build Command: npm install
- Start Command: npm start

Set environment variables in Render:

- NODE_ENV=production
- PORT=10000 (or leave default Render port and rely on process.env.PORT)
- CLIENT_URL=https://your-app.netlify.app
- DB_HOST=<neon_host>
- DB_PORT=<neon_port>
- DB_NAME=<neon_database>
- DB_USER=<neon_user>
- DB_PASSWORD=<neon_password>
- JWT_SECRET=<strong_random_secret>
- JWT_EXPIRES_IN=1d

### Important: Neon SSL

Neon requires SSL in production. The current backend config does not enable SSL yet.

Before production deploy, update backend DB pool config to enable SSL in production (or when using Neon), for example:

```js
ssl: process.env.NODE_ENV === "production"
  ? { rejectUnauthorized: false }
  : false;
```

Without SSL config, Render to Neon connection usually fails.

## 5. Netlify Setup (Frontend)

Create a new Netlify site from your GitHub repo:

- Base directory: (leave empty)
- Build command: npm run build
- Publish directory: dist

### Frontend env vars (optional)

If you keep API calls as `/api` (current code), you do not need `VITE_API_URL`.

If you later switch to absolute API URL strategy, set:

- VITE_API_URL=https://your-api.onrender.com/api

## 6. Netlify Proxy (Required with current frontend API client)

Current frontend axios baseURL is `/api`, so add a Netlify redirect/proxy rule.

Create file `public/_redirects` with:

```txt
/api/*  https://your-api.onrender.com/api/:splat  200
/*      /index.html                               200
```

Explanation:

- First rule proxies API calls from Netlify to Render.
- Second rule enables SPA routing on refresh.

## 7. CORS and Cookie Auth

Current backend uses cookie-based auth (`httpOnly` token cookie).

Required settings for this setup:

- Backend CORS origin must match Netlify URL exactly (`CLIENT_URL`).
- Backend CORS credentials must stay `true`.
- Frontend axios `withCredentials` must stay `true` (already configured).

Because frontend requests go to same-site path `/api` via Netlify proxy, existing cookie settings (`sameSite: "lax"`) are typically sufficient.

## 8. Deploy Order

1. Deploy Neon and capture DB values.
2. Deploy Render backend and verify:
   - GET https://your-api.onrender.com/api/health
3. Add Netlify proxy file (`public/_redirects`) if not already present.
4. Deploy Netlify frontend.
5. Test full auth flow:
   - Register
   - Login
   - Access protected pages
   - Logout

## 9. Post-Deploy Checklist

- Backend health endpoint returns 200.
- Login sets cookie successfully.
- Protected APIs return data (not 401/403 unexpectedly).
- Manager/Admin pages load without 500 errors.
- Browser refresh works on nested frontend routes.

## 10. Troubleshooting

### 401 after successful login

- Check `CLIENT_URL` in Render matches Netlify domain exactly.
- Ensure browser request includes credentials.
- Confirm proxy rule exists in `public/_redirects`.

### Backend fails to connect DB

- Check Neon credentials.
- Ensure SSL is enabled in backend DB config.

### Frontend API calls hit Netlify and return 404

- Verify `public/_redirects` exists and deployed.
- Rebuild/redeploy Netlify after adding redirects.

### First API request is slow

- Render free instances can sleep when idle.

## 11. Suggested Production Files

- Backend env: configured in Render dashboard
- Frontend proxy: `public/_redirects`
- Optional: project notes in this file and `README.md`
