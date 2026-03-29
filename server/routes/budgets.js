import express from 'express';
import { body, validationResult } from 'express-validator';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { protect, requireCsrf } from '../middleware/auth.js';
import { writeRateLimit } from '../middleware/security.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { monthKey } = req.query;
    const filter = { user: req.user._id };
    if (monthKey) filter.monthKey = monthKey;
    const budgets = await Budget.find(filter)
      .populate('allocations.category', 'name slug type')
      .sort({ monthKey: -1 })
      .lean();
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/summary/:monthKey', protect, async (req, res) => {
  try {
    const { monthKey } = req.params;
    const budget = await Budget.findOne({
      user: req.user._id,
      monthKey,
    }).populate('allocations.category', 'name slug type');

    const transactions = await Transaction.find({
      user: req.user._id,
      monthKey,
    }).lean();

    const incomeTotal = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const allocatedTotal = budget?.allocations?.reduce(
      (sum, a) => sum + (a.amount || 0),
      0
    ) || 0;

    const spentByCategory = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cid = t.category?.toString?.() || t.category;
        spentByCategory[cid] = (spentByCategory[cid] || 0) + t.amount;
      });

    const allocationMap = {};
    budget?.allocations?.forEach((a) => {
      const cid = a.category?._id?.toString?.() || a.category;
      allocationMap[cid] = { amount: a.amount, category: a.category };
    });

    const categoryBreakdown = Object.entries(allocationMap).map(
      ([cid, { amount, category }]) => ({
        category,
        allocated: amount,
        spent: spentByCategory[cid] || 0,
        remaining: amount - (spentByCategory[cid] || 0),
      })
    );

    Object.entries(spentByCategory).forEach(([cid, spent]) => {
      if (!allocationMap[cid]) {
        categoryBreakdown.push({
          category: { _id: cid, name: 'Unplanned spending', slug: 'unplanned-spending', type: 'expense' },
          allocated: 0,
          spent,
          remaining: -spent,
        });
      }
    });

    res.json({
      monthKey,
      incomeTarget: budget?.incomeTarget ?? 0,
      incomeActual: incomeTotal,
      allocatedTotal,
      expenseTotal,
      remainingUnallocated: (budget?.incomeTarget ?? 0) - allocatedTotal,
      totalRemaining: (budget?.incomeTarget ?? 0) - expenseTotal,
      categoryBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  '/',
  writeRateLimit,
  protect,
  requireCsrf,
  [
    body('monthKey').matches(/^\d{4}-\d{2}$/),
    body('incomeTarget').isFloat({ min: 0 }),
    body('allocations').isArray(),
    body('allocations.*.category').isMongoId(),
    body('allocations.*.amount').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { monthKey, incomeTarget, allocations } = req.body;
      let budget = await Budget.findOne({ user: req.user._id, monthKey });
      if (budget) {
        budget.incomeTarget = incomeTarget;
        budget.allocations = allocations;
        await budget.save();
      } else {
        budget = await Budget.create({
          user: req.user._id,
          monthKey,
          incomeTarget,
          allocations,
        });
      }
      await budget.populate('allocations.category', 'name slug type');
      res.json(budget);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.put(
  '/:monthKey',
  writeRateLimit,
  protect,
  requireCsrf,
  [
    body('incomeTarget').optional().isFloat({ min: 0 }),
    body('allocations').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const budget = await Budget.findOne({
        user: req.user._id,
        monthKey: req.params.monthKey,
      });
      if (!budget) return res.status(404).json({ message: 'Budget not found' });
      if (req.body.incomeTarget != null) budget.incomeTarget = req.body.incomeTarget;
      if (req.body.allocations) budget.allocations = req.body.allocations;
      await budget.save();
      await budget.populate('allocations.category', 'name slug type');
      res.json(budget);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
