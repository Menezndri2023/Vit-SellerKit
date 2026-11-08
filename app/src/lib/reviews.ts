import 'server-only';
import { gumroadProducts } from '@/lib/billing/gumroad';
import { connectDb } from '@/lib/db';
import { BillingEvent } from '@/models/BillingEvent';
import { Document } from '@/models/Document';
import { Review } from '@/models/Review';
import { Subscription } from '@/models/Subscription';
import { KITS, publicName, saleMatchesKit, summarize, type Kit, type KitSummary, type ReviewVerification } from './reviews-shared';

export type PublicReview = {
  id: string;
  kit: Kit;
  rating: number;
  name: string;
  location?: string;
  comment: string;
  verified: ReviewVerification;
  date: Date;
};

/** Is this person a real customer / user of the kit? Computed when the review is confirmed. */
export async function verificationFor(kit: Kit, email: string, userId?: string): Promise<ReviewVerification> {
  if (kit === 'calculator') return null;
  await connectDb();
  const sales = await BillingEvent.find({ provider: 'gumroad', type: 'sale', email: email.toLowerCase(), isTest: { $ne: true } }, { productId: 1, productName: 1 }).lean();
  const ids = gumroadProducts();
  if (sales.some((s) => saleMatchesKit(kit, s, { monthly: ids.monthly, lifetime: ids.lifetime }))) return 'purchase';
  if (kit === 'pro' && userId) {
    // Pro sold by hand (WhatsApp, transfer) is a purchase too
    if (await Subscription.exists({ userId, status: { $in: ['active', 'cancelled', 'expired'] } })) return 'purchase';
    if (await Document.exists({ userId, status: { $ne: 'draft' } })) return 'user';
  }
  return null;
}

const toPublic = (r: { _id: unknown; kit: string; rating: number; name: string; location?: string | null; comment: string; verified?: string | null; approvedAt?: Date | null; createdAt?: Date }): PublicReview => ({
  id: String(r._id),
  kit: r.kit as Kit,
  rating: r.rating,
  name: publicName(r.name),
  location: r.location ?? undefined,
  comment: r.comment,
  verified: (r.verified as ReviewVerification) ?? null,
  date: r.approvedAt ?? r.createdAt ?? new Date(),
});

/** Approved reviews only, newest first. */
export async function approvedReviews({ kit, limit = 50 }: { kit?: Kit; limit?: number } = {}): Promise<PublicReview[]> {
  await connectDb();
  const rows = await Review.find({ status: 'approved', ...(kit ? { kit } : {}) })
    .sort({ approvedAt: -1 })
    .limit(limit)
    .select('kit rating name location comment verified approvedAt createdAt')
    .lean();
  return rows.map(toPublic);
}

/** Count and average of approved reviews for every kit. */
export async function reviewSummaries(): Promise<Record<Kit, KitSummary>> {
  await connectDb();
  const rows = await Review.find({ status: 'approved' }, { kit: 1, rating: 1 }).lean();
  return Object.fromEntries(KITS.map((k) => [k, summarize(k, rows.filter((r) => r.kit === k).map((r) => r.rating))])) as Record<Kit, KitSummary>;
}
