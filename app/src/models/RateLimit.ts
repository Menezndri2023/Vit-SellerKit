import { Schema, model, models, type Model } from 'mongoose';

type RateLimitDoc = { key: string; count: number; expiresAt: Date };

const schema = new Schema<RateLimitDoc>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  // MongoDB deletes the entry when the window ends (TTL index)
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const RateLimit: Model<RateLimitDoc> = models.RateLimit ?? model('RateLimit', schema);
