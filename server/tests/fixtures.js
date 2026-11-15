/** Deterministic transaction fixtures relative to "today" for stable month math */

const thisMonthAt = (day) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day);
};
const lastMonthAt = (day) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, day);
};

const sampleTransactions = () => [
  { type: 'income', amount: 100000, category: 'Salary', description: 'Salary — November', merchant: 'Acme Corp', date: thisMonthAt(1), paymentMethod: 'Net Banking', tags: ['salary'] },
  { type: 'expense', amount: 20000, category: 'Rent & Housing', description: 'Flat rent', merchant: 'GreenLeaf', date: thisMonthAt(3), paymentMethod: 'Auto Debit', tags: ['rent'] },
  { type: 'expense', amount: 800, category: 'Food & Dining', description: 'Unicorn smoothie', merchant: 'JuiceCo', date: thisMonthAt(10), paymentMethod: 'UPI', tags: ['food'] },
  { type: 'income', amount: 50000, category: 'Freelance', description: 'Side project payout', merchant: 'Client & Co', date: lastMonthAt(15), paymentMethod: 'UPI', tags: [] },
  { type: 'expense', amount: 15000, category: 'Groceries', description: 'Monthly stock-up', merchant: 'DMart', date: lastMonthAt(20), paymentMethod: 'Credit Card', tags: [] },
];

module.exports = { sampleTransactions, thisMonthAt, lastMonthAt };
