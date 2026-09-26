/**
 * Interprets Gumroad's license verification response (POST /v2/licenses/verify).
 * Pure function, unit-tested with recorded response shapes. Field names follow Gumroad's API;
 * re-check them against https://gumroad.com/api when upgrading.
 */
export type GumroadPurchase = {
  product_id?: string;
  email?: string;
  sale_id?: string;
  subscription_id?: string | null;
  recurrence?: string | null;
  refunded?: boolean;
  disputed?: boolean;
  dispute_won?: boolean;
  chargebacked?: boolean;
  subscription_ended_at?: string | null;
  subscription_cancelled_at?: string | null;
  subscription_failed_at?: string | null;
  test?: boolean;
  price?: number;
  currency?: string;
  ip_country?: string;
};

export type GumroadVerifyResponse = { success: boolean; uses?: number; message?: string; purchase?: GumroadPurchase };

export type LicenseStatus =
  | { valid: false; reason: 'not_found' | 'refunded' | 'ended' | 'payment_failed' | 'wrong_product' }
  | { valid: true; plan: 'monthly' | 'lifetime'; status: 'active' | 'cancelled'; saleId?: string; subscriptionId?: string; email?: string; endsAt: Date | null };

export function evaluateLicense(res: GumroadVerifyResponse, products: { monthly?: string; lifetime?: string }, now = new Date()): LicenseStatus {
  const p = res.purchase;
  if (!res.success || !p) return { valid: false, reason: 'not_found' };
  const plan = p.product_id && p.product_id === products.monthly ? 'monthly' : p.product_id && p.product_id === products.lifetime ? 'lifetime' : null;
  if (!plan) return { valid: false, reason: 'wrong_product' };
  if (p.refunded || p.chargebacked || (p.disputed && !p.dispute_won)) return { valid: false, reason: 'refunded' };

  const base = { saleId: p.sale_id, subscriptionId: p.subscription_id ?? undefined, email: p.email };
  if (plan === 'lifetime') return { valid: true, plan, status: 'active', endsAt: null, ...base };

  const ended = p.subscription_ended_at ? new Date(p.subscription_ended_at) : null;
  if (ended && ended <= now) return { valid: false, reason: 'ended' };
  if (p.subscription_failed_at) return { valid: false, reason: 'payment_failed' };
  // Cancelled subscriptions keep access until the end of the paid period
  return { valid: true, plan, status: p.subscription_cancelled_at ? 'cancelled' : 'active', endsAt: ended, ...base };
}
