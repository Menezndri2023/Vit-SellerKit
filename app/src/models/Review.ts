import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';
import { KITS, REVIEW_STATUSES } from '@/lib/reviews-shared';

const schema = new Schema(
  {
    kit: { type: String, enum: KITS, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    /** Name as typed; only publicName() of it is ever shown */
    name: { type: String, required: true, maxlength: 60 },
    location: { type: String, maxlength: 60 },
    comment: { type: String, required: true, maxlength: 1000 },
    locale: { type: String, default: 'fr' },
    /** Never shown publicly: used to confirm the review and to check the purchase */
    email: { type: String, required: true, lowercase: true },
    userId: { type: String, index: true },
    status: { type: String, enum: REVIEW_STATUSES, default: 'unconfirmed', index: true },
    verified: { type: String, enum: ['purchase', 'user', null], default: null },
    /** SHA-256 of the email confirmation token */
    confirmTokenHash: { type: String, index: true, sparse: true },
    /** Unconfirmed reviews are deleted automatically after 7 days (TTL index) */
    expireAt: { type: Date },
    approvedAt: { type: Date },
    moderatedBy: { type: String },
  },
  { timestamps: true },
);

// One review per person and per kit: a new submission replaces the previous one
schema.index({ kit: 1, email: 1 }, { unique: true });
schema.index({ status: 1, kit: 1, approvedAt: -1 });
schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export type ReviewDoc = InferSchemaType<typeof schema>;
export const Review: Model<ReviewDoc> = models.Review ?? model('Review', schema);
