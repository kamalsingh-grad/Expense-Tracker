/**
 * Database connection helper.
 *
 * Priority:
 *   1. MONGODB_URI (e.g. MongoDB Atlas) — for production
 *   2. In-memory MongoDB (mongodb-memory-server) — zero-config for dev/demo/test
 *
 * The in-memory mode runs a REAL MongoDB binary, so behaviour matches production.
 * Data is ephemeral there; call the seed util or set SEED_ON_START=true (default)
 * to populate demo data on boot when the database is empty.
 */
const mongoose = require('mongoose');

let memoryServer = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✓ MongoDB connected (${mongoose.connection.name})`);
    return { mode: 'external', uri };
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const memUri = memoryServer.getUri('expenseflow');
  await mongoose.connect(memUri);
  console.log('✓ MongoDB connected (in-memory instance, demo mode)');
  return { mode: 'memory', uri: memUri };
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDB, disconnectDB };
