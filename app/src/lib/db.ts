import 'server-only';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import { env } from './env';

// One MongoClient per server instance (reused across hot reloads in dev), shared by
// Better Auth (native driver) and Mongoose (business models).
const globalForDb = globalThis as unknown as { mongoClient?: MongoClient };

export function mongoClient(): MongoClient {
  if (!globalForDb.mongoClient) {
    globalForDb.mongoClient = new MongoClient(env().MONGODB_URI, { maxPoolSize: 10 });
    mongoose.connection.setClient(globalForDb.mongoClient);
  }
  return globalForDb.mongoClient;
}

/** Call before using Mongoose models. */
export async function connectDb() {
  await mongoClient().connect();
  return mongoose.connection;
}
