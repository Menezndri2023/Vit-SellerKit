import { Schema } from 'mongoose';

export type Address = { line1: string; line2?: string; postalCode?: string; city: string; region?: string; country: string };

export const AddressSchema = new Schema<Address>(
  {
    line1: { type: String, default: '', maxlength: 200 },
    line2: { type: String, maxlength: 200 },
    postalCode: { type: String, maxlength: 20 },
    city: { type: String, default: '', maxlength: 100 },
    region: { type: String, maxlength: 100 },
    country: { type: String, required: true, minlength: 2, maxlength: 2 },
  },
  { _id: false },
);

export type Identifier = { scheme: string; value: string };

export const IdentifierSchema = new Schema<Identifier>(
  { scheme: { type: String, required: true, maxlength: 20 }, value: { type: String, required: true, maxlength: 40 } },
  { _id: false },
);
