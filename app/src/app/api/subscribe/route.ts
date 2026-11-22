import { clientIp, rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const bodySchema = z.object({
  email: z.email().max(254),
  locale: z.enum(['en', 'fr', 'ar']).catch('en'),
  source: z.string().max(40).catch('calculator'),
  /** Honeypot field: must stay empty */
  website: z.string().max(0).nullish(),
});

export async function POST(request: Request) {
  // 5 requests / minute / IP, shared by all serverless instances (MongoDB)
  if (!(await rateLimit('subscribe', await clientIp(), 5, 60))) return Response.json({ error: 'rate_limited' }, { status: 429 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 });

  const { email, locale, source } = parsed.data;
  const webhook = process.env.SUBSCRIBE_WEBHOOK_URL;
  if (!webhook) {
    console.warn('[subscribe] SUBSCRIBE_WEBHOOK_URL is not set — email not stored');
    // Never show a false "subscribed" confirmation in production
    if (process.env.VERCEL_ENV === 'production') return Response.json({ error: 'upstream' }, { status: 503 });
    return Response.json({ ok: true });
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.SUBSCRIBE_WEBHOOK_SECRET, email: email.toLowerCase(), locale, source }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);

  if (!res?.ok) return Response.json({ error: 'upstream' }, { status: 502 });
  return Response.json({ ok: true });
}
