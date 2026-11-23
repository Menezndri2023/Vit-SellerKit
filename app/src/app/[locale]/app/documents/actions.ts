'use server';

import mongoose, { isValidObjectId } from 'mongoose';
import { refresh } from 'next/cache';
import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import en from '../../../../../messages/en.json';
import fr from '../../../../../messages/fr.json';
import { connectDb } from '@/lib/db';
import { checkCompliance, type Issue } from '@/lib/documents/compliance';
import { draftSchema } from '@/lib/documents/draft-schema';
import { counterPeriod, formatNumber } from '@/lib/documents/numbering';
import { applyCreditNote, buyerSnapshot, derive, findOwned, sellerSnapshot, todayIn } from '@/lib/documents/service';
import { fieldErrors, type FormState } from '@/lib/forms';
import { layout, sendEmail } from '@/lib/email';
import { loadDocView } from '@/lib/documents/load';
import { getOrCreateShareToken, publicUrl } from '@/lib/documents/share';
import { formatMinor, parseAmount } from '@/lib/money';
import { pdfFileName, renderDocumentPdf } from '@/lib/pdf/render';
import { refreshLifecycle, reportCashed, transmitDocument } from '@/lib/einvoice/transmit';
import { rateLimit } from '@/lib/rate-limit';
import { checkIssueAllowed, enforceFreeQuota, hasActivePro } from '@/lib/plan';
import { FREQUENCIES, type Frequency } from '@/lib/recurring-schedule';
import { Recurrence } from '@/models/Recurrence';
import { actionUser } from '@/lib/session';
import { audit } from '@/models/AuditLog';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Client } from '@/models/Client';
import { nextSeq } from '@/models/Counter';
import { Document, type DocStatus, type DocType } from '@/models/Document';

const day = (iso: string | undefined) => (iso ? new Date(`${iso}T00:00:00Z`) : undefined);

/** Create or update a draft. Issued documents can never be edited (fix them with a credit note). */
export async function saveDraft(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await actionUser();
  const locale = String(form.get('locale') ?? 'en');
  let payload: unknown;
  try {
    payload = JSON.parse(String(form.get('payload') ?? '{}'));
  } catch {
    return { errors: { _form: 'invalid' } };
  }
  const parsed = draftSchema.safeParse(payload);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  await connectDb();
  if (d.clientId && !(await Client.exists({ _id: d.clientId, userId: user.id }))) return { errors: { clientId: 'notFound' } };

  const base = { lines: d.lines, payments: [], type: d.type, status: 'draft' };
  const derived = derive(base);
  const fields = {
    type: d.type,
    clientId: d.clientId,
    issueDate: day(d.issueDate)!,
    dueDate: day(d.dueDate),
    validUntil: d.type === 'quote' ? day(d.validUntil) : undefined,
    serviceDate: day(d.serviceDate),
    currency: d.currency,
    docLocale: d.docLocale,
    buyerReference: d.buyerReference || undefined,
    notes: d.notes || undefined,
    lines: d.lines.map((l, i) => ({ ...l, net: derived.lineNets[i] })),
    totals: derived.totals,
    operationCategory: derived.operationCategory,
    amountDue: derived.amountDue,
  };

  let id = d.id;
  if (id) {
    const res = await Document.updateOne({ _id: id, userId: user.id, status: 'draft' }, { $set: fields }, { runValidators: true });
    if (res.matchedCount === 0) return { errors: { _form: 'locked' } };
  } else {
    const created = await Document.create({ ...fields, userId: user.id, status: 'draft' });
    id = String(created._id);
    await audit({ userId: user.id, actorId: user.id, action: 'document.create', targetType: 'document', targetId: id, details: { type: d.type } });
  }
  redirect({ href: `/app/documents/${id}`, locale });
  return { ok: true, id };
}

/** `confirm`: only warnings were found — nothing issued yet, the user must confirm to go ahead. */
export type IssueResult = { issues?: Issue[]; error?: string; confirm?: boolean };

