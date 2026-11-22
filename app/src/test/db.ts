/**
 * In-memory MongoDB replica set for integration tests (transactions behave like Atlas).
 * Never connects to a real database: MONGODB_URI is overwritten before the app modules load.
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let rs: MongoMemoryReplSet | undefined;

export async function startTestDb() {
  rs = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = rs.getUri('margokit_test');
  process.env.BETTER_AUTH_SECRET ??= 'test-secret-test-secret-test-secret-42';
  process.env.APP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  process.env.E2E_DISABLE_RATE_LIMIT = '1';
  const { connectDb } = await import('@/lib/db');
  const conn = await connectDb();
  // Unique indexes must exist before the concurrency tests run
  await Promise.all(Object.values(conn.models).map((m) => m.syncIndexes()));
  return conn;
}

export async function stopTestDb() {
  const { mongoClient } = await import('@/lib/db');
  await mongoClient().close();
  await rs?.stop();
}
