/**
 * Pre-issue compliance checks and automatic legal mentions, per seller/buyer country.
 * This is an aid, not legal advice: the UI says so, and users can add their own mentions.
 */
import type { VatCategory, VatRegime } from '../catalog';
import { countryRules, isEu } from '../countries';
import type { Address, Identifier } from '@/models/common';

export type SellerSnapshot = {
  legalName: string;
  tradeName?: string;
  address: Address;
  email?: string;
  phone?: string;
  website?: string;
  ids: Identifier[];
  vatRegime: VatRegime;
  vatOnDebits?: boolean;
  latePenaltyText?: string;
  legalMentions?: string;
  footer?: string;
  logoKey?: string;
};

export type BuyerSnapshot = {
  kind: 'business' | 'individual';
  name: string;
  contactName?: string;
  email?: string;
  address: Address;
  deliveryAddress?: Address;
  ids: Identifier[];
};

export type DocType = 'quote' | 'invoice' | 'credit_note' | 'deposit_invoice';

export type CheckInput = {
  type: DocType;
  seller: SellerSnapshot | null;
  buyer: BuyerSnapshot | null;
  lines: { vatCategory: VatCategory; taxRate: number; exemptionReason?: string }[];
  dueDate?: Date | null;
  totalInclTax: number;
};

export type Issue = { code: string; severity: 'error' | 'warning' };

const hasId = (ids: Identifier[] | undefined, scheme: string) => Boolean(ids?.some((i) => i.scheme === scheme && i.value));
const isInvoiceLike = (t: DocType) => t !== 'quote';

export function checkCompliance({ type, seller, buyer, lines, dueDate, totalInclTax }: CheckInput): Issue[] {
  const issues: Issue[] = [];
  const err = (code: string) => issues.push({ code, severity: 'error' });
  const warn = (code: string) => issues.push({ code, severity: 'warning' });

  if (!seller) return [{ code: 'noProfile', severity: 'error' }];
  if (!buyer) err('noClient');
  if (lines.length === 0) err('noLines');
  if (!seller.legalName) err('sellerName');
  if (!seller.address?.line1 || !seller.address?.city) err('sellerAddress');

  const sc = seller.address?.country;
  const bc = buyer?.address?.country;
  const b2b = buyer?.kind === 'business';
  const chargesVat = seller.vatRegime === 'standard';

  if (isInvoiceLike(type)) {
    if (type !== 'credit_note' && !dueDate) err('dueDate');
    if (totalInclTax < 0) err('negativeTotal');

    // Seller identifiers
    if (sc === 'FR' && !hasId(seller.ids, 'SIREN')) err('sellerSiren');
    if (sc === 'BE' && !hasId(seller.ids, 'BCE')) err('sellerBce');
    if (sc === 'MA' && !hasId(seller.ids, 'ICE')) err('sellerIce');
    if (sc && isEu(sc) && chargesVat && !hasId(seller.ids, 'VAT')) err('sellerVat');

    // French e-invoicing reform: client SIREN on domestic B2B invoices
    if (sc === 'FR' && bc === 'FR' && b2b && !hasId(buyer?.ids, 'SIREN')) err('buyerSiren');
    if (sc === 'MA' && bc === 'MA' && b2b && !hasId(buyer?.ids, 'ICE')) err('buyerIce');

    // France B2B: late payment penalty rate is mandatory
    if (sc === 'FR' && b2b && !seller.latePenaltyText) warn('latePenalty');
  }

  // VAT consistency
  if (!chargesVat && lines.some((l) => l.vatCategory === 'S' && l.taxRate > 0)) err('noVatRegime');
  if (lines.some((l) => l.vatCategory === 'AE') && !hasId(buyer?.ids, 'VAT')) err('buyerVatReverse');
  if (lines.some((l) => l.vatCategory === 'K')) {
    if (!hasId(buyer?.ids, 'VAT')) err('buyerVatIntraEu');
    if (!bc || !sc || bc === sc || !isEu(bc)) err('intraEuCountry');
  }
  if (lines.some((l) => l.vatCategory === 'G') && bc && isEu(bc)) warn('exportInsideEu');
  if (lines.some((l) => l.vatCategory === 'E' && !l.exemptionReason)) warn('exemptionReason');

  return issues;
}

