import 'server-only';
import { ObjectId } from 'mongodb';
import { mongoClient } from './db';
import { recurringReadyEmail, sendEmail } from './email';
import { hasActivePro } from './plan';
import { nextOccurrence, type Frequency } from './recurring-schedule';
import { audit } from '@/models/AuditLog';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Document } from '@/models/Document';
import { Recurrence } from '@/models/Recurrence';

const DAY = 86_400_000;
const PER_RUN = 300;

/** New draft invoice copied from the source, dated `issueDate` (due date from the payment terms). */
export async function createRecurringDraft(userId: string, sourceId: string, issueDate: Date) {
  const src = await Document.findOne({ _id: sourceId, userId }).lean();
  if (!src || !['invoice', 'deposit_invoice'].includes(src.type)) return null;
  const profile = await BusinessProfile.findOne({ userId }).select('paymentTermsDays').lean();
  return Document.create({
    userId,
    type: 'invoice',
    status: 'draft',
    clientId: src.clientId,
    issueDate,
    dueDate: new Date(issueDate.getTime() + (profile?.paymentTermsDays ?? 30) * DAY),
    currency: src.currency,
    docLocale: src.docLocale,
    operationCategory: src.operationCategory,
    buyerReference: src.buyerReference,
    notes: src.notes,
    lines: src.lines,
    totals: src.totals,
    amountDue: src.totals?.totalInclTax ?? 0,
  });
}

/**
 * Daily cron: for each active recurrence whose date has come, create the draft and email the user.
 * The date is advanced atomically first (a concurrent run can't create the same draft twice).
 * Pro is required; without Pro the recurrence waits (resumes when Pro is back).
 */
export async function runRecurring(site: string, now = new Date()): Promise<number> {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const due = await Recurrence.find({ active: true, nextDate: { $lte: today } }).limit(PER_RUN).lean();
  const users = mongoClient().db().collection('user');
  let created = 0;
  for (const r of due) {
    if (!(await hasActivePro(r.userId, now))) continue;
    const next = nextOccurrence(r.nextDate, r.frequency as Frequency);
    const claim = await Recurrence.updateOne({ _id: r._id, nextDate: r.nextDate, active: true }, { $set: { nextDate: next, lastRunAt: now } });
    if (!claim.modifiedCount) continue;
    const draft = await createRecurringDraft(r.userId, r.sourceId, r.nextDate).catch(() => null);
    if (!draft) {
      // Source invoice gone: stop this recurrence
      await Recurrence.updateOne({ _id: r._id }, { $set: { active: false } });
      continue;
    }
    await Document.updateOne({ _id: draft._id }, { $set: { recurrenceId: String(r._id) } });
    await Recurrence.updateOne({ _id: r._id }, { $inc: { createdCount: 1 }, $set: { lastDraftId: String(draft._id) } });
    await audit({ userId: r.userId, actorId: 'system', action: 'document.recurring.draft', targetType: 'document', targetId: String(draft._id), details: { recurrenceId: String(r._id) } });
    created++;
    const u = ObjectId.isValid(r.userId) ? await users.findOne({ _id: new ObjectId(r.userId) }, { projection: { email: 1, uiLocale: 1 } }) : null;
    if (u?.email) {
      const lang = u.uiLocale === 'fr' || u.uiLocale === 'ar' ? u.uiLocale : 'en';
      const src = await Document.findById(r.sourceId).select('buyer.name').lean();
      await sendEmail(recurringReadyEmail(lang, u.email as string, src?.buyer?.name ?? '', `${site}/${lang}/app/documents/${draft._id}`)).catch((e) => console.error('[recurring] email:', (e as Error).message));
    }
  }
  return created;
}
