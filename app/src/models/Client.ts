import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';
import { DOC_LOCALES } from '@/lib/catalog';
import { AddressSchema, IdentifierSchema } from './common';

const schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, enum: ['business', 'individual'], default: 'business' },
    name: { type: String, required: true, maxlength: 150 },
    contactName: { type: String, maxlength: 150 },
    email: { type: String, maxlength: 254 },
    phone: { type: String, maxlength: 40 },
    address: { type: AddressSchema, required: true },
    deliveryAddress: { type: AddressSchema },
    ids: { type: [IdentifierSchema], default: [] },
    preferredDocLocale: { type: String, enum: DOC_LOCALES },
    preferredCurrency: { type: String, minlength: 3, maxlength: 3 },
    notes: { type: String, maxlength: 2000 },
  },
  { timestamps: true },
);

schema.index({ userId: 1, name: 1 });

export type ClientDoc = InferSchemaType<typeof schema>;

export const Client: Model<ClientDoc> = models.Client ?? model('Client', schema);
