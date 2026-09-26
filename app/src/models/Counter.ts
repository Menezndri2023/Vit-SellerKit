import { Schema, model, models, type ClientSession, type Model } from 'mongoose';

type CounterDoc = { key: string; seq: number };

const schema = new Schema<CounterDoc>({ key: { type: String, required: true, unique: true }, seq: { type: Number, default: 0 } });

export const Counter: Model<CounterDoc> = models.Counter ?? model('Counter', schema);

/** Atomically returns the next number of a sequence (safe with concurrent requests). Pass the transaction session. */
export async function nextSeq(key: string, session?: ClientSession): Promise<number> {
  const c = await Counter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, session }).lean();
  return c!.seq;
}
