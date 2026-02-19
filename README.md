# Budgeting Application

A full-stack budgeting app to track income, categorize spending, plan monthly allocations (tithes, bills, debt, savings), and view clear summaries and reports.

## Tech Stack

- **Frontend:** Vue 3, Vite, Element Plus, Vue Router, ECharts (vue-echarts), Axios
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, express-validator, PDFKit

## Features

- **User auth:** Register, login, logout (JWT)
- **Transactions:** Add, edit, delete; tag by category (tithes, bills, expenses, debt, savings)
- **Monthly budget:** Set income target and category allocations (fixed amounts)
- **Dashboard:** Allocation vs spent, remaining balance, category breakdown charts
- **Reports:** Monthly comparison, category trends, export to CSV and PDF
- **Admin:** Manage categories, default allocations (admin users only)

## Project structure

```
budgeting-app/
├── backend/          # Node.js API
│   ├── config/       # DB connection
│   ├── middleware/   # auth
│   ├── models/       # User, Category, Transaction, Budget
│   ├── routes/       # auth, categories, transactions, budgets, reports
│   ├── scripts/      # seed default categories
│   └── server.js
├── frontend/         # Vue 3 app
│   ├── src/
│   │   ├── api/      # API client and endpoints
│   │   ├── layouts/
│   │   ├── router/
│   │   └── views/    # Login, Register, Dashboard, Transactions, Monthly Plan, Reports, Admin
│   └── index.html
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

1. From project root:
   ```bash
   cd backend
   npm install
   ```
2. Copy `.env.example` to `.env` and set:
   - `MONGODB_URI` (e.g. `mongodb://localhost:27017/budgeting-app`)
   - `JWT_SECRET` (strong secret for production)
   - `PORT` (default 3000)
3. Start MongoDB, then:
   ```bash
   npm run dev
   ```
   Default categories are seeded on first run.

### Frontend

1. From project root:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open http://localhost:5173. The dev server proxies `/api` to the backend.

### Production build

- **Backend:** `cd backend && npm start` (set `NODE_ENV=production` and real `MONGODB_URI`, `JWT_SECRET`).
- **Frontend:** `cd frontend && npm run build`; serve the `dist/` folder and point API requests to your backend URL (e.g. configure `baseURL` in `src/api/client.js` or use env).

## Default categories (seeded)

- Expense: Tithes, Bills, Expenses, Debt, Savings, Emergency Fund  
- Income: Salary, Other Income  

Admins can add/edit categories and default allocations in the Admin module. To grant admin to a user (e.g. first account):

```bash
cd backend
node scripts/makeAdmin.js your@email.com
```

## License

MIT
