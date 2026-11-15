const express = require('express');
const { body, query, param } = require('express-validator');
const Transaction = require('../models/Transaction');
const { handleValidation, escapeRegex } = require('../middleware/validate');
const { TRANSACTION_TYPES, ALL_CATEGORIES, PAYMENT_METHODS } = require('../config/categories');

const router = express.Router();

const SORTABLE = ['date', 'amount', 'description', 'category', 'createdAt'];

/* ---------------- validators ---------------- */
const idParam = param('id').isMongoId().withMessage('Invalid transaction id');

const txBody = [
  body('type').isIn(TRANSACTION_TYPES).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0, max: 100000000 }).withMessage('Amount must be a number greater than 0').toFloat(),
  body('category').isIn(ALL_CATEGORIES).withMessage('Invalid category'),
  body('description').trim().isLength({ min: 1, max: 120 }).withMessage('Description must be 1–120 characters'),
  body('merchant').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Merchant must be under 80 characters'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date (YYYY-MM-DD)').toDate(),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).withMessage('Notes must be under 300 characters'),
  body('tags').optional().isArray({ max: 5 }).withMessage('Up to 5 tags allowed'),
  body('tags.*').optional().trim().isLength({ max: 24 }).withMessage('Each tag must be under 24 characters'),
];

const listQuery = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100'),
  query('search').optional().isString().isLength({ max: 100 }).trim(),
  query('type').optional().isIn(TRANSACTION_TYPES).withMessage('Invalid type filter'),
  query('category').optional().isString().trim().isLength({ max: 60 }),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('minAmount').optional().isFloat({ min: 0 }).toFloat(),
  query('maxAmount').optional().isFloat({ min: 0 }).toFloat(),
  query('sortBy').optional().isIn(SORTABLE).withMessage(`sortBy must be one of ${SORTABLE.join(', ')}`),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

/* ---------------- routes ---------------- */

/**
 * GET /api/transactions
 * Filtering (search/type/category/date-range/amount-range), sorting and pagination.
 */
router.get('/', listQuery, handleValidation, async (req, res, next) => {
  try {
    const page = req.query.page ?? 1;
    const limit = req.query.limit ?? 10;
    const { search, type, category, minAmount, maxAmount } = req.query;
    const sortBy = req.query.sortBy ?? 'date';
    const sortOrder = req.query.sortOrder ?? 'desc';

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ description: rx }, { merchant: rx }, { notes: rx }, { tags: rx }, { category: rx }];
    }

    let { startDate, endDate } = req.query;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) {
        // make endDate inclusive for plain YYYY-MM-DD inputs
        const end = new Date(endDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.endDate)) end.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.amount = {};
      if (minAmount !== undefined) filter.amount.$gte = minAmount;
      if (maxAmount !== undefined) filter.amount.$lte = maxAmount;
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    if (sortBy !== 'date') sort.date = -1; // stable secondary order

    const [total, data] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    const shaped = data.map(({ _id, __v, ...rest }) => ({ id: _id.toString(), ...rest }));

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      data: shaped,
      meta: {
        page, limit, total, totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** Bulk delete: DELETE /api/transactions  { ids: [...] } */
router.delete('/', [body('ids').isArray({ min: 1, max: 500 }).withMessage('ids must be a non-empty array'), body('ids.*').isMongoId().withMessage('Invalid id in ids')], handleValidation, async (req, res, next) => {
  try {
    const result = await Transaction.deleteMany({ _id: { $in: req.body.ids } });
    res.json({ message: `Deleted ${result.deletedCount} transaction(s)`, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
});

/** GET /api/transactions/:id */
router.get('/:id', idParam, handleValidation, async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

/** POST /api/transactions */
router.post('/', txBody, handleValidation, async (req, res, next) => {
  try {
    const { type, amount, category, description, merchant = '', date, paymentMethod, notes = '', tags = [] } = req.body;
    const tx = await Transaction.create({
      type, amount, category, description, merchant,
      date: date ?? new Date(), paymentMethod: paymentMethod ?? 'UPI', notes,
      tags: tags.map((t) => t.trim()).filter(Boolean),
    });
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/transactions/:id */
router.put('/:id', idParam, txBody, handleValidation, async (req, res, next) => {
  try {
    const { type, amount, category, description, merchant = '', date, paymentMethod, notes = '', tags = [] } = req.body;
    const tx = await Transaction.findByIdAndUpdate(
      req.params.id,
      { type, amount, category, description, merchant, date, paymentMethod, notes, tags: tags.map((t) => t.trim()).filter(Boolean) },
      { new: true, runValidators: true }
    );
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/transactions/:id */
router.delete('/:id', idParam, handleValidation, async (req, res, next) => {
  try {
    const tx = await Transaction.findByIdAndDelete(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
