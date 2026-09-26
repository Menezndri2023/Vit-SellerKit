import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const schema = new Schema(
  {
    provider: { type: String, required: true },
    /** Idempotency key: the same webhook delivered twice is processed once */
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    productId: String,
    productName: String,
    email: String,
    amount: Number,
    currency: String,
    country: String,
    isTest: Boolean,
    verified: { type: Boolean, default: false },
    linkedUserId: { type: String, index: true },
    raw: { type: Schema.Types.Mixed },
    receivedAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: false },
);

export type BillingEventDoc = InferSchemaType<typeof schema>;
export const BillingEvent: Model<BillingEventDoc> = models.BillingEvent ?? model('BillingEvent', schema);
