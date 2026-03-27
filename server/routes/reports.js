import express from 'express';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { protect } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

const router = express.Router();
const formatPeso = (amount) => `PHP ${Number(amount || 0).toFixed(2)}`;

router.get('/monthly-comparison', protect, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const limit = Math.min(Number(months) || 6, 24);
    const transactions = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$monthKey',
          income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: limit },
    ]);
    const result = transactions.map((t) => ({
      monthKey: t._id,
      income: t.income,
      expense: t.expense,
      net: t.income - t.expense,
    }));
    res.json(result.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/category-trends', protect, async (req, res) => {
  try {
    const { monthKey } = req.query;
    const match = { user: req.user._id, type: 'expense' };
    if (monthKey) match.monthKey = monthKey;
    const trends = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: '$cat' },
      { $project: { categoryName: '$cat.name', total: 1 } },
      { $sort: { total: -1 } },
    ]);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/export/csv', protect, async (req, res) => {
  try {
    const { monthKey } = req.query;
    const filter = { user: req.user._id };
    if (monthKey) filter.monthKey = monthKey;
    const transactions = await Transaction.find(filter)
      .populate('category', 'name slug')
      .sort({ date: 1 })
      .lean();
    const headers = 'Date,Type,Category,Amount,Description\n';
    const rows = transactions
      .map(
        (t) =>
          `${new Date(t.date).toISOString().split('T')[0]},${t.type},${t.category?.name ?? ''},${t.amount},"${(t.description || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions${monthKey ? `-${monthKey}` : ''}.csv`);
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/export/pdf', protect, async (req, res) => {
  try {
    const { monthKey } = req.query;
    const filter = { user: req.user._id };
    if (monthKey) filter.monthKey = monthKey;
    const transactions = await Transaction.find(filter)
      .populate('category', 'name slug')
      .sort({ date: 1 })
      .lean();
    const budget = monthKey
      ? await Budget.findOne({ user: req.user._id, monthKey })
          .populate('allocations.category', 'name')
          .lean()
      : null;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report${monthKey ? `-${monthKey}` : ''}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('Budget Report', { continued: false });
    doc.fontSize(10).text(monthKey ? `Month: ${monthKey}` : 'All time');
    doc.moveDown();

    if (budget) {
      doc.fontSize(12).text('Monthly plan', { continued: false });
      doc.text(`Income target: ${formatPeso(budget.incomeTarget)}`);
      budget.allocations?.forEach((a) => {
        doc.text(`  ${a.category?.name}: ${formatPeso(a.amount)}`);
      });
      doc.moveDown();
    }

    doc.fontSize(12).text('Transactions', { continued: false });
    doc.fontSize(9);
    transactions.slice(0, 100).forEach((t) => {
      doc.text(
        `${new Date(t.date).toISOString().split('T')[0]} | ${t.type} | ${t.category?.name ?? ''} | ${formatPeso(t.amount)} | ${t.description || '-'}`
      );
    });
    if (transactions.length > 100) {
      doc.text(`... and ${transactions.length - 100} more transactions`);
    }
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
