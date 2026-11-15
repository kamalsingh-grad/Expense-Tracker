const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

beforeAll(async () => {
  const uri = fs.readFileSync(path.join(__dirname, '.mongo-uri'), 'utf8');
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
