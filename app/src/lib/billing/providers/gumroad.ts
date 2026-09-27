import 'server-only';
import { connectDb, mongoClient } from '@/lib/db';
import { safeEqual, sha256 } from '@/lib/crypto';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { BillingEvent } from '@/models/BillingEvent';
import { Subscription } from '@/models/Subscription';
import { activateLicense, recheckSubscription } from '../activate';
import { gumroadProducts, verifyGumroadLicense } from '../gumroad';
import type { BillingProvider } from './types';

/**
 * Gumroad: merchant of record, license keys, "Ping" webhook.
 * Gumroad doesn't sign its requests, so: secret URL, idempotency per event,
 * and nothing is granted from the payload alone — licenses are re-verified with Gumroad's API.
 */
export const gumroadProvider: BillingProvider = {
  id: 'gumroad',
  name: 'Gumroad',

  checkoutUrl(plan) {
    return (plan === 'monthly' ? process.env.GUMROAD_URL_MONTHLY : process.env.GUMROAD_URL_LIFETIME) || null;
  },

  async handleWebhook(req, secret) {
    const expected = process.env.GUMROAD_PING_SECRET;
    if (!expected || !safeEqual(secret, expected)) return new Response('Not found', { status: 404 });
    if (!(await rateLimit('webhook-gumroad', await clientIp(), 120, 60))) return new Response('Too many requests', { status: 429 });

    const form = await req.formData().catch(() => null);
    if (!form) return new Response('Bad request', { status: 400 });
    const body = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v).slice(0, 2000)]));
    const type = body.resource_name || (body.refunded === 'true' ? 'refund' : 'sale');
    const ref = body.sale_id || body.subscription_id || sha256(JSON.stringify(body));
    const eventId = `gumroad:${type}:${ref}`;
    const products = gumroadProducts();
    const isOurs = Boolean(body.product_id && (body.product_id === products.monthly || body.product_id === products.lifetime));

    await connectDb();
    try {
      await BillingEvent.create({
        provider: 'gumroad',
        eventId,
        type,
        productId: body.product_id,
        productName: body.product_name,
        email: body.email?.toLowerCase(),
        amount: body.price ? Number(body.price) : undefined,
        currency: body.currency?.toUpperCase(),
        country: body.ip_country,
        isTest: body.test === 'true',
        // Never store license keys in clear text in the event log
        raw: { ...body, license_key: body.license_key ? `…${body.license_key.slice(-4)}` : undefined },
      });
    } catch (e) {
      if ((e as { code?: number }).code === 11000) return new Response('Duplicate', { status: 200 });
      throw e;
    }

    // Sales of other products (Google Sheets templates) are only logged, for the revenue stats
    if (!isOurs) return new Response('OK');

    let verified = false;
    let linkedUserId: string | undefined;
    if (body.license_key) {
      const status = await verifyGumroadLicense(body.license_key).catch(() => null);
      verified = Boolean(status);
      const existing = await Subscription.findOne({ licenseKeyHash: sha256(body.license_key.trim()) }).lean();
      if (existing) {
        linkedUserId = existing.userId;
        await recheckSubscription(String(existing._id)).catch(() => undefined);
      } else if (status?.valid && status.email) {
        // Automatic activation, only for an account whose email is verified (prevents claiming someone else's purchase)
        const user = await mongoClient().db().collection('user').findOne({ email: status.email.toLowerCase(), emailVerified: true });
        if (user) {
          linkedUserId = String(user._id);
          await activateLicense(linkedUserId, body.license_key, { incrementUses: false });
        }
      }
    } else if (body.sale_id || body.subscription_id) {
      const sub = await Subscription.findOne({ $or: [{ 'external.saleId': body.sale_id }, { 'external.subscriptionId': body.subscription_id }].filter((c) => Object.values(c)[0]) }).lean();
      if (sub) {
        linkedUserId = sub.userId;
        await recheckSubscription(String(sub._id)).catch(() => undefined);
        verified = true;
      }
    }
    await BillingEvent.updateOne({ eventId }, { $set: { verified, linkedUserId } });
    return new Response('OK');
  },
};
