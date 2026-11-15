/**
 * Canonical category lists. The client renders icons/colours for these names;
 * keep the two in sync (client/src/lib/categories.js).
 */
const EXPENSE_CATEGORIES = [
  'Rent & Housing',
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Utilities',
  'Bills & Subscriptions',
  'Shopping',
  'Health & Medical',
  'Entertainment',
  'Investments',
  'Education',
  'Travel',
  'Gifts & Donations',
  'Personal Care',
  'Others',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Bonus',
  'Refund & Cashback',
  'Others',
];

const PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Auto Debit',
  'Wallet',
  'Cash',
];

const TRANSACTION_TYPES = ['income', 'expense'];

const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

module.exports = {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  ALL_CATEGORIES,
};
