# TaskFlow

TaskFlow is a full-stack task and project management app with role-based access control.

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT in httpOnly cookies

## Hosting Stack (Free)

- Frontend: Netlify
- Backend API: Render
- Database: Neon PostgreSQL

For full production setup steps, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Features

- Authentication with login and logout
- Role-based authorization for Admin, Manager, and User
- User management APIs (Admin only)
- Project management APIs (Manager write, shared read by role rules)
- Task management APIs with manager and user permissions
- Centralized backend error handling with consistent response format

## Tech Stack

### Frontend

- React
- Redux Toolkit
- React Router
- Axios
- Vite

### Backend

- Express
- pg (node-postgres)
- bcryptjs
- jsonwebtoken
- cookie-parser
- dotenv

## Project Structure

```text
task-flow/
	src/                    # frontend source
	backend/
		config/               # db connection
		controllers/          # route handlers
		db/                   # init and seed scripts
		middlewares/          # auth, role, error handling
		routes/               # api routes
		utils/                # shared utilities
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (tested with PostgreSQL 16)

## Environment Variables

Create `backend/.env` with:

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow
DB_USER=taskflow_user
DB_PASSWORD=taskflow_password
JWT_SECRET=taskflow_super_secret_change_me
JWT_EXPIRES_IN=1d
```

For production env vars on Render + Neon, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Installation

From project root:

```bash
npm install
```

From backend folder:

```bash
cd backend
npm install
```

## Database Setup

From `backend/`:

1. Initialize schema:

```bash
npm run db:init
```

2. Seed test users:

```bash
npm run db:seed
```

## Seeded Credentials

- Admin: `admin@taskflow.com` / `Admin@123`
- Manager: `manager@taskflow.com` / `Manager@123`
- User: `user@taskflow.com` / `User@123`

## Run the Project

### 1) Start frontend

From project root:

```bash
npm run dev
```

### 2) Start backend

From `backend/`:

```bash
npm run dev
```

## Available Scripts

### Root

- `npm run dev` - start frontend dev server
- `npm run build` - build frontend
- `npm run preview` - preview production frontend build
- `npm run lint` - run eslint

### Backend

- `npm run dev` - start backend with nodemon
- `npm run start` - start backend with node
- `npm run db:init` - run database schema initialization
- `npm run db:seed` - seed admin, manager, and user accounts

## API Base URL

- Backend local: `http://localhost:5000`
- API prefix: `/api`

## Error Response Format

Backend uses centralized error handling and returns:

```json
{
  "success": false,
  "message": "..."
}
```

Common status codes:

- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

## API Endpoints

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Users (Admin only)

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Projects

- `GET /api/projects`
  - Admin: sees all projects
  - Manager: sees own projects
  - User: sees assigned projects
- `POST /api/projects` (Manager only)
- `PUT /api/projects/:id` (Manager only, own projects)
- `DELETE /api/projects/:id` (Manager only, own projects)
- `POST /api/projects/:id/members` (Manager only, own projects)

### Tasks

- `GET /api/projects/:id/tasks`
  - Returns tasks for project with assigned user name via JOIN
- `POST /api/projects/:id/tasks` (Manager only, own projects)
- `PUT /api/tasks/:id` (Manager only, own projects)
- `PATCH /api/tasks/:id/status`
  - Manager: can update status for tasks in own projects
  - User: can update only tasks assigned to self
- `DELETE /api/tasks/:id` (Manager only, own projects)

## Authentication Notes

- Login sets a JWT token in an httpOnly cookie named `token`.
- Protected routes require that cookie to be present and valid.
- Frontend requests must include credentials (cookies).

## Postman Testing Tips

- Use a single Postman collection with cookie persistence enabled.
- First call `POST /api/auth/login`.
- Then call protected endpoints in the same session.

## Current Status

- Phases 1 to 6 implemented:
  - Database design and setup
  - Authentication
  - User management
  - Project management
  - Task management
  - Centralized error handling and seed data

## Deployment

- Recommended free deployment:
  - Netlify (frontend)
  - Render (backend)
  - Neon (PostgreSQL)
- Full deployment instructions: [DEPLOYMENT.md](DEPLOYMENT.md)