type Lang = 'en' | 'fr';

const T = {
  vatOnDebits: { en: 'VAT paid on debits (option exercised)', fr: 'Option pour le paiement de la taxe d’après les débits' },
  reverseCharge: { en: 'Reverse charge — VAT to be accounted for by the customer', fr: 'Autoliquidation — TVA due par le preneur' },
  intraEu: {
    en: 'VAT-exempt intra-Community supply (Art. 138 of Directive 2006/112/EC)',
    fr: 'Exonération de TVA, livraison intracommunautaire (art. 138 de la directive 2006/112/CE)',
    frSeller: 'Exonération de TVA, article 262 ter I du CGI',
  },
  export: { en: 'VAT-exempt export (Art. 146 of Directive 2006/112/EC)', fr: 'Exonération de TVA, export (art. 146 de la directive 2006/112/CE)', frSeller: 'Exonération de TVA, article 262 I du CGI' },
  exempt: { en: 'VAT exempt', fr: 'Exonéré de TVA' },
  outOfScope: { en: 'Outside the scope of VAT', fr: 'Hors champ d’application de la TVA' },
  recoveryFee: { en: 'Fixed compensation for recovery costs in case of late payment: €40', fr: 'Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 €' },
  noDiscount: { en: 'No discount for early payment', fr: 'Pas d’escompte pour paiement anticipé' },
  operation: {
    en: { goods: 'Nature of the operation: supply of goods', services: 'Nature of the operation: supply of services', mixed: 'Nature of the operation: goods and services' },
    fr: { goods: 'Nature de l’opération : livraison de biens', services: 'Nature de l’opération : prestation de services', mixed: 'Nature de l’opération : livraison de biens et prestation de services' },
  },
  creditNote: { en: 'Credit note for invoice {number} dated {date}', fr: 'Avoir sur la facture n° {number} du {date}' },
} as const;

export type MentionInput = {
  type: DocType;
  lang: Lang;
  seller: SellerSnapshot;
  buyer: BuyerSnapshot | null;
  lines: { vatCategory: VatCategory; taxRate: number; exemptionReason?: string }[];
  operationCategory: 'goods' | 'services' | 'mixed';
  precedingInvoice?: { number: string; date: string } | null;
};

/** Legal mentions to print on the document, in the document's language. */
export function legalMentions({ type, lang, seller, buyer, lines, operationCategory, precedingInvoice }: MentionInput): string[] {
  const out: string[] = [];
  const sc = seller.address.country;
  const rules = countryRules(sc);
  const cats = new Set(lines.map((l) => l.vatCategory));
  const b2b = buyer?.kind === 'business';

  if (type === 'credit_note' && precedingInvoice) out.push(T.creditNote[lang].replace('{number}', precedingInvoice.number).replace('{date}', precedingInvoice.date));
  if (sc === 'FR' && type !== 'quote') out.push(T.operation[lang][operationCategory]);

  if (seller.vatRegime === 'franchise' && rules.franchiseMention) out.push(rules.franchiseMention[lang]);
  if (seller.vatRegime === 'standard' && seller.vatOnDebits && rules.vatOnDebitsOption) out.push(T.vatOnDebits[lang]);
  if (cats.has('AE')) out.push(T.reverseCharge[lang]);
  if (cats.has('K')) out.push(sc === 'FR' && lang === 'fr' ? T.intraEu.frSeller : T.intraEu[lang]);
  if (cats.has('G')) out.push(sc === 'FR' && lang === 'fr' ? T.export.frSeller : T.export[lang]);
  for (const reason of new Set(lines.filter((l) => l.vatCategory === 'E').map((l) => l.exemptionReason || T.exempt[lang]))) out.push(reason);
  if (cats.has('O') && seller.vatRegime !== 'franchise') out.push(T.outOfScope[lang]);

  if (type !== 'quote' && b2b && rules.b2bRecoveryFee) {
    if (seller.latePenaltyText) out.push(seller.latePenaltyText);
    out.push(T.recoveryFee[lang], T.noDiscount[lang]);
  }
  if (seller.legalMentions) out.push(seller.legalMentions);
  return out;
}
