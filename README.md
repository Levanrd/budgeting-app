# Budgeting Application

A full-stack budgeting app to track income, categorize spending, plan monthly allocations, and review reports.

## Stack

- Frontend: Vue 3, Vite, Element Plus, Vue Router, ECharts, Axios
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, express-validator, PDFKit
- Production recommendation: Vercel for the frontend, Render for the API, MongoDB Atlas for the database

## Project Structure

```text
budgeting-app/
|-- client/        # Vue 3 frontend
|-- server/        # Express API
|-- render.yaml    # Render blueprint for the API
|-- vercel.json    # Vercel config for the frontend SPA
`-- README.md
```

## Local Development

### Prerequisites

- Node.js 20+
- MongoDB local instance or MongoDB Atlas

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Set at least:

- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN=http://localhost:5173`

### Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Set:

- `VITE_API_URL=http://localhost:3000/api`

## Production Deployment

### Recommended Architecture

- Vercel hosts the Vue frontend
- Render hosts the Express API
- MongoDB Atlas hosts the database

This app is now configured for that split deployment:

- [`render.yaml`](/C:/Users/Lester/Documents/Repositories/budgeting-app/render.yaml) defines the Render API service
- [`vercel.json`](/C:/Users/Lester/Documents/Repositories/budgeting-app/vercel.json) keeps SPA routes working on Vercel

### MongoDB Atlas

Create an Atlas cluster, then copy the connection string into `MONGODB_URI`.

Recommended env vars for Render:

- `MONGODB_URI`
- `MONGODB_DB_NAME` if your URI does not already include the database name
- `JWT_SECRET`
- `CORS_ORIGIN=https://your-frontend-domain.vercel.app`
- `NODE_ENV=production`
- `SEED_USERS=false`

### Render API

1. Push this repo to GitHub.
2. In Render, create a Blueprint or Web Service from the repo.
3. Use the `server` root directory.
4. Confirm:
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/api/ready`
5. Set the production environment variables listed above.

### Vercel Frontend

1. Import the repo into Vercel.
2. Set the root directory to the repository root.
3. Keep the existing build settings from [`vercel.json`](/C:/Users/Lester/Documents/Repositories/budgeting-app/vercel.json).
4. Do not set `VITE_API_URL` in production. The Vercel app proxies `/api/*` to the Render API so auth cookies stay first-party on the frontend domain.
5. Add:
   - `VITE_APP_TIMEZONE=Asia/Manila`
6. Deploy and then add the final Vercel domain to Render `CORS_ORIGIN`.

## Production Hardening Included

- DB initialization is now safe for long-running servers and serverless-style cold starts
- `/api/ready` reports database readiness for platform health checks
- CORS is explicit and environment-driven
- Production API calls can be proxied through the frontend domain so mobile browsers keep auth cookies on refresh
- Category deletion is blocked if transactions or budgets still reference the category
- Budget summaries now surface unplanned spending instead of hiding it
- PDF exports use PHP formatting instead of USD symbols

## Notes

- Authentication now uses HTTP-only cookies plus CSRF protection instead of storing the JWT in `localStorage`.
- Default categories are seeded automatically on startup.
- To promote a user to admin:

```bash
cd server
node scripts/makeAdmin.js your@email.com
```
