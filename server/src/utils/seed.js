/**
 * Deterministic demo-data generator — ~12 months of realistic Indian spending.
 * Used by: `npm run seed` (wipe + reseed) and the server on first boot (only when DB is empty).
 */
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { connectDB, disconnectDB } = require('../config/db');

/* mulberry32 — tiny seeded PRNG so every fresh demo looks the same */
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rand = (rng, min, max) => min + rng() * (max - min);
const randInt = (rng, min, max) => Math.floor(rand(rng, min, max + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const chance = (rng, p) => rng() < p;
const r2 = (n) => Math.round(n); // whole rupees — realistic for UPI flows

const FOOD = [['Swiggy', 'Dinner order'], ['Zomato', 'Lunch delivery'], ['Dominos Pizza', 'Pizza night'], ['Starbucks', 'Flat white & croissant'], ['Chaayos', 'Evening chai & snacks'], ['McDonald\u2019s', 'Weekend brunch'], ['Behrouz Biryani', 'Family biryani feast'], ['Cafe Coffee Day', 'Cappuccino']];
const GROCERY = [['BigBasket', 'Weekly grocery order'], ['Blinkit', 'Instant delivery — essentials'], ['Zepto', '10-minute groceries'], ['DMart', 'Monthly stock-up'], ['Reliance Fresh', 'Vegetables & fruits']];
const TRANSPORT = [['Uber', 'Ride to office'], ['Ola', 'Cab ride'], ['Rapido', 'Bike taxi'], ['IndianOil', 'Fuel — Honda City'], ['Delhi Metro', 'Metro recharge']];
const SHOPPING = [['Amazon', 'Online order'], ['Flipkart', 'Electronics deal'], ['Myntra', 'Fashion & apparel'], ['Decathlon', 'Running shoes'], ['Ajio', 'Casual wear']];
const FUN = [['PVR Cinemas', 'Movie — evening show'], ['BookMyShow', 'Movie tickets'], ['Steam', 'Game purchase'], ['Ground Floor Bar', 'Drinks with friends']];

function buildTransactions() {
  const rng = mulberry32(20261115);
  const now = new Date();
  const txs = [];
  const add = (y, m, day, hour, minute, doc) => {
    const lastDay = new Date(y, m + 1, 0).getDate();
    const d = new Date(y, m, Math.min(day, lastDay), hour, minute);
    if (d > now) return;
    txs.push({ date: d, ...doc });
  };

  for (let back = 11; back >= 0; back -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const y = d.getFullYear();
    const m = d.getMonth();

    /* income */
    add(y, m, 1, 10, 0, { type: 'income', amount: 92000 + randInt(rng, -2000, 2000), category: 'Salary', description: 'Monthly salary — TechNova Solutions', merchant: 'TechNova Solutions Pvt Ltd', paymentMethod: 'Net Banking', notes: 'Credited for month', tags: ['salary'] });
    if (back % 4 === 1) add(y, m, 18, 14, 30, { type: 'income', amount: randInt(rng, 18000, 42000), category: 'Freelance', description: 'Freelance — analytics dashboard build', merchant: 'Upwork', paymentMethod: 'Net Banking', tags: ['freelance'] });
    if (back === 6) add(y, m, 25, 11, 0, { type: 'income', amount: 50000, category: 'Bonus', description: 'Performance bonus — H1', merchant: 'TechNova Solutions Pvt Ltd', paymentMethod: 'Net Banking', tags: ['bonus'] });
    if (chance(rng, 0.7)) add(y, m, randInt(rng, 5, 26), 16, 0, { type: 'income', amount: randInt(rng, 150, 1500), category: 'Refund & Cashback', description: pick(rng, ['Amazon refund', 'Flipkart cashback', 'Credit card cashback', 'Swiggy refund']), merchant: 'Cashback', paymentMethod: 'UPI', tags: [] });

    /* housing & core fixed costs */
    add(y, m, 3, 9, 0, { type: 'expense', amount: 16500, category: 'Rent & Housing', description: 'Apartment rent — monthly', merchant: 'GreenLeaf Residency', paymentMethod: 'Auto Debit', tags: ['rent', 'housing'] });
    add(y, m, 7, 9, 30, { type: 'expense', amount: 12000, category: 'Investments', description: 'Mutual fund SIP — Parag Parikh Flexi Cap', merchant: 'Groww', paymentMethod: 'Auto Debit', tags: ['sip', 'investment'] });
    add(y, m, 12, 19, 0, { type: 'expense', amount: randInt(rng, 1400, 3400), category: 'Utilities', description: 'Electricity bill', merchant: 'PSPCL', paymentMethod: 'UPI', tags: ['utilities'] });
    add(y, m, 15, 8, 0, { type: 'expense', amount: 799, category: 'Utilities', description: 'JioFiber broadband — monthly plan', merchant: 'Jio', paymentMethod: 'Auto Debit' });
    add(y, m, 20, 20, 0, { type: 'expense', amount: 749, category: 'Utilities', description: 'Mobile postpaid bill', merchant: 'Jio', paymentMethod: 'UPI' });

    /* subscriptions */
    add(y, m, 18, 7, 0, { type: 'expense', amount: 649, category: 'Bills & Subscriptions', description: 'Netflix — Standard plan', merchant: 'Netflix', paymentMethod: 'Credit Card', tags: ['subscription'] });
    add(y, m, 21, 7, 0, { type: 'expense', amount: 119, category: 'Bills & Subscriptions', description: 'Spotify Premium', merchant: 'Spotify', paymentMethod: 'Credit Card', tags: ['subscription'] });

    /* groceries — 4 weekly-ish runs */
    for (let g = 0; g < 4; g += 1) {
      add(y, m, [4, 11, 19, 26][g] + randInt(rng, -1, 1), randInt(rng, 8, 20), randInt(rng, 0, 59), { type: 'expense', amount: randInt(rng, 850, 2600), category: 'Groceries', description: pick(rng, GROCERY)[1], merchant: pick(rng, GROCERY)[0], paymentMethod: pick(rng, ['UPI', 'Credit Card', 'Debit Card']) });
    }

    /* food & dining — 9–13 hits, weekend-heavy */
    const foodRuns = randInt(rng, 9, 13);
    for (let f = 0; f < foodRuns; f += 1) {
      const [merchant, desc] = pick(rng, FOOD);
      add(y, m, randInt(rng, 1, 28), randInt(rng, 12, 22), randInt(rng, 0, 59), { type: 'expense', amount: randInt(rng, 160, 1250), category: 'Food & Dining', description: desc, merchant, paymentMethod: pick(rng, ['UPI', 'UPI', 'Credit Card', 'Swiggy']) });
    }

    /* transport */
    const rides = randInt(rng, 6, 9);
    for (let t = 0; t < rides; t += 1) {
      const [merchant, desc] = pick(rng, TRANSPORT);
      add(y, m, randInt(rng, 1, 28), randInt(rng, 7, 21), randInt(rng, 0, 59), { type: 'expense', amount: randInt(rng, 85, 520), category: 'Transportation', description: desc, merchant, paymentMethod: 'UPI' });
    }
    add(y, m, 25, 17, 0, { type: 'expense', amount: randInt(rng, 1800, 2600), category: 'Transportation', description: 'Fuel — IndianOil', merchant: 'IndianOil', paymentMethod: 'Credit Card' });

    /* shopping — festive uplift in Oct/Nov */
    const festive = (m === 9 || m === 10) ? 2 : 1;
    const shopRuns = randInt(rng, 2, 3) * festive;
    for (let s = 0; s < shopRuns; s += 1) {
      const [merchant, desc] = pick(rng, SHOPPING);
      add(y, m, randInt(rng, 2, 27), randInt(rng, 10, 22), randInt(rng, 0, 59), { type: 'expense', amount: randInt(rng, 750, festive > 1 ? 12000 : 6500), category: 'Shopping', description: desc, merchant, paymentMethod: pick(rng, ['Credit Card', 'UPI', 'Debit Card']) });
    }

    /* entertainment */
    if (chance(rng, 0.9)) { const [merchant, desc] = pick(rng, FUN); add(y, m, randInt(rng, 3, 27), 21, 0, { type: 'expense', amount: randInt(rng, 300, 1600), category: 'Entertainment', description: desc, merchant, paymentMethod: 'Credit Card' }); }

    /* health — occasional */
    if (chance(rng, 0.6)) add(y, m, randInt(rng, 2, 27), 11, 0, { type: 'expense', amount: randInt(rng, 220, 2400), category: 'Health & Medical', description: pick(rng, ['Pharmacy — monthly medicines', 'Doctor consultation', 'Diagnostics — blood test', 'Apollo Pharmacy']), merchant: pick(rng, ['Apollo Pharmacy', 'Practo', '1mg', 'Fortis']), paymentMethod: 'UPI' });

    /* education — rare */
    if (chance(rng, 0.35)) add(y, m, randInt(rng, 2, 27), 20, 0, { type: 'expense', amount: pick(rng, [449, 799, 1299, 2999]), category: 'Education', description: pick(rng, ['Udemy course — data engineering', 'Books — The Psychology of Money', 'Kindle edition']), merchant: pick(rng, ['Udemy', 'Amazon', 'Kindle']), paymentMethod: 'Credit Card' });

    /* misc — gifts & donations */
    if (chance(rng, 0.4)) add(y, m, randInt(rng, 2, 27), 12, 0, { type: 'expense', amount: randInt(rng, 501, 3000), category: 'Gifts & Donations', description: pick(rng, ['Birthday gift — Rohan', 'Donation — CRY', 'Wedding gift']), merchant: pick(rng, ['Amazon', 'CRY', 'Cash']), paymentMethod: pick(rng, ['UPI', 'Cash']) });
  }

  /* one big travel block, 5 months ago */
  const travel = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  add(travel.getFullYear(), travel.getMonth(), 14, 9, 30, { type: 'expense', amount: 6900, category: 'Travel', description: 'Flight — Delhi → Goa (IndiGo)', merchant: 'IndiGo', paymentMethod: 'Credit Card', tags: ['travel'] });
  add(travel.getFullYear(), travel.getMonth(), 16, 12, 0, { type: 'expense', amount: 8400, category: 'Travel', description: 'Hotel — Baga beach, 3 nights', merchant: 'MakeMyTrip', paymentMethod: 'Credit Card', tags: ['travel'] });

  return txs.sort((a, b) => a.date - b.date);
}

async function seedDatabase({ clear = true, log = true } = {}) {
  if (clear) await Transaction.deleteMany({});
  const txs = buildTransactions();
  const inserted = await Transaction.insertMany(txs, { ordered: false });
  if (log) {
    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    console.log(`✓ Seeded ${inserted.length} transactions (income ₹${income.toLocaleString('en-IN')} / spend ₹${expense.toLocaleString('en-IN')})`);
  }
  return inserted.length;
}

module.exports = { seedDatabase, buildTransactions };

/* CLI: node src/utils/seed.js — wipes and reseeds */
if (require.main === module) {
  (async () => {
    await connectDB();
    await seedDatabase({ clear: true });
    await disconnectDB();
    process.exit(0);
  })().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
}
