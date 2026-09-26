import 'server-only';
import { headers } from 'next/headers';
import { RateLimit } from '@/models/RateLimit';
import { connectDb } from './db';

/**
 * Fixed-window limit stored in MongoDB, shared by all serverless instances.
 * Returns true when the request is allowed.
 */
export async function rateLimit(bucket: string, id: string, max: number, windowSeconds: number): Promise<boolean> {
  if (process.env.E2E_DISABLE_RATE_LIMIT === '1' && process.env.VERCEL_ENV !== 'production') return true;
  await connectDb();
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `${bucket}:${id}:${window}`;
  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * windowSeconds * 1000) } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return (doc?.count ?? 0) <= max;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}
