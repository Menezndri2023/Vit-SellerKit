// Gives the admin role to an existing account (sign up in the app first, then run this).
// Usage: node --env-file=.env.local scripts/create-admin.mjs you@example.com
import { MongoClient } from 'mongodb';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs you@example.com');
  process.exit(1);
}
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');

const client = await MongoClient.connect(process.env.MONGODB_URI);
const res = await client.db().collection('user').updateOne({ email }, { $set: { role: 'admin', updatedAt: new Date() } });
await client.close();
if (res.matchedCount === 0) {
  console.error(`No account found for ${email}. Sign up in the app first, then run this script again.`);
  process.exit(1);
}
console.log(`✓ ${email} is now an admin. Sign out and back in, then open /admin.`);
