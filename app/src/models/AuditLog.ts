import { Schema, model, models, type Model } from 'mongoose';

type AuditDoc = { userId: string; actorId: string; action: string; targetType: string; targetId: string; details?: Record<string, unknown>; at: Date };

const schema = new Schema<AuditDoc>({
  userId: { type: String, required: true, index: true },
  actorId: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true, index: true },
  details: { type: Schema.Types.Mixed },
  at: { type: Date, default: () => new Date() },
});

export const AuditLog: Model<AuditDoc> = models.AuditLog ?? model('AuditLog', schema);

export function audit(entry: Omit<AuditDoc, 'at'>) {
  return AuditLog.create(entry);
}