/**
 * Issue a draft: compliance checks, then — in one transaction — take the next number,
 * freeze seller and buyer details, and lock the document.
 */
export async function issueDocument(id: string, locale: string, acknowledgeWarnings = false): Promise<IssueResult> {
  const user = await actionUser();
  await connectDb();
  const doc = await findOwned(user.id, id);
  if (!doc) return { error: 'notFound' };
  if (doc.status !== 'draft') return { error: 'locked' };

  const [profile, client] = await Promise.all([
    BusinessProfile.findOne({ userId: user.id }).lean(),
    doc.clientId ? Client.findOne({ _id: doc.clientId, userId: user.id }).lean() : null,
  ]);
  const seller = profile ? sellerSnapshot(profile) : null;
  const buyer = client ? buyerSnapshot(client) : null;
  const issues = checkCompliance({
    type: doc.type,
    seller,
    buyer,
    lines: doc.lines.map((l) => ({ vatCategory: l.vatCategory as 'S', taxRate: l.taxRate ?? 0, exemptionReason: l.exemptionReason ?? undefined })),
    dueDate: doc.dueDate,
    totalInclTax: doc.totals?.totalInclTax ?? 0,
  });
  if (issues.some((i) => i.severity === 'error')) return { issues };
  // Warnings (e.g. Moroccan IF / business tax number missing) are shown before anything is issued:
  // issuing redirects, so a warning returned with a successful issue would never be seen
  if (!acknowledgeWarnings && issues.some((i) => i.severity === 'warning')) return { issues, confirm: true };

  const plan = await checkIssueAllowed(user.id);
  if (!plan.allowed) return { error: 'planLimit' };

  const pattern = profile!.numbering?.[doc.type === 'deposit_invoice' ? 'invoice' : doc.type] ?? 'DOC-{YYYY}-{SEQ:3}';
  const series = doc.type === 'deposit_invoice' ? 'invoice' : doc.type; // deposits share the invoice sequence
  const issueDate = doc.issueDate;

  const session = await mongoose.connection.startSession();
  try {
    await session.withTransaction(async () => {
      if (plan.watermark) await enforceFreeQuota(user.id, session);
      const seq = await nextSeq(`${user.id}:${series}:${counterPeriod(pattern, issueDate)}`, session);
      const res = await Document.updateOne(
        { _id: doc._id, userId: user.id, status: 'draft' },
        {
          $set: {
            status: 'issued',
            number: formatNumber(pattern, issueDate, seq),
            seller,
            buyer,
            issuedAt: new Date(),
            watermark: plan.watermark,
            // Date of the sale / service is a mandatory mention on invoices: defaults to the invoice date
            ...(doc.type !== 'quote' && !doc.serviceDate ? { serviceDate: issueDate } : {}),
          },
        },
        { session },
      );
      if (res.matchedCount === 0) throw new Error('LOCKED');

      if (doc.type === 'credit_note' && doc.precedingInvoice?.id) await applyCreditNote(user.id, doc, session);
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    return { error: code === 'LOCKED' ? 'locked' : code === 'PLAN_LIMIT' ? 'planLimit' : code === 'CREDIT_EXCEEDS' ? 'creditExceeds' : 'generic' };
  } finally {
    await session.endSession();
  }

  await audit({ userId: user.id, actorId: user.id, action: 'document.issue', targetType: 'document', targetId: id });
  refresh();
  redirect({ href: `/app/documents/${id}`, locale });
  return {};
}

async function transition(id: string, from: DocStatus[], to: DocStatus, extra: Record<string, unknown> = {}, types?: DocType[]) {
  const user = await actionUser();
  if (!isValidObjectId(id)) return;
  await connectDb();
  const res = await Document.updateOne({ _id: id, userId: user.id, status: { $in: from }, ...(types ? { type: { $in: types } } : {}) }, { $set: { status: to, ...extra } });
  if (res.matchedCount) await audit({ userId: user.id, actorId: user.id, action: `document.${to}`, targetType: 'document', targetId: id });
  refresh();
}

export async function markSent(id: string) {
  await transition(id, ['issued'], 'sent', { sentAt: new Date() });
}

export async function setQuoteOutcome(id: string, outcome: 'accepted' | 'declined') {
  if (!['accepted', 'declined'].includes(outcome)) return;
  // Only quotes can be accepted/declined: an invoice called directly with this action stays untouched
  await transition(id, ['issued', 'sent', 'accepted', 'declined'], outcome, {}, ['quote']);
}

/** New draft copied from an existing document (duplicate, quote → invoice, invoice → credit note). */
async function copyToDraft(id: string, locale: string, type: 'invoice' | 'credit_note' | 'same') {
  const user = await actionUser();
  await connectDb();
  const src = await findOwned(user.id, id);
  if (!src) return;
  if (type === 'invoice' && src.type !== 'quote') return;
  if (type === 'credit_note' && (src.type !== 'invoice' && src.type !== 'deposit_invoice' || !src.number)) return;

  const profile = await BusinessProfile.findOne({ userId: user.id }).select('paymentTermsDays').lean();
  const tz = (user as { timeZone?: string }).timeZone;
  const today = todayIn(tz);
  const newType = type === 'same' ? src.type : type;
  const draft = await Document.create({
    userId: user.id,
    type: newType,
    status: 'draft',
    clientId: src.clientId,
    issueDate: today,
    dueDate: newType === 'invoice' || newType === 'deposit_invoice' ? new Date(today.getTime() + (profile?.paymentTermsDays ?? 30) * 86_400_000) : undefined,
    validUntil: newType === 'quote' ? new Date(today.getTime() + 30 * 86_400_000) : undefined,
    currency: src.currency,
    docLocale: src.docLocale,
    operationCategory: src.operationCategory,
    buyerReference: src.buyerReference,
    notes: src.notes,
    lines: src.lines,
    totals: src.totals,
    amountDue: newType === 'invoice' ? src.totals?.totalInclTax ?? 0 : 0,
    convertedFromId: type === 'invoice' ? String(src._id) : undefined,
    precedingInvoice: type === 'credit_note' ? { id: String(src._id), number: src.number, issueDate: src.issueDate } : undefined,
  });
  if (type === 'invoice' && ['issued', 'sent'].includes(src.status)) await Document.updateOne({ _id: src._id, userId: user.id }, { $set: { status: 'accepted' } });
  await audit({ userId: user.id, actorId: user.id, action: `document.copy.${type}`, targetType: 'document', targetId: String(draft._id), details: { from: id } });
  redirect({ href: `/app/documents/${draft._id}`, locale });
}

export async function convertToInvoice(id: string, locale: string) {
  await copyToDraft(id, locale, 'invoice');
}
export async function createCreditNote(id: string, locale: string) {
  await copyToDraft(id, locale, 'credit_note');
}
export async function duplicateDocument(id: string, locale: string) {
  await copyToDraft(id, locale, 'same');
}

export async function deleteDraft(id: string, locale: string) {
  const user = await actionUser();
  await connectDb();
  const res = await Document.deleteOne({ _id: id, userId: user.id, status: 'draft' });
  if (res.deletedCount) await audit({ userId: user.id, actorId: user.id, action: 'document.delete', targetType: 'document', targetId: id });
  redirect({ href: '/app/documents', locale });
}

const paymentSchema = z.object({
  amount: z.string().trim().min(1, 'required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid'),
  method: z.enum(['transfer', 'card', 'cash', 'cheque', 'mobile', 'other']),
  reference: z.string().trim().max(100, 'tooLong').optional(),
});

export async function addPayment(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await actionUser();
  const parsed = paymentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await connectDb();
  const doc = await findOwned(user.id, id);
  if (!doc || !['invoice', 'deposit_invoice'].includes(doc.type) || !['issued', 'sent'].includes(doc.status)) return { errors: { _form: 'locked' } };
  const amount = parseAmount(parsed.data.amount, doc.currency);
  if (amount === null || amount <= 0) return { errors: { amount: 'invalidAmount' } };
  if (amount > (doc.amountDue ?? 0)) return { errors: { amount: 'overpayment' } };

  doc.payments.push({ amount, date: new Date(`${parsed.data.date}T00:00:00Z`), method: parsed.data.method, reference: parsed.data.reference || undefined });
  const d = derive({ lines: doc.lines, payments: doc.payments, type: doc.type, status: doc.status });
  doc.paid = d.paid;
  doc.amountDue = d.amountDue;
  doc.status = d.status as typeof doc.status;
  await doc.save();
  await audit({ userId: user.id, actorId: user.id, action: 'payment.add', targetType: 'document', targetId: id, details: { amount } });
  if (doc.status === 'paid') await reportCashed(user.id, id).catch(() => undefined);
  refresh();
  return { ok: true, savedAt: Date.now() };
}

export async function removePayment(id: string, paymentId: string) {
  const user = await actionUser();
  await connectDb();
  const doc = await findOwned(user.id, id);
  if (!doc || !['issued', 'sent', 'paid'].includes(doc.status)) return;
  const before = doc.payments.length;
  doc.payments.pull({ _id: paymentId });
  if (doc.payments.length === before) return;
  const d = derive({ lines: doc.lines, payments: doc.payments, type: doc.type, status: doc.status });
  doc.paid = d.paid;
  doc.amountDue = d.amountDue;
  doc.status = d.status as typeof doc.status;
  await doc.save();
  await audit({ userId: user.id, actorId: user.id, action: 'payment.remove', targetType: 'document', targetId: id, details: { paymentId } });
  refresh();
}

// ── Sharing ──────────────────────────────────────────────────────────────

export async function getShareLink(id: string, locale: string, regenerate = false): Promise<string | null> {
  const user = await actionUser();
  await connectDb();
  const token = await getOrCreateShareToken(user.id, id, regenerate);
  if (!token) return null;
  if (regenerate) await audit({ userId: user.id, actorId: user.id, action: 'document.share.regenerate', targetType: 'document', targetId: id });
  return await publicUrl(token, locale);
}

const emailSchema = z.object({ to: z.email('invalidEmail').max(254), message: z.string().trim().min(1, 'required').max(3000, 'tooLong') });

export async function sendDocumentEmail(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await actionUser();
  const parsed = emailSchema.safeParse({ to: String(form.get('to') ?? '').trim(), message: form.get('message') });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  if (!(await rateLimit('doc-email', user.id, 20, 3600))) return { errors: { _form: 'rateLimited' } };

  await connectDb();
  const doc = await findOwned(user.id, id);
  if (!doc || doc.status === 'draft') return { errors: { _form: 'notFound' } };
  const view = await loadDocView(doc.toObject());
  const token = await getOrCreateShareToken(user.id, id);
  const m = (view.lang === 'fr' ? fr : en) as unknown as { doc: Record<string, string> };
  const fill = (s: string) =>
    s
      .replaceAll('{type}', m.doc[view.type])
      .replaceAll('{number}', view.number ?? '')
      .replaceAll('{seller}', view.seller?.tradeName || view.seller?.legalName || '')
      .replaceAll('{amount}', formatMinor(view.totals.totalInclTax, view.currency, view.lang === 'fr' ? 'fr-FR' : 'en-GB'));
  const subject = fill(m.doc.emailSubject);
  const url = await publicUrl(token!, view.lang);
  const pdf = await renderDocumentPdf(view);

  await sendEmail({
    to: parsed.data.to,
    subject,
    text: `${parsed.data.message}\n\n${url}`,
    html: layout(subject, parsed.data.message, { label: m.doc.emailButton, url }, m.doc.emailFooter, view.lang),
    replyTo: view.seller?.email,
    attachments: [{ filename: pdfFileName(view), content: pdf }],
  });
  await Document.updateOne({ _id: id, userId: user.id, status: 'issued' }, { $set: { status: 'sent', sentAt: new Date() } });
  await audit({ userId: user.id, actorId: user.id, action: 'document.email', targetType: 'document', targetId: id, details: { to: parsed.data.to } });
  refresh();
  return { ok: true, savedAt: Date.now() };
}

// ── E-invoicing transmission (approved platform / Peppol) ────────────────

export type TransmitResult = { ok?: boolean; error?: string; details?: string[] };

export async function sendToPlatform(id: string): Promise<TransmitResult> {
  const user = await actionUser();
  await connectDb();
  const result = await transmitDocument(user.id, id);
  await audit({ userId: user.id, actorId: user.id, action: result.ok ? 'einvoice.send' : 'einvoice.send.failed', targetType: 'document', targetId: id, details: result.ok ? {} : { error: result.error } });
  refresh();
  return result;
}

export async function refreshPlatformStatus(id: string) {
  const user = await actionUser();
  await connectDb();
  await refreshLifecycle(user.id, id).catch(() => undefined);
  refresh();
}

/** Per-invoice switch for automatic overdue reminders. */
export async function setDocumentReminders(id: string, disabled: boolean) {
  const user = await actionUser();
  if (!isValidObjectId(id)) return;
  await connectDb();
  const res = await Document.updateOne({ _id: id, userId: user.id, type: { $in: ['invoice', 'deposit_invoice'] } }, { $set: { 'reminders.disabled': Boolean(disabled) } });
  if (res.matchedCount) await audit({ userId: user.id, actorId: user.id, action: disabled ? 'document.reminders.off' : 'document.reminders.on', targetType: 'document', targetId: id });
  refresh();
}

// ── Recurring invoices (Pro) ─────────────────────────────────────────────

export type RecurrenceState = { error?: 'pro' | 'notFound' | 'date' | 'exists'; ok?: boolean };

/** Repeats an issued invoice: a draft copy is prepared on each date (nothing is issued automatically). */
export async function createRecurrence(id: string, _prev: RecurrenceState, form: FormData): Promise<RecurrenceState> {
  const user = await actionUser();
  const frequency = String(form.get('frequency'));
  const start = String(form.get('start') ?? '');
  if (!FREQUENCIES.includes(frequency as Frequency) || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return { error: 'date' };
  const startDate = new Date(`${start}T00:00:00Z`);
  const today = todayIn((user as { timeZone?: string }).timeZone);
  if (Number.isNaN(startDate.getTime()) || startDate <= today || startDate.getTime() - today.getTime() > 400 * 86_400_000) return { error: 'date' };
  await connectDb();
  if (!(await hasActivePro(user.id))) return { error: 'pro' };
  const src = await findOwned(user.id, id);
  if (!src || !['invoice', 'deposit_invoice'].includes(src.type) || src.status === 'draft') return { error: 'notFound' };
  if (await Recurrence.exists({ userId: user.id, sourceId: id, active: true })) return { error: 'exists' };
  const r = await Recurrence.create({ userId: user.id, sourceId: id, frequency: frequency as Frequency, nextDate: startDate });
  await audit({ userId: user.id, actorId: user.id, action: 'recurrence.create', targetType: 'document', targetId: id, details: { recurrenceId: String(r._id), frequency } });
  refresh();
  return { ok: true };
}

export async function stopRecurrence(recurrenceId: string) {
  const user = await actionUser();
  if (!isValidObjectId(recurrenceId)) return;
  await connectDb();
  const res = await Recurrence.updateOne({ _id: recurrenceId, userId: user.id }, { $set: { active: false } });
  if (res.matchedCount) await audit({ userId: user.id, actorId: user.id, action: 'recurrence.stop', targetType: 'recurrence', targetId: recurrenceId });
  refresh();
}
