// Local MongoDB for development: a single-node replica set (transactions work like on Atlas).
// Data is kept in ./.devdb between runs. Usage: npm run db
import { mkdirSync } from 'node:fs';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

mkdirSync('.devdb', { recursive: true });
const rs = await MongoMemoryReplSet.create({
  replSet: { name: 'rs0', count: 1, storageEngine: 'wiredTiger' },
  instanceOpts: [{ port: 27018, dbPath: '.devdb' }],
});
console.log(`MongoDB ready → MONGODB_URI=${rs.getUri('margokit')}`);
process.on('SIGINT', async () => {
  await rs.stop({ doCleanup: false });
  process.exit(0);
});
