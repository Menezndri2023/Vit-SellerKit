/**
 * Margokit document → Factur-X (CII, EN 16931 profile) input.
 * Pure mapping, unit-tested; embedding into the PDF happens in ./facturx.ts (server).
 */
import type { FacturXInvoiceInput } from '@stackforge-eu/factur-x';
import type { DocView } from '../documents/view-model';
import { currencyDigits } from '../money';

type Party = NonNullable<DocView['buyer']>;

/** ISO 6523 scheme of the legal registration number (BT-30 / BT-47) per identifier. */
const LEGAL_SCHEMES: Record<string, string> = { SIREN: '0002', SIRET: '0009', BCE: '0208', KVK: '0106' };
const LEGAL_PRIORITY = ['SIREN', 'BCE', 'KVK', 'SIRET', 'ICE', 'CRN', 'NIF', 'CF', 'TIN', 'EIN'];

/** VATEX exemption reason codes for categories that require a reason (BR-AE-10, BR-IC-10, BR-G-10, BR-O-10). */
const VATEX: Record<string, string> = { AE: 'VATEX-EU-AE', K: 'VATEX-EU-IC', G: 'VATEX-EU-G', O: 'VATEX-EU-O' };

const day = (iso?: string) => (iso ? iso.slice(0, 10) : undefined);

export function typeCode(type: DocView['type']): '380' | '381' | '386' {
  return type === 'credit_note' ? '381' : type === 'deposit_invoice' ? '386' : '380';
}

function party(p: { name: string; address: Party['address']; ids: { label: string; value: string }[]; rawIds: { scheme: string; value: string }[]; email?: string; phone?: string; tradeName?: string }) {
  const vat = p.rawIds.find((i) => i.scheme === 'VAT')?.value;
  const legalId = LEGAL_PRIORITY.map((s) => p.rawIds.find((i) => i.scheme === s)).find(Boolean);
  return {
    name: p.name,
    address: {
      line1: p.address.line1,
      ...(p.address.line2 ? { line2: p.address.line2 } : {}),
      city: p.address.city,
      postalCode: p.address.postalCode ?? '',
      country: p.address.country,
      ...(p.address.region ? { subdivision: p.address.region } : {}),
    },
    ...(p.email || p.phone ? { contact: { ...(p.email ? { email: p.email } : {}), ...(p.phone ? { phone: p.phone } : {}) } } : {}),
    ...(vat ? { taxRegistrations: [{ id: vat, schemeId: 'VA' as const }] } : {}),
    ...(legalId || p.tradeName
      ? { legalOrganization: { ...(legalId ? { id: legalId.value, ...(LEGAL_SCHEMES[legalId.scheme] ? { schemeID: LEGAL_SCHEMES[legalId.scheme] } : {}) } : {}), ...(p.tradeName ? { tradingName: p.tradeName } : {}) } }
      : {}),
  };
}

/** Mentions → CII notes with the subject codes French e-invoices expect. */
function notes(doc: DocView) {
  const penalty = doc.seller?.latePenaltyText;
  return doc.mentions.map((content) => ({
    content,
    subjectCode: content === penalty ? 'PMD' : /40\s?€|€40/.test(content) ? 'PMT' : /escompte|discount for early/i.test(content) ? 'AAB' : 'AAI',
  }));
}

