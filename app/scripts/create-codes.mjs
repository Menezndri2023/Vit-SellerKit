// Generate manual activation codes (for WhatsApp / bank transfer sales).
// Usage: node --env-file=.env.local scripts/create-codes.mjs --count 5 --days 30 --note "WhatsApp mai"
//        node --env-file=.env.local scripts/create-codes.mjs --count 1 --lifetime --note "Salma B."
// Codes are printed ONCE and stored hashed (HMAC-SHA256 with APP_ENCRYPTION_KEY). Keep the output safe.
import { createHmac, randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { MongoClient } from 'mongodb';

const { values } = parseArgs({
  options: { count: { type: 'string', default: '1' }, days: { type: 'string', default: '30' }, lifetime: { type: 'boolean', default: false }, note: { type: 'string', default: '' }, batch: { type: 'string' } },
});

const key = Buffer.from(process.env.APP_ENCRYPTION_KEY ?? '', 'base64');
if (key.length !== 32) throw new Error('APP_ENCRYPTION_KEY must be 32 bytes (base64)');
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function generateCode() {
  let out = '';
  while (out.length < 12) for (const b of randomBytes(24)) if (b < 248 && out.length < 12) out += ALPHABET[b % 31];
  return `MK-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8)}`;
}

const count = Math.min(Math.max(Number(values.count) || 1, 1), 500);
const durationDays = values.lifetime ? null : Math.min(Math.max(Number(values.days) || 30, 1), 3650);
const batch = values.batch ?? `cli-${new Date().toISOString().slice(0, 10)}`;

const client = await MongoClient.connect(process.env.MONGODB_URI);
const codes = Array.from({ length: count }, generateCode);
await client
  .db()
  .collection('activationcodes')
  .insertMany(codes.map((c) => ({ codeHash: createHmac('sha256', key).update(c).digest('hex'), hint: c.slice(-4), batch, durationDays, note: values.note || undefined, createdBy: 'cli', createdAt: new Date(), updatedAt: new Date() })));
await client.close();

console.log(`\n${count} code(s) — ${durationDays ? `${durationDays} days` : 'lifetime'} — batch ${batch}\n`);
for (const c of codes) console.log(c);
console.log('');
