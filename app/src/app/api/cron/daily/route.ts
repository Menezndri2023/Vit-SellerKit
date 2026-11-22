import { connectDb, mongoClient } from '@/lib/db';
import { recheckSubscription } from '@/lib/billing/activate';
import { safeEqual } from '@/lib/crypto';
import { planEmail, sendEmail } from '@/lib/email';
import { runOnboarding } from '@/lib/onboarding';
import { runRecurring } from '@/lib/recurring';
import { runReminders } from '@/lib/reminders';
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
  const report = { rechecked: 0, expired: 0, reminders: 0, reminders_sent: 0, recurring_drafts: 0, onboarding: 0 };

  const stale = await Subscription.find({ provider: 'gumroad', plan: { $in: ['monthly', 'annual'] }, status: { $in: ['active', 'cancelled'] }, $or: [{ lastCheckedAt: { $lt: new Date(now.getTime() - DAY) } }, { lastCheckedAt: null }] }).sort({ lastCheckedAt: 1 }).limit(50).lean(); // oldest checks first, so every subscription gets its turn
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

  // Overdue invoice reminders to the users' clients (Pro, opt-in)
  report.reminders_sent = await runReminders(now).catch((e) => {
    console.error('[cron] reminders failed:', (e as Error).message);
    return 0;
  });

  // Recurring invoices: drafts ready for the user (Pro)
  report.recurring_drafts = await runRecurring(await siteUrl(), now).catch((e) => {
    console.error('[cron] recurring failed:', (e as Error).message);
    return 0;
  });

  // Getting-started emails (day 1, 4, 8 after sign-up); never blocks the billing work above
  report.onboarding = await runOnboarding(await siteUrl()).catch((e) => {
    console.error('[cron] onboarding failed:', (e as Error).message);
    return 0;
  });

  return Response.json(report);
}
