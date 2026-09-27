import { describe, expect, it } from 'vitest';
import { sandboxProvider } from './sandbox';

const invoice = { number: 'INV-1', facturX: new Uint8Array([1]), ubl: '<Invoice>INV-1</Invoice>', seller: { name: 'S', country: 'FR' }, buyer: { name: 'B', country: 'FR' }, currency: 'EUR', totalInclTax: 100 };

describe('sandbox e-invoicing provider', () => {
  it('follows the lifecycle and records payment', async () => {
    const { providerId, event } = await sandboxProvider.send(invoice);
    expect(event.status).toBe('submitted');
    expect((await sandboxProvider.getStatus(providerId)).map((e) => e.status)).toEqual(['submitted', 'received']);
    expect((await sandboxProvider.getStatus(providerId)).at(-1)?.status).toBe('made_available');
    expect((await sandboxProvider.reportPayment(providerId, new Date(), 100)).status).toBe('cashed');
  });
  it('refuses inconsistent payloads', async () => {
    await expect(sandboxProvider.send({ ...invoice, ubl: '<Invoice/>' })).rejects.toThrow();
  });
  it('parses webhooks', () => {
    expect(sandboxProvider.parseWebhook({ providerId: 'x', status: 'refused', reason: 'Wrong SIREN' })?.event).toMatchObject({ status: 'refused', reason: 'Wrong SIREN' });
    expect(sandboxProvider.parseWebhook({})).toBeNull();
  });
});
