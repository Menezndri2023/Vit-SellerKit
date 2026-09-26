import 'server-only';
import type { EditorClient, EditorProduct, EditorValues } from '@/components/documents/DocumentEditor';
import type { VatCategory } from '@/lib/catalog';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Client } from '@/models/Client';
import type { DocumentDoc } from '@/models/Document';
import { Product } from '@/models/Product';
import { toInput } from '../money';
import { documentDefaults } from '../profile-defaults';
import { isoDay } from './service';

/** Clients, products and defaults for the document editor. */
export async function editorData(userId: string, fallbackCountry: string) {
  const [clients, products, defaults, profile] = await Promise.all([
    Client.find({ userId }).select('name preferredCurrency preferredDocLocale').sort({ name: 1 }).limit(500).lean(),
    Product.find({ userId }).sort({ name: 1 }).limit(500).lean(),
    documentDefaults(userId, fallbackCountry),
    BusinessProfile.findOne({ userId }).select('paymentTermsDays').lean(),
  ]);
  return {
    clients: clients.map<EditorClient>((c) => ({ id: String(c._id), name: c.name, preferredCurrency: c.preferredCurrency ?? undefined, preferredDocLocale: c.preferredDocLocale ?? undefined })),
    products: products.map<EditorProduct>((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description ?? undefined,
      unitPrice: p.unitPrice,
      currency: p.currency,
      unitCode: p.unitCode ?? 'C62',
      taxRate: p.taxRate ?? 0,
      vatCategory: (p.vatCategory ?? 'S') as VatCategory,
      kind: (p.kind ?? 'service') as 'goods' | 'service',
    })),
    defaults: { ...defaults, vatCategory: defaults.vatCategory as VatCategory, paymentTermsDays: profile?.paymentTermsDays ?? 30 },
  };
}

export function docToEditor(d: DocumentDoc & { _id: unknown }, locale: string): EditorValues {
  return {
    id: String(d._id),
    type: d.type,
    clientId: d.clientId ?? undefined,
    issueDate: isoDay(d.issueDate),
    dueDate: isoDay(d.dueDate),
    validUntil: isoDay(d.validUntil),
    serviceDate: isoDay(d.serviceDate),
    currency: d.currency,
    docLocale: (d.docLocale ?? 'en') as 'en' | 'fr',
    buyerReference: d.buyerReference ?? undefined,
    notes: d.notes ?? undefined,
    lines: d.lines.map((l) => ({
      productId: l.productId ?? undefined,
      description: l.description,
      kind: (l.kind ?? 'service') as 'goods' | 'service',
      qty: locale === 'fr' ? String(l.qty).replace('.', ',') : String(l.qty),
      unitCode: l.unitCode ?? 'C62',
      unitPrice: toInput(l.unitPrice, d.currency, locale),
      discountPct: String(l.discountPct ?? 0),
      vatCategory: (l.vatCategory ?? 'S') as VatCategory,
      taxRate: String(l.taxRate ?? 0),
      exemptionReason: l.exemptionReason ?? undefined,
    })),
  };
}
