import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';
import { UNIT_CODES, VAT_CATEGORIES } from '@/lib/catalog';

const schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 150 },
    description: { type: String, maxlength: 1000 },
    kind: { type: String, enum: ['goods', 'service'], default: 'service' },
    unitCode: { type: String, enum: UNIT_CODES, default: 'C62' },
    /** Minor units of `currency` */
    unitPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, minlength: 3, maxlength: 3 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    vatCategory: { type: String, enum: VAT_CATEGORIES, default: 'S' },
  },
  { timestamps: true },
);

schema.index({ userId: 1, name: 1 });

export type ProductDoc = InferSchemaType<typeof schema>;

export const Product: Model<ProductDoc> = models.Product ?? model('Product', schema);
