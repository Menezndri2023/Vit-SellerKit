import { activeBillingProvider } from './billing/providers';

/** Public purchase / contact links, configured per environment. Missing link = button hidden. */
export function withUtm(url: string | undefined, content: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'margokit');
    u.searchParams.set('utm_medium', 'website');
    u.searchParams.set('utm_content', content);
    return u.toString();
  } catch {
    return null;
  }
}

export const links = {
  proMonthly: () => withUtm(activeBillingProvider().checkoutUrl('monthly') ?? undefined, 'pro-monthly'),
  proLifetime: () => withUtm(activeBillingProvider().checkoutUrl('lifetime') ?? undefined, 'pro-lifetime'),
  pack: () => withUtm(process.env.GUMROAD_PACK_URL, 'pack'),
  tracker: () => withUtm(process.env.GUMROAD_TRACKER_URL, 'tracker'),
  whatsapp: () => process.env.WHATSAPP_URL || null,
};
