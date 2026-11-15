const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

/** One shared in-memory mongod for the whole suite (low memory footprint) */
module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  globalThis.__MONGOD__ = mongod;
  fs.writeFileSync(path.join(__dirname, '.mongo-uri'), mongod.getUri('expenseflow-test'));
};
