import express from 'express';
import { body, validationResult } from 'express-validator';
import Transaction from '../models/Transaction.js';
import { protect, requireCsrf } from '../middleware/auth.js';

const router = express.Router();

const getMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

router.get('/', protect, async (req, res) => {
  try {
    const { monthKey, type, category, limit = 100 } = req.query;
    const filter = { user: req.user._id };
    if (monthKey) filter.monthKey = monthKey;
    if (type) filter.type = type;
    if (category) filter.category = category;
    const transactions = await Transaction.find(filter)
      .populate('category', 'name slug type')
      .sort({ date: -1 })
      .limit(Number(limit))
      .lean();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  '/',
  protect,
  requireCsrf,
  [
    body('type').isIn(['income', 'expense']),
    body('amount').isFloat({ min: 0.01 }),
    body('category').isMongoId(),
    body('description').optional().trim(),
    body('date').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const date = req.body.date ? new Date(req.body.date) : new Date();
      const transaction = await Transaction.create({
        user: req.user._id,
        type: req.body.type,
        amount: req.body.amount,
        category: req.body.category,
        description: req.body.description || '',
        date,
        monthKey: getMonthKey(date),
      });
      await transaction.populate('category', 'name slug type');
      res.status(201).json(transaction);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.put(
  '/:id',
  protect,
  requireCsrf,
  [
    body('type').optional().isIn(['income', 'expense']),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('category').optional().isMongoId(),
    body('description').optional().trim(),
    body('date').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
      const updates = { ...req.body };
      if (updates.date) {
        updates.date = new Date(updates.date);
        updates.monthKey = getMonthKey(updates.date);
      }
      Object.assign(transaction, updates);
      await transaction.save();
      await transaction.populate('category', 'name slug type');
      res.json(transaction);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.delete('/:id', protect, requireCsrf, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
