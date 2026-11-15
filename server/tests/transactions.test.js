const request = require('supertest');
const app = require('../src/app');
const Transaction = require('../src/models/Transaction');
const { sampleTransactions } = require('./fixtures');

const seed = () => Transaction.insertMany(sampleTransactions());

describe('GET /api/health', () => {
  it('returns ok with environment metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.env).toBe('test');
  });
});

describe('POST /api/transactions', () => {
  const valid = { type: 'expense', amount: 420, category: 'Food & Dining', description: 'Pizza test', merchant: 'Pizzeria', date: new Date().toISOString(), paymentMethod: 'UPI', tags: ['pizza'] };

  it('creates a transaction and returns 201 with id', async () => {
    const res = await request(app).post('/api/transactions').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body._id).toBeUndefined();
    expect(res.body.amount).toBe(420);
  });

  it.each([
    ['missing amount', { ...valid, amount: undefined }],
    ['negative amount', { ...valid, amount: -5 }],
    ['zero amount', { ...valid, amount: 0 }],
    ['unknown type', { ...valid, type: 'transfer' }],
    ['invalid category', { ...valid, category: 'Not A Category' }],
    ['empty description', { ...valid, description: '' }],
    ['overlong description', { ...valid, description: 'x'.repeat(121) }],
    ['bad date', { ...valid, date: 'not-a-date' }],
    ['bad payment method', { ...valid, paymentMethod: 'Barter' }],
    ['too many tags', { ...valid, tags: ['1', '2', '3', '4', '5', '6'] }],
  ])('rejects %s with 400', async (_label, body) => {
    const cleaned = JSON.parse(JSON.stringify(body));
    const res = await request(app).post('/api/transactions').send(cleaned);
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('defaults payment method to UPI and tags to []', async () => {
    const { paymentMethod, tags, ...rest } = valid;
    const res = await request(app).post('/api/transactions').send(rest);
    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe('UPI');
    expect(res.body.tags).toEqual([]);
  });
});

describe('GET /api/transactions', () => {
  beforeEach(seed);

  it('returns all 5 with pagination meta', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10, total: 5, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  });

  it('paginates without overlap between pages', async () => {
    const p1 = await request(app).get('/api/transactions?limit=2&page=1&sortBy=date&sortOrder=asc');
    const p2 = await request(app).get('/api/transactions?limit=2&page=2&sortBy=date&sortOrder=asc');
    const ids1 = p1.body.data.map((t) => t.id);
    const ids2 = p2.body.data.map((t) => t.id);
    expect(p1.body.data).toHaveLength(2);
    expect(p2.body.data).toHaveLength(2);
    expect(ids1.filter((id) => ids2.includes(id))).toHaveLength(0);
    expect(p1.body.meta.hasNextPage).toBe(true);
    expect(p2.body.meta.hasPrevPage).toBe(true);
  });

  it('filters by type', async () => {
    const res = await request(app).get('/api/transactions?type=income');
    expect(res.status).toBe(200);
    expect(res.body.data.every((t) => t.type === 'income')).toBe(true);
    expect(res.body.meta.total).toBe(2);
  });

  it('filters by category', async () => {
    const res = await request(app).get(`/api/transactions?category=${encodeURIComponent('Rent & Housing')}`);
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].category).toBe('Rent & Housing');
  });

  it('searches across description/merchant/notes case-insensitively', async () => {
    const res = await request(app).get('/api/transactions?search=unicorn');
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].description).toBe('Unicorn smoothie');
  });

  it('treats regex metacharacters in search as literal text', async () => {
    const res = await request(app).get('/api/transactions?search=.*');
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });

  it('filters by date range (inclusive)', async () => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const res = await request(app).get(`/api/transactions?startDate=${firstOfMonth}`);
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3); // 5 − 2 last-month rows
    expect(res.body.data.every((t) => new Date(t.date) >= new Date(firstOfMonth))).toBe(true);
  });

  it('filters by amount range', async () => {
    const res = await request(app).get('/api/transactions?minAmount=10000&maxAmount=60000');
    expect(res.status).toBe(200);
    expect(res.body.data.every((t) => t.amount >= 10000 && t.amount <= 60000)).toBe(true);
    expect(res.body.meta.total).toBe(3);
  });

  it('sorts by amount ascending and descending', async () => {
    const asc = await request(app).get('/api/transactions?sortBy=amount&sortOrder=asc');
    const desc = await request(app).get('/api/transactions?sortBy=amount&sortOrder=desc');
    const ascAmounts = asc.body.data.map((t) => t.amount);
    const descAmounts = desc.body.data.map((t) => t.amount);
    expect([...ascAmounts]).toEqual([...ascAmounts].sort((a, b) => a - b));
    expect([...descAmounts]).toEqual([...descAmounts].sort((a, b) => b - a));
  });

  it('rejects invalid sortBy with 400', async () => {
    const res = await request(app).get('/api/transactions?sortBy=password');
    expect(res.status).toBe(400);
  });

  it('rejects limit above 100 with 400', async () => {
    const res = await request(app).get('/api/transactions?limit=500');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/transactions/:id', () => {
  it('returns a single transaction', async () => {
    const [tx] = await Transaction.insertMany(sampleTransactions());
    const res = await request(app).get(`/api/transactions/${tx._id}`);
    expect(res.status).toBe(200);
    expect(res.body.description).toBe(tx.description);
  });

  it('400s on malformed id', async () => {
    const res = await request(app).get('/api/transactions/not-an-id');
    expect(res.status).toBe(400);
  });

  it('404s on well-formed but missing id', async () => {
    const res = await request(app).get('/api/transactions/64b64b64b64b64b64b64b64b');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/transactions/:id', () => {
  const update = { type: 'expense', amount: 999, category: 'Groceries', description: 'Updated description', date: new Date().toISOString(), paymentMethod: 'UPI' };

  it('updates and returns the transaction', async () => {
    const [tx] = await Transaction.insertMany(sampleTransactions());
    const res = await request(app).put(`/api/transactions/${tx._id}`).send(update);
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(999);
    expect(res.body.description).toBe('Updated description');
  });

  it('400s on validation failure', async () => {
    const [tx] = await Transaction.insertMany(sampleTransactions());
    const res = await request(app).put(`/api/transactions/${tx._id}`).send({ ...update, amount: -1 });
    expect(res.status).toBe(400);
  });

  it('404s on missing record', async () => {
    const res = await request(app).put('/api/transactions/64b64b64b64b64b64b64b64b').send(update);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/transactions', () => {
  it('deletes a single transaction by id', async () => {
    const [tx] = await Transaction.insertMany(sampleTransactions());
    const res = await request(app).delete(`/api/transactions/${tx._id}`);
    expect(res.status).toBe(200);
    expect(await Transaction.findById(tx._id)).toBeNull();
  });

  it('404s when deleting a missing transaction', async () => {
    const res = await request(app).delete('/api/transactions/64b64b64b64b64b64b64b64b');
    expect(res.status).toBe(404);
  });

  it('bulk deletes only the requested ids', async () => {
    const txs = await Transaction.insertMany(sampleTransactions());
    const ids = txs.slice(0, 3).map((t) => t._id.toString());
    const res = await request(app).delete('/api/transactions').send({ ids });
    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(3);
    expect(await Transaction.countDocuments()).toBe(2);
  });

  it('rejects bulk delete with non-id values', async () => {
    const res = await request(app).delete('/api/transactions').send({ ids: ['nope'] });
    expect(res.status).toBe(400);
  });
});

describe('unknown routes', () => {
  it('returns JSON 404 for unmatched API paths', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});
