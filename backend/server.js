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
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

connectDB().then(async () => {
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
