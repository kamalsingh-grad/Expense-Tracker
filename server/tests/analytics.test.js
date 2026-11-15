const request = require('supertest');
const app = require('../src/app');
const Transaction = require('../src/models/Transaction');
const { sampleTransactions } = require('./fixtures');

describe('GET /api/analytics/summary', () => {
  beforeEach(() => Transaction.insertMany(sampleTransactions()));

  it('computes balance, savings rate and this-month figures', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);

    // all-time fixtures: income 150000, expense 35800
    expect(res.body.totalIncome).toBe(150000);
    expect(res.body.totalExpense).toBe(35800);
    expect(res.body.totalBalance).toBe(114200);
    expect(res.body.transactionCount).toBe(5);
    expect(res.body.savingsRate).toBeCloseTo(76.1, 0);

    // this month only: income 100000, expense 20800
    expect(res.body.month.income).toBe(100000);
    expect(res.body.month.expense).toBe(20800);
    expect(res.body.month.savings).toBe(79200);
    expect(typeof res.body.month.incomeChange === 'number' || res.body.month.incomeChange === null).toBe(true);
    expect(res.body.topCategory.category).toBe('Rent & Housing');
  });

  it('handles an empty database without dividing by zero', async () => {
    await Transaction.deleteMany({});
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ totalBalance: 0, totalIncome: 0, totalExpense: 0, transactionCount: 0, savingsRate: 0 });
    expect(res.body.month.savingsRate).toBe(0);
  });
});

describe('GET /api/analytics/monthly', () => {
  beforeEach(() => Transaction.insertMany(sampleTransactions()));

  it('returns exactly `months` entries ending at the current month', async () => {
    const res = await request(app).get('/api/analytics/monthly?months=6');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(6);
    const now = new Date();
    const expectedKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(res.body[res.body.length - 1].month).toBe(expectedKey);
    // fixtures put salary in the current month
    expect(res.body[res.body.length - 1].income).toBe(100000);
  });

  it('fills missing months with zeros and validates bounds', async () => {
    const bad = await request(app).get('/api/analytics/monthly?months=99');
    expect(bad.status).toBe(400);
    const res = await request(app).get('/api/analytics/monthly?months=12');
    const zeros = res.body.filter((m) => m.income === 0 && m.expense === 0);
    expect(zeros.length).toBeGreaterThanOrEqual(9);
  });
});

describe('GET /api/analytics/categories', () => {
  beforeEach(() => Transaction.insertMany(sampleTransactions()));

  it('returns percentages summing to ~100 with correct totals', async () => {
    const res = await request(app).get('/api/analytics/categories?type=expense&months=12');
    expect(res.status).toBe(200);
    const { categories, total } = res.body;
    expect(total).toBe(35800);
    expect(categories.map((c) => c.category)).toEqual(expect.arrayContaining(['Rent & Housing', 'Groceries', 'Food & Dining']));
    const pct = categories.reduce((s, c) => s + c.percentage, 0);
    expect(pct).toBeGreaterThan(99);
    expect(pct).toBeLessThanOrEqual(100.01);
    // sorted descending by amount
    const amounts = categories.map((c) => c.amount);
    expect([...amounts]).toEqual([...amounts].sort((a, b) => b - a));
  });

  it('supports income breakdown', async () => {
    const res = await request(app).get('/api/analytics/categories?type=income&months=12');
    expect(res.body.type).toBe('income');
    expect(res.body.total).toBe(150000);
  });

  it('rejects invalid type', async () => {
    const res = await request(app).get('/api/analytics/categories?type=bitcoin');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/analytics/daily', () => {
  beforeEach(() => Transaction.insertMany(sampleTransactions()));

  it('returns one entry per requested day, newest last', async () => {
    const res = await request(app).get('/api/analytics/daily?days=30');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(30);
    const dates = res.body.map((d) => d.date);
    expect([...dates]).toEqual([...dates].sort());
    const sumIncome = res.body.reduce((s, d) => s + d.income, 0);
    expect(sumIncome).toBe(100000); // last-month rows excluded
  });

  it('enforces the 7..90 day bounds', async () => {
    const res = await request(app).get('/api/analytics/daily?days=365');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/analytics/recent', () => {
  beforeEach(() => Transaction.insertMany(sampleTransactions()));

  it('returns latest N transactions shaped with id', async () => {
    const res = await request(app).get('/api/analytics/recent?limit=3');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].id).toBeDefined();
    const dates = res.body.map((t) => new Date(t.date).getTime());
    expect([...dates]).toEqual([...dates].sort((a, b) => b - a));
  });
});
