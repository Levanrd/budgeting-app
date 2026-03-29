import express from 'express';
import { body, validationResult } from 'express-validator';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { protect, requireCsrf, admin } from '../middleware/auth.js';
import { writeRateLimit } from '../middleware/security.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const categories = await Category.find(filter).sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  '/',
  writeRateLimit,
  protect,
  requireCsrf,
  admin,
  [
    body('name').trim().notEmpty(),
    body('slug').trim().notEmpty(),
    body('type').isIn(['income', 'expense']),
    body('defaultAllocation').optional().isFloat({ min: 0 }),
    body('order').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const category = await Category.create({
        ...req.body,
        slug: req.body.slug.toLowerCase().replace(/\s+/g, '-'),
      });
      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.put(
  '/:id',
  writeRateLimit,
  protect,
  requireCsrf,
  admin,
  [
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(['income', 'expense']),
    body('defaultAllocation').optional().isFloat({ min: 0 }),
    body('order').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!category) return res.status(404).json({ message: 'Category not found' });
      res.json(category);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

router.delete('/:id', writeRateLimit, protect, requireCsrf, admin, async (req, res) => {
  try {
    const [transactionInUse, budgetInUse] = await Promise.all([
      Transaction.exists({ category: req.params.id }),
      Budget.exists({ 'allocations.category': req.params.id }),
    ]);

    if (transactionInUse || budgetInUse) {
      return res.status(409).json({
        message: 'Category is still in use by transactions or budgets and cannot be deleted',
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
