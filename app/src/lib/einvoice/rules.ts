/**
 * EN 16931 business rules that depend on the user's data (not on our mapping), checked before
 * any Factur-X / UBL export: the user gets an actionable message instead of a file that an
 * approved platform or Peppol access point would reject. Verified against the official CEN
 * Schematron (einvoice.schematron.test.ts).
 */
import type { DocView } from '../documents/view-model';
import { exportCategories } from './facturx-input';

const MESSAGES = {
  sellerVat: {
    fr: 'Ajoute ton numéro de TVA dans Paramètres : la facture électronique l’exige pour ces lignes (règles EN 16931 BR-S-02 / BR-E-02).',
    en: 'Add your VAT number in Settings: the e-invoice requires it for these lines (EN 16931 rules BR-S-02 / BR-E-02).',
  },
  buyerVat: {
    fr: 'Ajoute le numéro de TVA du client : il est obligatoire en autoliquidation et en livraison intracommunautaire (BR-AE-03 / BR-IC-03).',
    en: 'Add the client’s VAT number: it is required for reverse charge and intra-community supplies (BR-AE-03 / BR-IC-03).',
  },
  mixedOutOfScope: {
    fr: 'Une facture électronique ne peut pas mélanger des lignes « hors champ de la TVA » avec d’autres taux : fais deux factures (BR-O-11).',
    en: 'An e-invoice can’t mix “outside the scope of VAT” lines with other VAT categories: issue two invoices (BR-O-11).',
  },
} as const;

/** Empty when the document can be exported; otherwise messages in the document's language. */
export function einvoiceRuleErrors(doc: Pick<DocView, 'lines' | 'seller' | 'buyer' | 'lang'>): string[] {
  const lang = doc.lang === 'fr' ? 'fr' : 'en';
  const cats = exportCategories(doc);
  const has = (scheme: string, ids?: { scheme: string; value: string }[]) => Boolean(ids?.some((i) => i.scheme === scheme && i.value));
  const errors: string[] = [];
  if (cats.has('O') && cats.size > 1) errors.push(MESSAGES.mixedOutOfScope[lang]);
  // Every category except "outside scope" needs the seller's VAT identifier
  if ([...cats].some((c) => c !== 'O') && !has('VAT', doc.seller?.ids)) errors.push(MESSAGES.sellerVat[lang]);
  if ((cats.has('AE') || cats.has('K')) && !has('VAT', doc.buyer?.ids)) errors.push(MESSAGES.buyerVat[lang]);
  return errors;
}
