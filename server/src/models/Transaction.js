const mongoose = require('mongoose');
const { TRANSACTION_TYPES, ALL_CATEGORIES, PAYMENT_METHODS } = require('../config/categories');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: { values: TRANSACTION_TYPES, message: 'Type must be income or expense' },
      required: [true, 'Transaction type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
      max: [100000000, 'Amount is unrealistically large'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      validate: {
        validator: (v) => ALL_CATEGORIES.includes(v),
        message: 'Invalid category',
      },
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [1, 'Description cannot be empty'],
      maxlength: [120, 'Description must be under 120 characters'],
    },
    merchant: { type: String, trim: true, maxlength: [80, 'Merchant must be under 80 characters'], default: '' },
    date: { type: Date, required: [true, 'Date is required'], default: Date.now, index: true },
    paymentMethod: {
      type: String,
      enum: { values: PAYMENT_METHODS, message: 'Invalid payment method' },
      default: 'UPI',
    },
    notes: { type: String, trim: true, maxlength: [300, 'Notes must be under 300 characters'], default: '' },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5 && arr.every((t) => typeof t === 'string' && t.trim().length <= 24),
        message: 'Up to 5 tags, each under 24 characters',
      },
    },
  },
  { timestamps: true, versionKey: false }
);

// Compound indexes tuned for the dashboard/list query patterns
transactionSchema.index({ date: -1, _id: -1 });
transactionSchema.index({ type: 1, category: 1, date: -1 });

transactionSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);
