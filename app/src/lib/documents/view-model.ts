import 'server-only';
import type { BusinessProfileDoc } from '@/models/BusinessProfile';
import type { ClientDoc } from '@/models/Client';
import type { DocumentDoc } from '@/models/Document';
import { countryRules } from '../countries';
import { legalMentions, type BuyerSnapshot } from './compliance';
import { buyerSnapshot, sellerSnapshot, type SellerWithPayment } from './service';

export type DocView = {
  id: string;
  type: DocumentDoc['type'];
  status: DocumentDoc['status'];
  number?: string;
  lang: 'en' | 'fr';
  currency: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  serviceDate?: string;
  buyerReference?: string;
  notes?: string;
  lines: { description: string; qty: number; unitCode: string; unitPrice: number; discountPct: number; vatCategory: string; taxRate: number; net: number; exemptionReason?: string }[];
  totals: { totalExclTax: number; totalTax: number; totalInclTax: number; taxBreakdown: { category: string; rate: number; base: number; amount: number }[] };
  paid: number;
  amountDue: number;
  seller: SellerWithPayment | null;
  buyer: BuyerSnapshot | null;
  sellerIds: { label: string; value: string }[];
  buyerIds: { label: string; value: string }[];
  mentions: string[];
  watermark: boolean;
  isDraft: boolean;
  precedingInvoice?: { number: string; issueDate: string };
  operationCategory: 'goods' | 'services' | 'mixed';
};

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : undefined);

function labelIds(country: string | undefined, ids: { scheme: string; value: string }[] | undefined, lang: 'en' | 'fr') {
  const schemes = countryRules(country).idSchemes;
  return (ids ?? []).map((i) => ({ label: schemes.find((s) => s.scheme === i.scheme)?.label[lang] ?? i.scheme, value: i.value }));
}

/**
 * Everything needed to render a document (HTML preview, public page, PDF).
 * Issued documents use their frozen snapshots; drafts use the current profile and client.
 */
export function buildDocView(doc: DocumentDoc & { _id: unknown }, liveProfile: BusinessProfileDoc | null, liveClient: ClientDoc | null): DocView {
  const lang = (doc.docLocale === 'fr' ? 'fr' : 'en') as 'en' | 'fr';
  const isDraft = doc.status === 'draft';
  const seller = (isDraft ? (liveProfile ? sellerSnapshot(liveProfile) : null) : (doc.seller as DocView['seller'])) ?? null;
  const buyer = (isDraft ? (liveClient ? buyerSnapshot(liveClient) : null) : (doc.buyer as BuyerSnapshot)) ?? null;
  const lines = doc.lines.map((l) => ({
    description: l.description,
    qty: l.qty,
    unitCode: l.unitCode ?? 'C62',
    unitPrice: l.unitPrice,
    discountPct: l.discountPct ?? 0,
    vatCategory: l.vatCategory ?? 'S',
    taxRate: l.taxRate ?? 0,
    net: l.net,
    exemptionReason: l.exemptionReason ?? undefined,
  }));
  const dateFmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'UTC', dateStyle: 'short' });

  return {
    id: String(doc._id),
    type: doc.type,
    status: doc.status,
    number: doc.number ?? undefined,
    lang,
    currency: doc.currency,
    issueDate: iso(doc.issueDate)!,
    dueDate: iso(doc.dueDate),
    validUntil: iso(doc.validUntil),
    serviceDate: iso(doc.serviceDate),
    buyerReference: doc.buyerReference ?? undefined,
    notes: doc.notes ?? undefined,
    lines,
    totals: {
      totalExclTax: doc.totals?.totalExclTax ?? 0,
      totalTax: doc.totals?.totalTax ?? 0,
      totalInclTax: doc.totals?.totalInclTax ?? 0,
      taxBreakdown: (doc.totals?.taxBreakdown ?? []).map((g) => ({ category: g.category ?? 'S', rate: g.rate ?? 0, base: g.base ?? 0, amount: g.amount ?? 0 })),
    },
    paid: doc.paid ?? 0,
    amountDue: doc.amountDue ?? 0,
    seller,
    buyer,
    sellerIds: labelIds(seller?.address?.country, seller?.ids, lang),
    buyerIds: labelIds(buyer?.address?.country, buyer?.ids, lang),
    mentions: seller
      ? legalMentions({
          type: doc.type,
          lang,
          seller,
          buyer,
          lines: lines.map((l) => ({ vatCategory: l.vatCategory as 'S', taxRate: l.taxRate, exemptionReason: l.exemptionReason })),
          operationCategory: (doc.operationCategory ?? 'services') as 'services',
          precedingInvoice: doc.precedingInvoice?.number ? { number: doc.precedingInvoice.number, date: dateFmt.format(new Date(doc.precedingInvoice.issueDate!)) } : null,
        })
      : [],
    watermark: Boolean(doc.watermark),
    isDraft,
    precedingInvoice: doc.precedingInvoice?.number ? { number: doc.precedingInvoice.number, issueDate: iso(doc.precedingInvoice.issueDate)! } : undefined,
    operationCategory: (doc.operationCategory ?? 'services') as 'goods' | 'services' | 'mixed',
  };
}