export function buildFacturXInput(doc: DocView): FacturXInvoiceInput {
  if (!doc.seller || !doc.buyer || !doc.number) throw new Error('Only issued documents with a seller and a buyer can be exported');
  const digits = currencyDigits(doc.currency);
  const major = (minor: number) => minor / 10 ** digits;
  const franchise = doc.seller.vatRegime === 'franchise';
  const franchiseReason = doc.mentions.find((m) => /293 B|franchise|§ 19/i.test(m));

  // Under a small-business exemption, "outside scope" lines are exported as exempt with the franchise reason
  const category = (c: string) => (franchise && c === 'O' ? 'E' : c);
  const exemption = (c: string): { exemptionReason?: string; exemptionReasonCode?: string } => {
    if (franchise && (c === 'O' || c === 'E')) return { exemptionReasonCode: doc.seller!.address.country === 'FR' ? 'VATEX-FR-FRANCHISE' : undefined, exemptionReason: franchiseReason ?? 'VAT exempt (small business)' };
    if (c === 'E') return { exemptionReason: doc.lines.find((l) => l.vatCategory === 'E' && l.exemptionReason)?.exemptionReason ?? (doc.lang === 'fr' ? 'Exonéré de TVA' : 'VAT exempt') };
    if (VATEX[c]) return { exemptionReasonCode: VATEX[c] };
    return {};
  };

  const isPayable = doc.type === 'invoice' || doc.type === 'deposit_invoice';
  const iban = doc.seller.bankAccount?.iban;
  const s = doc.seller;
  const b = doc.buyer;

  return {
    document: {
      id: doc.number,
      issueDate: day(doc.issueDate)!,
      typeCode: typeCode(doc.type) as never,
      ...(isPayable && doc.dueDate ? { dueDate: day(doc.dueDate) } : {}),
      language: doc.lang,
      ...(doc.buyerReference ? { buyerReference: doc.buyerReference } : {}),
      notes: notes(doc),
    },
    seller: party({ name: s.legalName, tradeName: s.tradeName, address: s.address, ids: doc.sellerIds, rawIds: s.ids, email: s.email, phone: s.phone }),
    buyer: party({ name: b.name, address: b.address, ids: doc.buyerIds, rawIds: b.ids, email: b.email }),
    lines: doc.lines.map((l, i) => {
      const cat = category(l.vatCategory);
      const discounted = l.discountPct > 0;
      return {
        id: String(i + 1),
        name: l.description.split('\n')[0].slice(0, 200),
        ...(l.description.includes('\n') ? { description: l.description } : {}),
        quantity: l.qty,
        unitCode: l.unitCode as never,
        unitPrice: Number((major(l.unitPrice) * (1 - l.discountPct / 100)).toFixed(4)),
        ...(discounted ? { grossUnitPrice: major(l.unitPrice), priceDiscount: Number(((major(l.unitPrice) * l.discountPct) / 100).toFixed(4)) } : {}),
        lineTotal: major(l.net),
        vatCategoryCode: cat as never,
        vatRatePercent: cat === 'S' ? l.taxRate : 0,
      };
    }),
    vatBreakdown: mergeBreakdown(doc.totals.taxBreakdown.map((g) => ({ ...g, category: category(g.category) }))).map((g) => ({
      categoryCode: g.category as never,
      ratePercent: g.category === 'S' ? g.rate : 0,
      taxableAmount: major(g.base),
      taxAmount: major(g.amount),
      ...exemption(g.category),
    })),
    totals: {
      lineTotal: major(doc.totals.totalExclTax),
      taxBasisTotal: major(doc.totals.totalExclTax),
      taxTotal: major(doc.totals.totalTax),
      grandTotal: major(doc.totals.totalInclTax),
      ...(isPayable && doc.paid > 0 ? { prepaidAmount: major(doc.paid) } : {}),
      duePayableAmount: major(isPayable ? doc.amountDue : doc.totals.totalInclTax),
      currency: doc.currency,
    },
    ...(isPayable
      ? {
          payment: {
            meansCode: iban ? (doc.currency === 'EUR' ? '58' : '30') : '1',
            ...(iban ? { iban } : {}),
            ...(s.bankAccount?.bic ? { bic: s.bankAccount.bic } : {}),
            ...(s.bankAccount?.holder ? { accountName: s.bankAccount.holder } : {}),
            ...(doc.dueDate ? { dueDate: day(doc.dueDate) } : {}),
            paymentReference: doc.number,
          },
        }
      : {}),
    // Date of supply is mandatory (BR-FX-EN-04 / French mention): defaults to the invoice date
    delivery: {
      date: day(doc.serviceDate ?? doc.issueDate),
      ...(b.deliveryAddress ? { location: { line1: b.deliveryAddress.line1, city: b.deliveryAddress.city, postalCode: b.deliveryAddress.postalCode ?? '', country: b.deliveryAddress.country } } : {}),
    },
    ...(doc.precedingInvoice ? { references: [{ id: doc.precedingInvoice.number, type: 'preceding' as const, issueDate: day(doc.precedingInvoice.issueDate) }] } : {}),
  };
}

/** After re-mapping categories (franchise O → E), groups with the same category and rate must be merged. */
function mergeBreakdown(groups: { category: string; rate: number; base: number; amount: number }[]) {
  const map = new Map<string, { category: string; rate: number; base: number; amount: number }>();
  for (const g of groups) {
    const key = `${g.category}|${g.category === 'S' ? g.rate : 0}`;
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, base: prev.base + g.base, amount: prev.amount + g.amount } : { ...g });
  }
  return [...map.values()];
}
