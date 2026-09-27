import { randomUUID } from 'node:crypto';
import type { EInvoicingProvider, LifecycleEvent, LifecycleStatus } from './types';

/**
 * Local simulation of an approved platform, for development and automated tests.
 * Statuses progress each time they are read: submitted → received → made_available → approved.
 * Never enable it in production.
 */
const store = new Map<string, LifecycleEvent[]>();
const FLOW: LifecycleStatus[] = ['submitted', 'received', 'made_available', 'approved'];

export const sandboxProvider: EInvoicingProvider = {
  id: 'sandbox',
  name: 'Sandbox (simulation)',
  async send(invoice) {
    if (!invoice.facturX.length || !invoice.ubl.includes(invoice.number)) throw new Error('Invalid invoice payload');
    const providerId = `sbx_${randomUUID()}`;
    const event = { status: 'submitted' as const, at: new Date() };
    store.set(providerId, [event]);
    return { providerId, event };
  },
  async getStatus(providerId) {
    const events = store.get(providerId) ?? [];
    const last = events.at(-1)?.status;
    const next = last ? FLOW[FLOW.indexOf(last) + 1] : undefined;
    if (next && !events.some((e) => e.status === 'cashed')) events.push({ status: next, at: new Date() });
    store.set(providerId, events);
    return events;
  },
  async reportPayment(providerId, paidAt) {
    const event = { status: 'cashed' as const, at: paidAt };
    store.set(providerId, [...(store.get(providerId) ?? []), event]);
    return event;
  },
  parseWebhook(body) {
    const b = body as { providerId?: string; status?: string; reason?: string };
    if (!b?.providerId || !b.status) return null;
    return { providerId: b.providerId, event: { status: b.status as LifecycleStatus, at: new Date(), reason: b.reason } };
  },
};
