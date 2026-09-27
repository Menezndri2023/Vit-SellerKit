import { connectDb, mongoClient } from '@/lib/db';
import { recheckSubscription } from '@/lib/billing/activate';
import { safeEqual } from '@/lib/crypto';
import { planEmail, sendEmail } from '@/lib/email';
import { siteUrl } from '@/lib/site-url';
import { Subscription } from '@/models/Subscription';
import { ObjectId } from 'mongodb';

const DAY = 86_400_000;

/** Daily job (Vercel Cron): re-verify monthly subscriptions, expire ended ones, send reminders. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new Response('Unauthorized', { status: 401 });

  await connectDb();
  const now = new Date();
  const report = { rechecked: 0, expired: 0, reminders: 0 };

  const stale = await Subscription.find({ provider: 'gumroad', plan: 'monthly', status: { $in: ['active', 'cancelled'] }, $or: [{ lastCheckedAt: { $lt: new Date(now.getTime() - DAY) } }, { lastCheckedAt: null }] }).limit(50).lean();
  for (const s of stale) {
    await recheckSubscription(String(s._id)).then(() => report.rechecked++, () => undefined);
  }

  const users = mongoClient().db().collection('user');
  const url = `${await siteUrl()}/en/activate`;
  const notify = async (userId: string, kind: 'j7' | 'j1' | 'expired', date: Date) => {
    const u = await users.findOne({ _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId } as never);
    if (!u?.email) return;
    const locale = (u.uiLocale as string) ?? 'en';
    await sendEmail(planEmail(kind, locale, u.email as string, date, url.replace('/en/', `/${locale === 'fr' || locale === 'ar' ? locale : 'en'}/`)));
    report.reminders++;
  };

  // Ended subscriptions
  const ended = await Subscription.find({ status: { $in: ['active', 'cancelled'] }, expiresAt: { $ne: null, $lte: now } });
  for (const s of ended) {
    s.status = 'expired';
    await s.save();
    report.expired++;
    if (!s.remindersSent.includes('expired')) {
      await notify(s.userId, 'expired', s.expiresAt!).catch(() => undefined);
      s.remindersSent.push('expired');
      await s.save();
    }
  }

  // Reminders 7 days and 1 day before the end
  const soon = await Subscription.find({ status: { $in: ['active', 'cancelled'] }, expiresAt: { $gt: now, $lte: new Date(now.getTime() + 7 * DAY) } });
  for (const s of soon) {
    const kind = s.expiresAt!.getTime() - now.getTime() <= DAY ? 'j1' : 'j7';
    if (s.remindersSent.includes(kind)) continue;
    await notify(s.userId, kind, s.expiresAt!).catch(() => undefined);
    s.remindersSent.push(kind);
    await s.save();
  }

  return Response.json(report);
}
