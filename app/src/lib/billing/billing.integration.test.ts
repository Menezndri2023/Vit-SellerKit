import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Route handlers read request headers (client IP); outside a request, return empty headers
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));

import { startTestDb, stopTestDb } from '@/test/db';
import { mongoClient } from '@/lib/db';
import { activateLicense, recheckSubscription, redeemCode } from './activate';
import { verifyGumroadLicense } from './gumroad';
import { gumroadProvider } from './providers/gumroad';
import { hmac, sha256 } from '../crypto';
import { productionConfigProblems } from '../config-check';
import { ActivationCode } from '@/models/ActivationCode';
import { BillingEvent } from '@/models/BillingEvent';
import { Subscription } from '@/models/Subscription';
import { GET as cron } from '@/app/api/cron/daily/route';

const MONTHLY = 'prod-monthly';
const LIFETIME = 'prod-lifetime';
const KEY = 'AAAA1111-BBBB2222-CCCC3333-DDDD4444';

/** Fake Gumroad license API: purchases keyed by license key. Records every call. */
type Purchase = Record<string, unknown>;
let purchases: Record<string, Purchase> = {};
let gumroadDown = false;
const calls: URLSearchParams[] = [];

function fakeGumroad() {
  vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
    const body = new URLSearchParams(String(init.body));
    calls.push(body);
    if (gumroadDown) throw new TypeError('fetch failed');
    const p = purchases[body.get('license_key')!];
    if (!p || p.product_id !== body.get('product_id')) return new Response(JSON.stringify({ success: false }), { status: 404 });
    return Response.json({ success: true, uses: 1, purchase: p });
  });
}

const activeMonthly = (email = 'buyer@example.com'): Purchase => ({ product_id: MONTHLY, email, sale_id: 'sale-1', subscription_id: 'sub-1', refunded: false });

beforeAll(async () => {
  process.env.GUMROAD_PRODUCT_ID_MONTHLY = MONTHLY;
  process.env.GUMROAD_PRODUCT_ID_LIFETIME = LIFETIME;
  process.env.GUMROAD_PING_SECRET = 'ping-secret-123';
  process.env.CRON_SECRET = 'cron-secret-123';
  await startTestDb();
  fakeGumroad();
});
afterAll(async () => {
  vi.unstubAllGlobals();
  await stopTestDb();
});
beforeEach(async () => {
  purchases = {};
  gumroadDown = false;
  calls.length = 0;
  process.env.GUMROAD_PRODUCT_ID_MONTHLY = MONTHLY;
  process.env.GUMROAD_PRODUCT_ID_LIFETIME = LIFETIME;
  await Promise.all([Subscription.deleteMany({}), ActivationCode.deleteMany({}), BillingEvent.deleteMany({}), mongoClient().db().collection('user').deleteMany({})]);
});

