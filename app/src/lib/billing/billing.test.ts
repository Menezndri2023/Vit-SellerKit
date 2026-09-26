import { describe, expect, it } from 'vitest';
import { generateCode, looksLikeCode, normalizeCode } from './codes';
import { evaluateLicense } from './gumroad-status';

const products = { monthly: 'prod_monthly', lifetime: 'prod_lifetime' };
const now = new Date('2026-09-26T12:00:00Z');
const purchase = { product_id: 'prod_monthly', email: 'a@b.co', sale_id: 's1', subscription_id: 'sub1', recurrence: 'monthly', refunded: false, disputed: false, chargebacked: false, subscription_ended_at: null, subscription_cancelled_at: null, subscription_failed_at: null };

describe('evaluateLicense', () => {
  it('accepts an active monthly subscription', () => {
    expect(evaluateLicense({ success: true, purchase }, products, now)).toMatchObject({ valid: true, plan: 'monthly', status: 'active', endsAt: null });
  });
  it('keeps access for a cancelled subscription until it ends', () => {
    const r = evaluateLicense({ success: true, purchase: { ...purchase, subscription_cancelled_at: '2026-09-20T00:00:00Z', subscription_ended_at: '2026-10-05T00:00:00Z' } }, products, now);
    expect(r).toMatchObject({ valid: true, status: 'cancelled' });
    expect(evaluateLicense({ success: true, purchase: { ...purchase, subscription_ended_at: '2026-09-25T00:00:00Z' } }, products, now)).toEqual({ valid: false, reason: 'ended' });
  });
  it('rejects failed payments, refunds, chargebacks and lost disputes', () => {
    expect(evaluateLicense({ success: true, purchase: { ...purchase, subscription_failed_at: '2026-09-01T00:00:00Z' } }, products, now)).toEqual({ valid: false, reason: 'payment_failed' });
    expect(evaluateLicense({ success: true, purchase: { ...purchase, refunded: true } }, products, now)).toEqual({ valid: false, reason: 'refunded' });
    expect(evaluateLicense({ success: true, purchase: { ...purchase, chargebacked: true } }, products, now)).toEqual({ valid: false, reason: 'refunded' });
    expect(evaluateLicense({ success: true, purchase: { ...purchase, disputed: true, dispute_won: true } }, products, now)).toMatchObject({ valid: true });
  });
  it('handles lifetime licenses, unknown products and unknown keys', () => {
    expect(evaluateLicense({ success: true, purchase: { ...purchase, product_id: 'prod_lifetime', subscription_id: null } }, products, now)).toMatchObject({ valid: true, plan: 'lifetime', endsAt: null });
    expect(evaluateLicense({ success: true, purchase: { ...purchase, product_id: 'someone_else' } }, products, now)).toEqual({ valid: false, reason: 'wrong_product' });
    expect(evaluateLicense({ success: false, message: 'That license does not exist for the provided product.' }, products, now)).toEqual({ valid: false, reason: 'not_found' });
  });
});

describe('activation codes', () => {
  it('generates readable, unique codes', () => {
    const codes = new Set(Array.from({ length: 2000 }, generateCode));
    expect(codes.size).toBe(2000);
    for (const c of [...codes].slice(0, 50)) expect(c).toMatch(/^MK-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
  });
  it('normalizes what people type', () => {
    const code = generateCode();
    expect(normalizeCode(code.toLowerCase().replaceAll('-', ' '))).toBe(code);
    expect(normalizeCode(code.replace('MK-', ''))).toBe(code);
    expect(normalizeCode('MK-ABCD-EFGH')).toBeNull();
    expect(looksLikeCode(' mk-abcd')).toBe(true);
    expect(looksLikeCode('8A5C1D2E-...')).toBe(false);
  });
});
