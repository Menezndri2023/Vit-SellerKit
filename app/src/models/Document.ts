import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';
import { DOC_LOCALES, UNIT_CODES, VAT_CATEGORIES } from '@/lib/catalog';
import { AddressSchema, IdentifierSchema } from './common';

export const DOC_TYPES = ['quote', 'invoice', 'credit_note', 'deposit_invoice'] as const;
/**
 * draft → issued (number assigned, locked) → sent.
 * Quotes then: accepted | declined. Invoices: paid (fully paid) | cancelled (by a credit note).
 * Derived, not stored: overdue, partially paid, expired quote.
 */
export const DOC_STATUSES = ['draft', 'issued', 'sent', 'accepted', 'declined', 'paid', 'cancelled'] as const;

const LineSchema = new Schema(
  {
    productId: { type: String },
    description: { type: String, required: true, maxlength: 1000 },
    kind: { type: String, enum: ['goods', 'service'], default: 'service' },
    qty: { type: Number, required: true, min: 0, max: 1e9 },
    unitCode: { type: String, enum: UNIT_CODES, default: 'C62' },
    unitPrice: { type: Number, required: true },
    discountPct: { type: Number, min: 0, max: 100, default: 0 },
    vatCategory: { type: String, enum: VAT_CATEGORIES, default: 'S' },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    exemptionReason: { type: String, maxlength: 300 },
    net: { type: Number, required: true },
  },
  { _id: false },
);

const SellerSchema = new Schema(
  {
    legalName: String,
    tradeName: String,
    address: AddressSchema,
    email: String,
    phone: String,
    website: String,
    ids: [IdentifierSchema],
    vatRegime: String,
    vatOnDebits: Boolean,
    latePenaltyText: String,
    legalMentions: String,
    footer: String,
    logoKey: String,
    bankAccount: { label: String, holder: String, iban: String, bic: String, accountNumber: String, bankName: String },
    paymentLinks: [{ _id: false, label: String, url: String }],
  },
  { _id: false },
);

const BuyerSchema = new Schema(
  { kind: String, name: String, contactName: String, email: String, phone: String, address: AddressSchema, deliveryAddress: AddressSchema, ids: [IdentifierSchema] },
  { _id: false },
);

const PaymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    method: { type: String, enum: ['transfer', 'card', 'cash', 'cheque', 'mobile', 'other'], default: 'transfer' },
    reference: { type: String, maxlength: 100 },
    source: { type: String, enum: ['manual', 'provider'], default: 'manual' },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: DOC_TYPES, required: true },
    status: { type: String, enum: DOC_STATUSES, default: 'draft', index: true },
    number: { type: String },
    clientId: { type: String },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date },
    validUntil: { type: Date },
    serviceDate: { type: Date },
    currency: { type: String, required: true, minlength: 3, maxlength: 3 },
    docLocale: { type: String, enum: DOC_LOCALES, default: 'en' },
    operationCategory: { type: String, enum: ['goods', 'services', 'mixed'], default: 'services' },
    buyerReference: { type: String, maxlength: 100 },
    notes: { type: String, maxlength: 2000 },
    lines: { type: [LineSchema], default: [] },
    totals: {
      totalExclTax: { type: Number, default: 0 },
      taxBreakdown: [{ _id: false, category: String, rate: Number, base: Number, amount: Number }],
      totalTax: { type: Number, default: 0 },
      totalInclTax: { type: Number, default: 0 },
    },
    payments: { type: [PaymentSchema], default: [] },
    paid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    seller: { type: SellerSchema },
    buyer: { type: BuyerSchema },
    precedingInvoice: { id: String, number: String, issueDate: Date },
    convertedFromId: { type: String },
    watermark: { type: Boolean, default: false },
    /** Public share link: SHA-256 for lookup + AES-GCM encrypted token so the owner can copy the same link again */
    publicTokenHash: { type: String, index: { unique: true, sparse: true } },
    publicTokenEnc: { type: String, select: false },
    einvoice: { format: String, xmlHash: String, provider: String, providerId: String, lifecycle: [{ _id: false, status: String, at: Date, reason: String }] },
    issuedAt: { type: Date },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

schema.index({ userId: 1, type: 1, issueDate: -1 });
// A number is unique per user and type (only once issued)
schema.index({ userId: 1, type: 1, number: 1 }, { unique: true, partialFilterExpression: { number: { $type: 'string' } } });

export type DocumentDoc = InferSchemaType<typeof schema>;
export type DocType = (typeof DOC_TYPES)[number];
export type DocStatus = (typeof DOC_STATUSES)[number];

export const Document: Model<DocumentDoc> = models.Document ?? model('Document', schema);
