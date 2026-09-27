import 'server-only';
import { Document } from '@/models/Document';
import { loadDocView } from '../documents/load';
import { findOwned } from '../documents/service';
import { currencyDigits } from '../money';
import { renderFacturX } from './facturx';
import { buildFacturXInput } from './facturx-input';
import { einvoicingProvider, type LifecycleEvent } from './providers';
import { buildUbl } from './ubl';

const toLifecycle = (e: LifecycleEvent) => ({ status: e.status, at: e.at, reason: e.reason });
const idOf = (ids: { scheme: string; value: string }[] | undefined, scheme: string) => ids?.find((i) => i.scheme === scheme)?.value;

/** Sends an issued invoice/credit note to the configured platform. */
export async function transmitDocument(userId: string, id: string): Promise<{ ok: true } | { ok: false; error: string; details?: string[] }> {
  const provider = einvoicingProvider();
  if (!provider) return { ok: false, error: 'noProvider' };
  const doc = await findOwned(userId, id);
  if (!doc || doc.status === 'draft' || !['invoice', 'credit_note', 'deposit_invoice'].includes(doc.type)) return { ok: false, error: 'notExportable' };
  if (doc.einvoice?.providerId) return { ok: false, error: 'alreadySent' };

  const view = await loadDocView(doc.toObject());
  let facturX: Uint8Array;
  try {
    facturX = (await renderFacturX(view)).pdf;
  } catch (e) {
    return { ok: false, error: 'invalid', details: (e as { errors?: string[] }).errors };
  }
  const ubl = buildUbl(buildFacturXInput(view), currencyDigits(view.currency));
  const { providerId, event } = await provider.send({
    number: view.number!,
    facturX,
    ubl,
    seller: { name: view.seller!.legalName, country: view.seller!.address.country, siren: idOf(view.seller!.ids, 'SIREN'), vat: idOf(view.seller!.ids, 'VAT') },
    buyer: { name: view.buyer!.name, country: view.buyer!.address.country, siren: idOf(view.buyer!.ids, 'SIREN'), vat: idOf(view.buyer!.ids, 'VAT'), email: view.buyer!.email },
    currency: view.currency,
    totalInclTax: view.totals.totalInclTax,
  });
  await Document.updateOne({ _id: doc._id, userId }, { $set: { 'einvoice.provider': provider.id, 'einvoice.providerId': providerId, 'einvoice.lifecycle': [toLifecycle(event)] } });
  return { ok: true };
}

/** Pulls the latest statuses from the platform. */
export async function refreshLifecycle(userId: string, id: string) {
  const provider = einvoicingProvider();
  const doc = await findOwned(userId, id);
  if (!provider || !doc?.einvoice?.providerId || doc.einvoice.provider !== provider.id) return;
  const events = await provider.getStatus(doc.einvoice.providerId);
  await Document.updateOne({ _id: doc._id, userId }, { $set: { 'einvoice.lifecycle': events.map(toLifecycle) } });
}

/** When an invoice sent through the platform is fully paid, report it as "cashed". */
export async function reportCashed(userId: string, id: string) {
  const provider = einvoicingProvider();
  const doc = await findOwned(userId, id);
  if (!provider || !doc?.einvoice?.providerId || doc.status !== 'paid') return;
  if (doc.einvoice.lifecycle?.some((e) => e.status === 'cashed')) return;
  const lastPayment = doc.payments.at(-1);
  const event = await provider.reportPayment(doc.einvoice.providerId, lastPayment?.date ?? new Date(), doc.totals?.totalInclTax ?? 0);
  await Document.updateOne({ _id: doc._id, userId }, { $push: { 'einvoice.lifecycle': toLifecycle(event) } });
}

/** Applies a status pushed by the platform's webhook. */
export async function applyWebhookEvent(providerId: string, event: LifecycleEvent) {
  await Document.updateOne({ 'einvoice.providerId': providerId }, { $push: { 'einvoice.lifecycle': toLifecycle(event) } });
}
