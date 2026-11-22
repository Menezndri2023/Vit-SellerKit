import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    plan: { type: String, enum: ['monthly', 'annual', 'lifetime', 'manual', 'trial'], required: true },
    provider: { type: String, enum: ['gumroad', 'manual', 'trial'], required: true },
    /** active: paid · cancelled: will not renew, access until expiresAt · expired/refunded/revoked: no access */
    status: { type: String, enum: ['active', 'cancelled', 'expired', 'refunded', 'revoked'], default: 'active', index: true },
    startsAt: { type: Date, default: () => new Date() },
    /** null = no end date (lifetime, or a monthly subscription that renews) */
    expiresAt: { type: Date, default: null },
    external: { productId: String, saleId: String, subscriptionId: String, email: String },
    licenseKeyEnc: { type: String, select: false },
    licenseKeyHash: { type: String, index: { unique: true, sparse: true } },
    activationCodeId: { type: String },
    lastCheckedAt: { type: Date },
    remindersSent: { type: [String], default: [] },
  },
  { timestamps: true },
);

// One trial per account, enforced by the database too (two simultaneous starts)
schema.index({ userId: 1 }, { name: 'one_trial_per_user', unique: true, partialFilterExpression: { provider: 'trial' } });

export type SubscriptionDoc = InferSchemaType<typeof schema>;
export const Subscription: Model<SubscriptionDoc> = models.Subscription ?? model('Subscription', schema);
