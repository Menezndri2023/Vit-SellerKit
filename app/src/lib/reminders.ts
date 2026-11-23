import 'server-only';
import { ObjectId } from 'mongodb';
import { mongoClient } from './db';
import { getOrCreateShareToken, publicUrl } from './documents/share';
import { todayIn } from './documents/service';
import { reminderEmail, sendEmail } from './email';
import { formatMinor } from './money';
import { hasActivePro } from './plan';
import { nextReminderStep } from './reminders-schedule';
import { audit } from '@/models/AuditLog';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Document } from '@/models/Document';

const PER_USER = 50;
const PER_RUN = 300;

/**
 * Daily cron: sends the overdue reminders that are due. Only for Pro users who switched reminders
 * on, invoices that are issued/sent, unpaid, past due, with a client email, and not opted out.
 * Each reminder is claimed in the database before sending, so a reminder is never sent twice.
 */
export async function runReminders(now = new Date()): Promise<number> {
  const profiles = await BusinessProfile.find({ 'reminders.enabled': true }).select('userId legalName tradeName email').lean();
  const users = mongoClient().db().collection('user');
  let sent = 0;
  for (const profile of profiles) {
    if (sent >= PER_RUN) break;
    if (!(await hasActivePro(profile.userId, now))) continue;
    const u = ObjectId.isValid(profile.userId) ? await users.findOne({ _id: new ObjectId(profile.userId) }, { projection: { timeZone: 1 } }) : null;
    const today = todayIn(u?.timeZone as string | undefined, now);
    const docs = await Document.find({
      userId: profile.userId,
      type: { $in: ['invoice', 'deposit_invoice'] },
      status: { $in: ['issued', 'sent'] },
      amountDue: { $gt: 0 },
      dueDate: { $lt: today },
      'reminders.disabled': { $ne: true },
      'buyer.email': { $nin: [null, ''] },
    })
      .limit(PER_USER)
      .lean();
    for (const d of docs) {
      const step = nextReminderStep(d.dueDate, today, (d.reminders?.sent ?? []).map((s) => s.step ?? 0));
      if (!step) continue;
      const to = d.buyer!.email!;
      // Claim first (atomic): a concurrent run can't send the same reminder
      const claim = await Document.updateOne({ _id: d._id, 'reminders.sent.step': { $ne: step } }, { $push: { 'reminders.sent': { step, at: now, to } } });
      if (!claim.modifiedCount) continue;
      try {
        const token = await getOrCreateShareToken(profile.userId, String(d._id));
        const lang = d.docLocale === 'fr' ? 'fr' : 'en';
        const intl = lang === 'fr' ? 'fr-FR' : 'en-GB';
        await sendEmail(
          reminderEmail(step, lang, {
            to,
            seller: profile.tradeName || profile.legalName,
            sellerEmail: profile.email ?? undefined,
            number: d.number ?? '',
            amount: formatMinor(d.amountDue ?? 0, d.currency, intl),
            due: new Intl.DateTimeFormat(intl, { dateStyle: 'long', timeZone: 'UTC' }).format(d.dueDate!),
            url: await publicUrl(token!, lang),
          }),
        );
        await audit({ userId: profile.userId, actorId: 'system', action: 'document.reminder', targetType: 'document', targetId: String(d._id), details: { step, to } });
        sent++;
      } catch (e) {
        // Not sent: release the claim so tomorrow's run tries again
        await Document.updateOne({ _id: d._id }, { $pull: { 'reminders.sent': { step } } });
        console.error('[reminders] not sent:', (e as Error).message);
      }
    }
  }
  return sent;
}
