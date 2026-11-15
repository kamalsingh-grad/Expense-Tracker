const fs = require('fs');
const path = require('path');

module.exports = async function globalTeardown() {
  if (globalThis.__MONGOD__) {
    await globalThis.__MONGOD__.stop();
    globalThis.__MONGOD__ = undefined;
  }
  try { fs.unlinkSync(path.join(__dirname, '.mongo-uri')); } catch { /* already gone */ }
};
