import 'server-only';
import { gumroadProvider } from './gumroad';
import type { BillingProvider } from './types';

/**
 * Registered payment providers. To add one (Paddle, Lemon Squeezy, Stripe, CMI…):
 * implement BillingProvider in ./<id>.ts, register it here, and point its webhook to
 * /api/webhooks/<id>/<secret>. BILLING_PROVIDER chooses which one sells Pro on the site.
 */
const PROVIDERS: Record<string, BillingProvider> = { [gumroadProvider.id]: gumroadProvider };

export const billingProvider = (id: string): BillingProvider | null => PROVIDERS[id] ?? null;

/** The provider whose checkout links are shown on the pricing page and /activate. */
export const activeBillingProvider = (): BillingProvider => PROVIDERS[process.env.BILLING_PROVIDER ?? 'gumroad'] ?? gumroadProvider;

export type { BillingProvider, Plan } from './types';
