import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { authRateLimit, securityHeaders } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import transactionsRoutes from './routes/transactions.js';
import budgetsRoutes from './routes/budgets.js';
import reportsRoutes from './routes/reports.js';
import { seedCategories } from './scripts/seedCategories.js';
import { seedUsers } from './scripts/seedUsers.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const devOrigins = ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = process.env.NODE_ENV === 'development'
        ? [...new Set([...configuredOrigins, ...devOrigins])]
        : configuredOrigins;

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(securityHeaders);
app.use(express.json());
app.use('/api/auth/login', authRateLimit);
app.use('/api/auth/register', authRateLimit);

let dbInitialized = false;
let initializationPromise = null;

async function initializeDB() {
  if (dbInitialized) {
    return;
  }

  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  initializationPromise = (async () => {
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

    dbInitialized = true;
  })();

  try {
    await initializationPromise;
  } finally {
    if (!dbInitialized) {
      initializationPromise = null;
    }
  }
}

async function ensureInitialized(req, res, next) {
  try {
    await initializeDB();
    next();
  } catch (err) {
    next(err);
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    environment: process.env.NODE_ENV || 'development',
    dbState: mongoose.connection.readyState,
  });
});

app.get('/api/ready', async (req, res) => {
  try {
    await initializeDB();
    res.json({ ok: true, dbState: mongoose.connection.readyState });
  } catch (err) {
    res.status(503).json({ ok: false, message: err.message });
  }
});

app.use('/api', ensureInitialized);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/reports', reportsRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  await initializeDB();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  });
}

export default app;
