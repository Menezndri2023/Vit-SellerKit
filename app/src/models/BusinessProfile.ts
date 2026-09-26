import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';
import { DOC_LOCALES, VAT_CATEGORIES, VAT_REGIMES } from '@/lib/catalog';
import { AddressSchema, IdentifierSchema } from './common';

const schema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    legalName: { type: String, required: true, maxlength: 150 },
    tradeName: { type: String, maxlength: 150 },
    address: { type: AddressSchema, required: true },
    email: { type: String, maxlength: 254 },
    phone: { type: String, maxlength: 40 },
    website: { type: String, maxlength: 200 },
    ids: { type: [IdentifierSchema], default: [] },
    vatRegime: { type: String, enum: VAT_REGIMES, default: 'standard' },
    vatOnDebits: { type: Boolean, default: false },
    taxRates: {
      type: [{ _id: false, name: { type: String, maxlength: 40 }, rate: { type: Number, min: 0, max: 100 }, category: { type: String, enum: VAT_CATEGORIES } }],
      default: [],
    },
    bankAccounts: {
      type: [{ _id: false, label: { type: String, maxlength: 60 }, holder: { type: String, maxlength: 150 }, iban: { type: String, maxlength: 40 }, bic: { type: String, maxlength: 11 }, accountNumber: { type: String, maxlength: 40 }, bankName: { type: String, maxlength: 100 } }],
      default: [],
    },
    paymentLinks: { type: [{ _id: false, label: { type: String, maxlength: 60 }, url: { type: String, maxlength: 500 } }], default: [] },
    paymentTermsDays: { type: Number, min: 0, max: 365, default: 30 },
    latePenaltyText: { type: String, maxlength: 500 },
    defaultCurrency: { type: String, minlength: 3, maxlength: 3, default: 'EUR' },
    defaultDocLocale: { type: String, enum: DOC_LOCALES, default: 'en' },
    numbering: {
      invoice: { type: String, default: 'INV-{YYYY}-{SEQ:3}', maxlength: 40 },
      quote: { type: String, default: 'QUO-{YYYY}-{SEQ:3}', maxlength: 40 },
      credit_note: { type: String, default: 'CN-{YYYY}-{SEQ:3}', maxlength: 40 },
    },
    legalMentions: { type: String, maxlength: 2000 },
    footer: { type: String, maxlength: 500 },
    logo: {
      key: { type: String },
      mime: { type: String },
      size: { type: Number },
      data: { type: Buffer, select: false },
    },
  },
  { timestamps: true },
);

export type BusinessProfileDoc = InferSchemaType<typeof schema>;

export const BusinessProfile: Model<BusinessProfileDoc> = models.BusinessProfile ?? model('BusinessProfile', schema);
