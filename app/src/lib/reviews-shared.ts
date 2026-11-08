import { z } from 'zod';

/** The four Margokit kits a review can be about. */
export const KITS = ['calculator', 'tracker', 'pack', 'pro'] as const;
export type Kit = (typeof KITS)[number];
export const isKit = (v: unknown): v is Kit => typeof v === 'string' && (KITS as readonly string[]).includes(v);

export const REVIEW_STATUSES = ['unconfirmed', 'pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** 'purchase' = bought on Gumroad (or paid Pro), 'user' = signed-in Margokit Pro user who issued documents. */
export type ReviewVerification = 'purchase' | 'user' | null;

const optionalText = (max: number) => z.string().trim().max(max, 'tooLong').optional().transform((v) => v || undefined);

/** Form validation. Error messages are keys of the `errors` / `reviews.errors` translation namespaces. */
export const reviewFormSchema = z.object({
  kit: z.enum(KITS, 'required'),
  rating: z.coerce.number('rating').int('rating').min(1, 'rating').max(5, 'rating'),
  name: z.string().trim().min(2, 'required').max(60, 'tooLong'),
  location: optionalText(60),
  comment: z.string().trim().min(20, 'commentTooShort').max(1000, 'tooLong'),
  email: z.union([z.literal(''), z.email('invalidEmail').max(254, 'tooLong')]).optional().transform((v) => v?.toLowerCase() || undefined),
  consent: z.literal('on', 'consent'),
  /** Honeypot: humans never see this field */
  website: z.string().max(0).optional(),
});
export type ReviewForm = z.infer<typeof reviewFormSchema>;

/** Public name: first name + initial of the last name ("Salma Bennani" → "Salma B."). */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

type Sale = { productId?: string | null; productName?: string | null };

/** Does a Gumroad sale correspond to this kit? Pro products are recognised by ID, templates by product name. */
export function saleMatchesKit(kit: Kit, sale: Sale, proIds: { monthly?: string; lifetime?: string }): boolean {
  const name = (sale.productName ?? '').toLowerCase();
  switch (kit) {
    case 'pro':
      return Boolean(sale.productId && (sale.productId === proIds.monthly || sale.productId === proIds.lifetime)) || name.includes('margokit pro');
    case 'pack':
      return name.includes('seller pack') || name.includes('pack vendeur');
    case 'tracker':
      return name.includes('tracker') && !name.includes('seller pack') && !name.includes('pack vendeur');
    default:
      return false;
  }
}

export type KitSummary = { kit: Kit; count: number; average: number | null };

/** Average rounded to one decimal; null when there is no review. */
export function summarize(kit: Kit, ratings: number[]): KitSummary {
  if (!ratings.length) return { kit, count: 0, average: null };
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return { kit, count: ratings.length, average: Math.round(avg * 10) / 10 };
}
