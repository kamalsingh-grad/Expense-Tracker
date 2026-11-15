process.env.TZ = process.env.TZ || 'Asia/Kolkata'; // demo data & "this month" math in IST
require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const Transaction = require('./models/Transaction');
const { seedDatabase } = require('./utils/seed');

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

(async () => {
  const { mode } = await connectDB();

  // Zero-config demo: populate realistic data when the DB is empty
  if (process.env.SEED_ON_START !== 'false') {
    const count = await Transaction.estimatedDocumentCount();
    if (count === 0) {
      console.log('Database empty — seeding 12 months of demo data…');
      await seedDatabase({ clear: false });
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`✓ ExpenseFlow server listening on http://${HOST}:${PORT} (${mode}${mode === 'memory' ? ', ephemeral demo data' : ''})`);
  });
})().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
