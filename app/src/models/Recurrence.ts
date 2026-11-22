import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

/**
 * Recurring invoice: on each date, a DRAFT copy of the source invoice is created and the user is
 * notified; the user reviews and issues it (nothing is issued or sent automatically).
 */
const schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sourceId: { type: String, required: true, index: true },
    frequency: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
    /** Day of the next draft (UTC midnight) */
    nextDate: { type: Date, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
    createdCount: { type: Number, default: 0 },
    lastDraftId: { type: String },
    lastRunAt: { type: Date },
  },
  { timestamps: true },
);

export type RecurrenceDoc = InferSchemaType<typeof schema>;
export const Recurrence: Model<RecurrenceDoc> = models.Recurrence ?? model('Recurrence', schema);
