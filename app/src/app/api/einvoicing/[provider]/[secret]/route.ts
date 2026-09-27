import { safeEqual } from '@/lib/crypto';
import { connectDb } from '@/lib/db';
import { einvoicingProvider } from '@/lib/einvoice/providers';
import { applyWebhookEvent } from '@/lib/einvoice/transmit';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/** Lifecycle status updates pushed by the e-invoicing platform. Secret URL; providers may add signatures. */
export async function POST(req: Request, ctx: RouteContext<'/api/einvoicing/[provider]/[secret]'>) {
  const { provider: providerId, secret } = await ctx.params;
  const provider = einvoicingProvider();
  const expected = process.env.EINVOICE_WEBHOOK_SECRET;
  if (!provider || provider.id !== providerId || !expected || !safeEqual(secret, expected)) return new Response('Not found', { status: 404 });
  if (!(await rateLimit('webhook-einvoice', await clientIp(), 300, 60))) return new Response('Too many requests', { status: 429 });
  const parsed = provider.parseWebhook(await req.json().catch(() => null));
  if (!parsed) return new Response('Bad request', { status: 400 });
  await connectDb();
  await applyWebhookEvent(parsed.providerId, parsed.event);
  return new Response('OK');
}
