import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const schema = new Schema(
  {
    /** HMAC-SHA256 of the normalized code — the code itself is never stored */
    codeHash: { type: String, required: true, unique: true },
    /** Last 4 characters, to recognize a code in the admin without storing it */
    hint: { type: String, required: true },
    batch: { type: String, index: true },
    /** null = lifetime */
    durationDays: { type: Number, default: null },
    note: { type: String, maxlength: 200 },
    createdBy: { type: String },
    usedBy: { type: String, index: true },
    usedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

export type ActivationCodeDoc = InferSchemaType<typeof schema>;
export const ActivationCode: Model<ActivationCodeDoc> = models.ActivationCode ?? model('ActivationCode', schema);