describe('license activation (server-side verification)', () => {
  it('activates a valid monthly license and lifetime license', async () => {
    purchases[KEY] = activeMonthly();
    expect(await activateLicense('user-a', KEY)).toMatchObject({ ok: true, plan: 'monthly' });
    purchases['LIFE1111-2222-3333-4444'] = { product_id: LIFETIME, email: 'x@example.com', sale_id: 's2' };
    expect(await activateLicense('user-b', 'LIFE1111-2222-3333-4444')).toEqual({ ok: true, plan: 'lifetime', expiresAt: null });
    // the key itself is never stored in clear text
    const sub = await Subscription.findOne({ userId: 'user-a' }).select('+licenseKeyEnc').lean();
    expect(sub?.licenseKeyHash).toBe(sha256(KEY));
    expect(sub?.licenseKeyEnc).not.toContain(KEY);
  });

  it('rejects unknown, refunded, ended and failed-payment licenses', async () => {
    expect(await activateLicense('u', KEY)).toEqual({ ok: false, error: 'invalid' });
    purchases[KEY] = { ...activeMonthly(), refunded: true };
    expect(await activateLicense('u', KEY)).toEqual({ ok: false, error: 'refunded' });
    purchases[KEY] = { ...activeMonthly(), subscription_ended_at: '2020-01-01T00:00:00Z' };
    expect(await activateLicense('u', KEY)).toEqual({ ok: false, error: 'ended' });
    purchases[KEY] = { ...activeMonthly(), subscription_failed_at: '2020-01-01T00:00:00Z' };
    expect(await activateLicense('u', KEY)).toEqual({ ok: false, error: 'payment_failed' });
    purchases[KEY] = { ...activeMonthly(), product_id: 'some-sheet-template' };
    expect(await activateLicense('u', KEY)).toEqual({ ok: false, error: 'invalid' });
    expect(await activateLicense('u', 'not a key!')).toEqual({ ok: false, error: 'invalid' });
    expect(await Subscription.countDocuments()).toBe(0);
  });

  it('reports Gumroad outages as "unavailable" and grants nothing', async () => {
    purchases[KEY] = activeMonthly();
    gumroadDown = true;
    expect(await activateLicense('u', KEY)).toEqual({ ok: false, error: 'unavailable' });
    expect(await Subscription.countDocuments()).toBe(0);
  });

  it('never links one key to two accounts, even when both activate at the same time', async () => {
    purchases[KEY] = activeMonthly();
    const results = await Promise.all(['user-a', 'user-b', 'user-c', 'user-d'].map((u) => activateLicense(u, KEY)));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.error === 'already_used')).toHaveLength(3);
    expect(await Subscription.countDocuments({ licenseKeyHash: sha256(KEY) })).toBe(1);
    // The owner can activate again (idempotent), another account still can't take it over
    const owner = (await Subscription.findOne().lean())!.userId;
    expect(await activateLicense(owner, KEY)).toMatchObject({ ok: true });
    expect(await activateLicense(owner === 'user-a' ? 'user-b' : 'user-a', KEY)).toEqual({ ok: false, error: 'already_used' });
  });

  it('treats missing product IDs as a configuration error, not as an invalid key', async () => {
    delete process.env.GUMROAD_PRODUCT_ID_MONTHLY;
    delete process.env.GUMROAD_PRODUCT_ID_LIFETIME;
    await expect(verifyGumroadLicense(KEY)).rejects.toThrow(/GUMROAD_PRODUCT_ID/);
  });
});

