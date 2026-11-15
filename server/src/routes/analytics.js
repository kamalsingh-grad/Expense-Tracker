const express = require('express');
const { query } = require('express-validator');
const Transaction = require('../models/Transaction');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();

const TYPE_SUMS = {
  income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
  expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
  count: { $sum: 1 },
};

const pad = (n) => String(n).padStart(2, '0');
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const pctChange = (curr, prev) => (prev === 0 ? null : ((curr - prev) / Math.abs(prev)) * 100);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const savingsRate = (income, expense) => (income <= 0 ? 0 : round2(((income - expense) / income) * 100));

/** GET /api/analytics/summary — headline KPIs + month-over-month deltas */
router.get('/summary', async (_req, res, next) => {
  try {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const prevStart = addMonths(thisStart, -1);
    const yearStart = addMonths(thisStart, -11);

    const [allTimeRows, monthRows, yearTotalRow, topCategory] = await Promise.all([
      Transaction.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Transaction.aggregate([
        { $match: { date: { $gte: prevStart } } },
        { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } } }, ...TYPE_SUMS } },
      ]),
      Transaction.aggregate([
        { $match: { date: { $gte: yearStart } } },
        { $group: { _id: null, ...TYPE_SUMS } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'expense', date: { $gte: thisStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const all = Object.fromEntries(allTimeRows.map((r) => [r._id, r]));
    const incomeTotal = all.income?.total ?? 0;
    const expenseTotal = all.expense?.total ?? 0;
    const txCount = (all.income?.count ?? 0) + (all.expense?.count ?? 0);

    const months = Object.fromEntries(monthRows.map((r) => [r._id.month, r]));
    const cur = months[monthKey(thisStart)] ?? { income: 0, expense: 0, count: 0 };
    const prev = months[monthKey(prevStart)] ?? { income: 0, expense: 0, count: 0 };

    res.json({
      totalBalance: round2(incomeTotal - expenseTotal),
      totalIncome: round2(incomeTotal),
      totalExpense: round2(expenseTotal),
      savingsRate: savingsRate(incomeTotal, expenseTotal),
      transactionCount: txCount,
      avgMonthlyExpense: round2((yearTotalRow[0]?.expense ?? 0) / 12),
      month: {
        key: monthKey(thisStart),
        label: now.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
        income: round2(cur.income),
        expense: round2(cur.expense),
        savings: round2(cur.income - cur.expense),
        savingsRate: savingsRate(cur.income, cur.expense),
        incomeChange: pctChange(cur.income, prev.income),
        expenseChange: pctChange(cur.expense, prev.expense),
        transactions: cur.count,
      },
      topCategory: topCategory[0]
        ? { category: topCategory[0]._id, amount: round2(topCategory[0].total), count: topCategory[0].count }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/analytics/monthly?months=12 — income vs expense for the trailing N months */
router.get(
  '/monthly',
  [query('months').optional().isInt({ min: 3, max: 24 }).toInt()],
  handleValidation,
  async (req, res, next) => {
    try {
      const n = req.query.months ?? 12;
      const now = new Date();
      const start = addMonths(startOfMonth(now), -(n - 1));

      const rows = await Transaction.aggregate([
        { $match: { date: { $gte: start } } },
        { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } } }, ...TYPE_SUMS } },
      ]);
      const byMonth = Object.fromEntries(rows.map((r) => [r._id.month, r]));

      const series = [];
      for (let i = 0; i < n; i += 1) {
        const d = addMonths(start, i);
        const key = monthKey(d);
        const row = byMonth[key] ?? { income: 0, expense: 0, count: 0 };
        series.push({
          month: key,
          label: MONTH_LABELS[d.getMonth()],
          fullLabel: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
          income: round2(row.income),
          expense: round2(row.expense),
          savings: round2(row.income - row.expense),
          transactions: row.count,
        });
      }
      res.json(series);
    } catch (err) {
      next(err);
    }
  }
);

/** GET /api/analytics/categories?type=expense&months=6 — category breakdown with % share */
router.get(
  '/categories',
  [
    query('type').optional().isIn(['income', 'expense']),
    query('months').optional().isInt({ min: 1, max: 24 }).toInt(),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const type = req.query.type ?? 'expense';
      const n = req.query.months ?? 6;
      const start = addMonths(startOfMonth(new Date()), -(n - 1));

      const rows = await Transaction.aggregate([
        { $match: { type, date: { $gte: start } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]);
      const grand = rows.reduce((s, r) => s + r.total, 0);
      res.json({
        type,
        total: round2(grand),
        categories: rows.map((r) => ({
          category: r._id,
          amount: round2(r.total),
          count: r.count,
          percentage: grand === 0 ? 0 : round2((r.total / grand) * 100),
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

/** GET /api/analytics/daily?days=30 — trailing days cash-flow series */
router.get(
  '/daily',
  [query('days').optional().isInt({ min: 7, max: 90 }).toInt()],
  handleValidation,
  async (req, res, next) => {
    try {
      const days = req.query.days ?? 30;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));

      const rows = await Transaction.aggregate([
        { $match: { date: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, ...TYPE_SUMS } },
      ]);
      const byDay = Object.fromEntries(rows.map((r) => [r._id, r]));

      const series = [];
      for (let i = 0; i < days; i += 1) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const row = byDay[key] ?? { income: 0, expense: 0, count: 0 };
        series.push({
          date: key,
          label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          income: round2(row.income),
          expense: round2(row.expense),
          net: round2(row.income - row.expense),
        });
      }
      res.json(series);
    } catch (err) {
      next(err);
    }
  }
);

/** GET /api/analytics/recent?limit=6 — latest transactions (dashboard feed) */
router.get(
  '/recent',
  [query('limit').optional().isInt({ min: 1, max: 25 }).toInt()],
  handleValidation,
  async (req, res, next) => {
    try {
      const limit = req.query.limit ?? 6;
      const rows = await Transaction.find().sort({ date: -1, _id: -1 }).limit(limit).lean();
      res.json(rows.map(({ _id, __v, ...rest }) => ({ id: _id.toString(), ...rest })));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
