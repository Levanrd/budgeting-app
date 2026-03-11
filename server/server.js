import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import transactionsRoutes from './routes/transactions.js';
import budgetsRoutes from './routes/budgets.js';
import reportsRoutes from './routes/reports.js';
import { seedCategories } from './scripts/seedCategories.js';
import { seedUsers } from './scripts/seedUsers.js';

const app = express();

// CORS configuration - restrict to specific origin in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
};

// In development, allow localhost origins
if (process.env.NODE_ENV === 'development') {
  corsOptions.origin = (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5173/'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };
}

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Initialize DB connection and seeders
let dbInitialized = false;
async function initializeDB() {
  if (dbInitialized) return;
  dbInitialized = true;

  await connectDB();
  try {
    await seedCategories();
  } catch (err) {
    console.error('Category seed failed (server will still run):', err.message);
  }
  if (process.env.SEED_USERS === 'true') {
    try {
      await seedUsers();
    } catch (err) {
      console.error('User seed failed (server will still run):', err.message);
    }
  }
}

// Initialize on first request (for serverless) or immediately (for local)
if (process.env.VERCEL) {
  // Vercel serverless: initialize on first request
  app.use(async (req, res, next) => {
    await initializeDB();
    next();
  });
} else {
  // Local development: initialize immediately
  initializeDB();
}

// Only start server if not in Vercel (serverless)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
