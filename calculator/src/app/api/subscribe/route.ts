import { z } from 'zod';

const bodySchema = z.object({
  email: z.email().max(254),
  locale: z.enum(['en', 'fr']).catch('en'),
  source: z.string().max(40).catch('calculator'),
  /** Honeypot field: must stay empty */
  website: z.string().max(0).nullish(),
});

// Best-effort limit: 5 requests / minute / IP. Each serverless instance has its own memory,
// so this stops bursts, not a determined attacker.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 10_000) hits.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 });

  const { email, locale, source } = parsed.data;
  const webhook = process.env.SUBSCRIBE_WEBHOOK_URL;
  if (!webhook) {
    console.warn('[subscribe] SUBSCRIBE_WEBHOOK_URL is not set — email not stored');
    return Response.json({ ok: true });
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.SUBSCRIBE_WEBHOOK_SECRET, email: email.toLowerCase(), locale, source }),
  }).catch(() => null);

  // Apps Script répond 200 même en cas d'erreur (page HTML) ou de secret refusé ({ ok: false })
  const stored = res?.ok && (await res.json().catch(() => null))?.ok === true;
  if (!stored) return Response.json({ error: 'upstream' }, { status: 502 });
  return Response.json({ ok: true });
}
