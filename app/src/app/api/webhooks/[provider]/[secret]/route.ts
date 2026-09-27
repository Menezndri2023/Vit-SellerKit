import { billingProvider } from '@/lib/billing/providers';

/** Payment provider webhooks: /api/webhooks/<provider>/<secret> (same URL as before for Gumroad). */
export async function POST(req: Request, ctx: RouteContext<'/api/webhooks/[provider]/[secret]'>) {
  const { provider: id, secret } = await ctx.params;
  const provider = billingProvider(id);
  if (!provider) return new Response('Not found', { status: 404 });
  return provider.handleWebhook(req, secret);
}
