import 'server-only';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import { env } from './env';

// One MongoClient per server instance (reused across hot reloads in dev), shared by
// Better Auth (native driver, connects lazily) and Mongoose (business models).
const globalForDb = globalThis as unknown as { mongoClient?: MongoClient; mongooseReady?: Promise<typeof mongoose.connection> };

export function mongoClient(): MongoClient {
  globalForDb.mongoClient ??= new MongoClient(env().MONGODB_URI, { maxPoolSize: 10 });
  return globalForDb.mongoClient;
}

/** Call before using Mongoose models. Mongoose can only adopt an already-connected client. */
export function connectDb() {
  globalForDb.mongooseReady ??= mongoClient()
    .connect()
    .then((client) => {
      mongoose.connection.setClient(client);
      return mongoose.connection;
    })
    .catch((error) => {
      globalForDb.mongooseReady = undefined;
      throw error;
    });
  return globalForDb.mongooseReady;
}