describe('daily re-verification of monthly subscriptions', () => {
  async function activeSub() {
    purchases[KEY] = activeMonthly();
    await activateLicense('user-a', KEY);
    return (await Subscription.findOne().lean())!;
  }

  it('keeps paid access when Gumroad is down or no longer recognises the key', async () => {
    const sub = await activeSub();
    gumroadDown = true;
    await expect(recheckSubscription(String(sub._id))).rejects.toThrow();
    expect((await Subscription.findById(sub._id).lean())!.status).toBe('active');
    gumroadDown = false;
    delete purchases[KEY]; // 404 from Gumroad for a key that was valid: configuration problem
    await recheckSubscription(String(sub._id));
    expect((await Subscription.findById(sub._id).lean())!.status).toBe('active');
  });

  it('removes access on refund and on an ended subscription; cancellation keeps the paid period', async () => {
    const sub = await activeSub();
    purchases[KEY] = { ...activeMonthly(), subscription_cancelled_at: '2026-11-01T00:00:00Z', subscription_ended_at: '2999-01-01T00:00:00Z' };
    await recheckSubscription(String(sub._id));
    expect((await Subscription.findById(sub._id).lean())!).toMatchObject({ status: 'cancelled' });
    purchases[KEY] = { ...activeMonthly(), subscription_ended_at: '2020-01-01T00:00:00Z' };
    await recheckSubscription(String(sub._id));
    expect((await Subscription.findById(sub._id).lean())!.status).toBe('expired');
    purchases[KEY] = { ...activeMonthly(), refunded: true };
    await Subscription.updateOne({ _id: sub._id }, { $set: { status: 'active' } });
    await recheckSubscription(String(sub._id));
    expect((await Subscription.findById(sub._id).lean())!.status).toBe('refunded');
  });

  it('cron refuses calls without the secret and expires ended manual subscriptions', async () => {
    expect((await cron(new Request('http://x/api/cron/daily'))).status).toBe(401);
    expect((await cron(new Request('http://x/api/cron/daily', { headers: { authorization: 'Bearer wrong' } }))).status).toBe(401);
    await Subscription.create({ userId: 'u-man', plan: 'manual', provider: 'manual', status: 'active', expiresAt: new Date(Date.now() - 1000) });
    const res = await cron(new Request('http://x/api/cron/daily', { headers: { authorization: 'Bearer cron-secret-123' } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ expired: 1 });
    expect((await Subscription.findOne({ userId: 'u-man' }).lean())!.status).toBe('expired');
  });
});

describe('manual activation codes', () => {
  it('a code works once, even with concurrent redemptions; revoked codes are refused', async () => {
    await ActivationCode.create({ codeHash: hmac('MK-ABCD-EFGH-JKMN'), hint: 'JKMN', durationDays: 30 });
    const results = await Promise.all(['a', 'b', 'c'].map((u) => redeemCode(u, 'mk abcd efgh jkmn')));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.error === 'already_used')).toHaveLength(2);
    expect(await Subscription.countDocuments({ provider: 'manual' })).toBe(1);

    await ActivationCode.create({ codeHash: hmac('MK-PQRS-TUVW-XYZ2'), hint: 'XYZ2', durationDays: null, revokedAt: new Date() });
    expect(await redeemCode('d', 'MK-PQRS-TUVW-XYZ2')).toEqual({ ok: false, error: 'already_used' });
    expect(await redeemCode('d', 'MK-2222-2222-2222')).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('Gumroad Ping webhook', () => {
  const ping = (fields: Record<string, string>, secret = 'ping-secret-123') => {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.set(k, v);
    return gumroadProvider.handleWebhook(new Request('http://x/api/webhooks/gumroad/s', { method: 'POST', body: form }), secret);
  };

  it('rejects a wrong secret without logging anything', async () => {
    expect((await ping({ sale_id: 's', product_id: MONTHLY }, 'nope')).status).toBe(404);
    expect(await BillingEvent.countDocuments()).toBe(0);
  });

  it('never grants Pro from the payload alone (forged license key)', async () => {
    await mongoClient().db().collection('user').insertOne({ email: 'buyer@example.com', emailVerified: true });
    const res = await ping({ sale_id: 'forged', product_id: MONTHLY, email: 'buyer@example.com', license_key: KEY, price: '500' });
    expect(res.status).toBe(200);
    expect(await Subscription.countDocuments()).toBe(0);
    expect((await BillingEvent.findOne().lean())!).toMatchObject({ verified: false });
  });

  it('auto-activates a verified purchase for the verified account with the same email, once', async () => {
    const { insertedId } = await mongoClient().db().collection('user').insertOne({ email: 'buyer@example.com', emailVerified: true });
    purchases[KEY] = activeMonthly();
    const fields = { sale_id: 'sale-1', product_id: MONTHLY, email: 'buyer@example.com', license_key: KEY, price: '500', currency: 'usd' };
    expect((await ping(fields)).status).toBe(200);
    expect((await ping(fields)).status).toBe(200); // redelivery
    expect(await BillingEvent.countDocuments()).toBe(1);
    const ev = (await BillingEvent.findOne().lean())!;
    expect(ev).toMatchObject({ verified: true, linkedUserId: String(insertedId) });
    expect(JSON.stringify(ev.raw)).not.toContain(KEY);
    expect(await Subscription.countDocuments({ userId: String(insertedId), status: 'active' })).toBe(1);
  });

  it('does not activate for an unverified email', async () => {
    await mongoClient().db().collection('user').insertOne({ email: 'buyer@example.com', emailVerified: false });
    purchases[KEY] = activeMonthly();
    await ping({ sale_id: 'sale-1', product_id: MONTHLY, email: 'buyer@example.com', license_key: KEY });
    expect(await Subscription.countDocuments()).toBe(0);
  });

  it('retries an event whose first processing failed (Gumroad redelivery)', async () => {
    await mongoClient().db().collection('user').insertOne({ email: 'buyer@example.com', emailVerified: true });
    // First delivery recorded but never finished (e.g. function timeout)
    await BillingEvent.create({ provider: 'gumroad', eventId: 'gumroad:sale:sale-1', type: 'sale', productId: MONTHLY });
    purchases[KEY] = activeMonthly();
    await ping({ sale_id: 'sale-1', product_id: MONTHLY, email: 'buyer@example.com', license_key: KEY });
    expect(await Subscription.countDocuments({ status: 'active' })).toBe(1);
    expect((await BillingEvent.findOne().lean())!.processedAt).toBeInstanceOf(Date);
  });

  it('processes a second cancellation of the same subscription (after a restart), but not a redelivery', async () => {
    purchases[KEY] = activeMonthly();
    await activateLicense('user-a', KEY);
    const cancel1 = { resource_name: 'cancellation', subscription_id: 'sub-1', product_id: MONTHLY, cancelled_at: '2026-11-01T10:00:00Z' };
    await ping(cancel1);
    await ping(cancel1); // redelivery
    await ping({ resource_name: 'subscription_restarted', subscription_id: 'sub-1', product_id: MONTHLY, restarted_at: '2026-11-02T10:00:00Z' });
    await ping({ ...cancel1, cancelled_at: '2026-11-05T10:00:00Z' });
    expect(await BillingEvent.countDocuments({ type: 'cancellation' })).toBe(2);
    expect(await BillingEvent.countDocuments({ type: 'subscription_restarted' })).toBe(1);
  });

  it('a refund ping removes access after re-verification with Gumroad', async () => {
    purchases[KEY] = activeMonthly();
    await activateLicense('user-a', KEY);
    purchases[KEY] = { ...activeMonthly(), refunded: true };
    await ping({ sale_id: 'sale-1', product_id: MONTHLY, refunded: 'true', license_key: KEY });
    expect((await Subscription.findOne().lean())!.status).toBe('refunded');
  });
});

describe('production configuration check', () => {
  const complete = {
    NEXT_PUBLIC_SITE_URL: 'https://margokit.com', MONGODB_URI: 'mongodb+srv://x', APP_ENCRYPTION_KEY: 'k', BETTER_AUTH_SECRET: 'x'.repeat(32),
    RESEND_API_KEY: 'r', CRON_SECRET: 'c', LEGAL_ENTITY: 'e', LEGAL_ADDRESS: 'a', CONTACT_EMAIL: 'm', GUMROAD_PRODUCT_ID_MONTHLY: 'p1', GUMROAD_PRODUCT_ID_LIFETIME: 'p2', GUMROAD_PING_SECRET: 's',
  };
  it('accepts a complete configuration', () => expect(productionConfigProblems(complete)).toEqual([]));
  it('flags placeholders, localhost, sandbox and public secrets', () => {
    const problems = productionConfigProblems({ ...complete, LEGAL_ENTITY: ' ', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', EINVOICE_PROVIDER: 'sandbox', NEXT_PUBLIC_STRIPE_SECRET: 'x' }).join('\n');
    expect(problems).toMatch(/LEGAL_ENTITY/);
    expect(problems).toMatch(/localhost/);
    expect(problems).toMatch(/sandbox/);
    expect(problems).toMatch(/NEXT_PUBLIC_STRIPE_SECRET/);
  });
});
