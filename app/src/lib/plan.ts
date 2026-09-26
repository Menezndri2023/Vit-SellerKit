import 'server-only';
import { Document } from '@/models/Document';
import { Subscription, type SubscriptionDoc } from '@/models/Subscription';
import { recheckSubscription } from './billing/activate';

export const FREE_MONTHLY_LIMIT = 3;
const DAY = 86_400_000;

export type PlanInfo = {
  plan: 'free' | 'pro';
  subscription: (SubscriptionDoc & { _id: unknown }) | null;
  /** Documents issued this calendar month (UTC) */
  used: number;
  limit: number | null;
  expiresAt: Date | null;
  expiringSoon: boolean;
};

const monthStart = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
};

/** Has access now: active or cancelled-but-paid, and not past its end date. */
export const grantsAccess = (s: Pick<SubscriptionDoc, 'status' | 'expiresAt'>, now = new Date()) =>
  (s.status === 'active' || s.status === 'cancelled') && (!s.expiresAt || new Date(s.expiresAt) > now);

export async function getPlan(userId: string): Promise<PlanInfo> {
  const subs = await Subscription.find({ userId, status: { $in: ['active', 'cancelled'] } }).lean();
  // Monthly Gumroad subscriptions are re-verified at most once a day (cancellations, failed payments)
  for (const s of subs) {
    if (s.provider === 'gumroad' && s.plan === 'monthly' && (!s.lastCheckedAt || Date.now() - new Date(s.lastCheckedAt).getTime() > DAY)) {
      await recheckSubscription(String(s._id)).catch(() => undefined);
    }
  }
  const fresh = subs.length ? await Subscription.find({ userId, status: { $in: ['active', 'cancelled'] } }).lean() : [];
  const active = fresh.filter((s) => grantsAccess(s));
  // Prefer no end date (lifetime/renewing), then the latest end date
  active.sort((a, b) => (a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity) - (b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity)).reverse();
  const best = active[0] ?? null;
  const used = await Document.countDocuments({ userId, issuedAt: { $gte: monthStart() } });
  const expiresAt = best?.expiresAt ? new Date(best.expiresAt) : null;
  return {
    plan: best ? 'pro' : 'free',
    subscription: best,
    used,
    limit: best ? null : FREE_MONTHLY_LIMIT,
    expiresAt,
    expiringSoon: Boolean(expiresAt && expiresAt.getTime() - Date.now() < 7 * DAY),
  };
}

export type PlanCheck = { allowed: boolean; watermark: boolean; used: number; limit: number | null };

/** Free plan: 3 issued documents per month, with the "Made with Margokit" watermark. */
export async function checkIssueAllowed(userId: string): Promise<PlanCheck> {
  const p = await getPlan(userId);
  if (p.plan === 'pro') return { allowed: true, watermark: false, used: p.used, limit: null };
  return { allowed: p.used < FREE_MONTHLY_LIMIT, watermark: true, used: p.used, limit: FREE_MONTHLY_LIMIT };
}
