import { describe, expect, it } from 'vitest';
import { checkCompliance, legalMentions, type BuyerSnapshot, type SellerSnapshot } from './compliance';
import { counterPeriod, formatNumber } from './numbering';
import { computeTotals, operationCategory } from './totals';

describe('numbering', () => {
  const d = new Date(Date.UTC(2026, 8, 26));
  it('formats patterns', () => {
    expect(formatNumber('INV-{YYYY}-{SEQ:3}', d, 7)).toBe('INV-2026-007');
    expect(formatNumber('F{YY}{MM}-{SEQ}', d, 42)).toBe('F2609-42');
    expect(formatNumber('{SEQ:4}', d, 12345)).toBe('12345');
  });
  it('derives the counter period', () => {
    expect(counterPeriod('INV-{YYYY}-{SEQ:3}', d)).toBe('2026');
    expect(counterPeriod('F{YY}{MM}-{SEQ}', d)).toBe('2026-09');
    expect(counterPeriod('N-{SEQ:5}', d)).toBe('all');
  });
});

describe('totals', () => {
  it('computes line nets, per-rate VAT and totals', () => {
    const t = computeTotals([
      { qty: 3, unitPrice: 1999, discountPct: 0, vatCategory: 'S', taxRate: 20 },
      { qty: 1.5, unitPrice: 8000, discountPct: 10, vatCategory: 'S', taxRate: 20 },
      { qty: 2, unitPrice: 1050, discountPct: 0, vatCategory: 'S', taxRate: 5.5 },
      { qty: 1, unitPrice: 5000, discountPct: 0, vatCategory: 'E', taxRate: 20 },
    ]);
    expect(t.lines).toEqual([5997, 10800, 2100, 5000]);
    expect(t.totalExclTax).toBe(23897);
    expect(t.taxBreakdown).toEqual([
      { category: 'S', rate: 20, base: 16797, amount: 3359 },
      { category: 'S', rate: 5.5, base: 2100, amount: 116 },
      { category: 'E', rate: 0, base: 5000, amount: 0 },
    ]);
    expect(t.totalTax).toBe(3475);
    expect(t.totalInclTax).toBe(27372);
  });

  it('rounds half away from zero, once per VAT group', () => {
    // 3 lines of 0.05 at 10%: per-line VAT would be 3 × 0.01 = 0.03; per-group VAT is 0.015 → 0.02
    const t = computeTotals(Array.from({ length: 3 }, () => ({ qty: 1, unitPrice: 5, discountPct: 0, vatCategory: 'S' as const, taxRate: 10 })));
    expect(t.totalTax).toBe(2);
  });

  it('derives the nature of the operation', () => {
    expect(operationCategory(['service'])).toBe('services');
    expect(operationCategory(['goods', 'goods'])).toBe('goods');
    expect(operationCategory(['goods', 'service'])).toBe('mixed');
  });
});

const frSeller: SellerSnapshot = {
  legalName: 'Atlas Studio',
  address: { line1: '12 rue de la Paix', city: 'Paris', country: 'FR' },
  ids: [
    { scheme: 'SIREN', value: '552032534' },
    { scheme: 'VAT', value: 'FR27552032534' },
  ],
  vatRegime: 'standard',
  latePenaltyText: 'Pénalités de retard : 3 fois le taux d’intérêt légal',
};
const frBusiness: BuyerSnapshot = { kind: 'business', name: 'Client SAS', address: { line1: '1 av. X', city: 'Lyon', country: 'FR' }, ids: [{ scheme: 'SIREN', value: '404833048' }] };
const line = { vatCategory: 'S' as const, taxRate: 20 };
const codes = (i: { code: string }[]) => i.map((x) => x.code);

describe('checkCompliance', () => {
  const base = { type: 'invoice' as const, seller: frSeller, buyer: frBusiness, lines: [line], dueDate: new Date(), totalInclTax: 1200 };

  it('passes a complete French B2B invoice', () => {
    expect(checkCompliance(base)).toEqual([]);
  });

  it('requires the client SIREN on French B2B invoices (e-invoicing reform)', () => {
    expect(codes(checkCompliance({ ...base, buyer: { ...frBusiness, ids: [] } }))).toContain('buyerSiren');
    expect(codes(checkCompliance({ ...base, buyer: { ...frBusiness, kind: 'individual', ids: [] } }))).not.toContain('buyerSiren');
  });

  it('requires seller identifiers per country', () => {
    expect(codes(checkCompliance({ ...base, seller: { ...frSeller, ids: [] } }))).toEqual(expect.arrayContaining(['sellerSiren', 'sellerVat']));
    const ma = { ...frSeller, address: { ...frSeller.address, country: 'MA' }, ids: [] };
    expect(codes(checkCompliance({ ...base, seller: ma, buyer: { ...frBusiness, address: { ...frBusiness.address, country: 'MA' }, ids: [] } }))).toEqual(expect.arrayContaining(['sellerIce', 'buyerIce']));
  });

  it('does not ask for a VAT number under the franchise scheme, but forbids charging VAT', () => {
    const franchise = { ...frSeller, vatRegime: 'franchise' as const, ids: [{ scheme: 'SIREN', value: '552032534' }] };
    expect(codes(checkCompliance({ ...base, seller: franchise, lines: [{ vatCategory: 'O', taxRate: 0 }] }))).toEqual([]);
    expect(codes(checkCompliance({ ...base, seller: franchise }))).toContain('noVatRegime');
  });

  it('checks reverse charge and intra-EU supplies', () => {
    const deBuyer: BuyerSnapshot = { kind: 'business', name: 'GmbH', address: { line1: 'Str. 1', city: 'Berlin', country: 'DE' }, ids: [] };
    expect(codes(checkCompliance({ ...base, buyer: deBuyer, lines: [{ vatCategory: 'K', taxRate: 0 }] }))).toContain('buyerVatIntraEu');
    expect(codes(checkCompliance({ ...base, lines: [{ vatCategory: 'K', taxRate: 0 }] }))).toContain('intraEuCountry');
    expect(codes(checkCompliance({ ...base, buyer: { ...deBuyer, ids: [{ scheme: 'VAT', value: 'DE123456789' }] }, lines: [{ vatCategory: 'AE', taxRate: 0 }] }))).toEqual([]);
  });

  it('only needs basics for quotes', () => {
    expect(codes(checkCompliance({ ...base, type: 'quote', seller: { ...frSeller, ids: [] }, dueDate: null }))).toEqual([]);
  });
});

describe('legalMentions', () => {
  const input = { type: 'invoice' as const, lang: 'fr' as const, seller: frSeller, buyer: frBusiness, lines: [line], operationCategory: 'services' as const };

  it('adds the French B2B mentions', () => {
    const m = legalMentions(input);
    expect(m).toContain('Nature de l’opération : prestation de services');
    expect(m).toContain('Pénalités de retard : 3 fois le taux d’intérêt légal');
    expect(m).toContain('Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 €');
  });

  it('adds franchise, debits, reverse charge and exemption mentions', () => {
    expect(legalMentions({ ...input, seller: { ...frSeller, vatRegime: 'franchise' }, lines: [{ vatCategory: 'O', taxRate: 0 }] })).toContain('TVA non applicable, art. 293 B du CGI');
    expect(legalMentions({ ...input, seller: { ...frSeller, vatOnDebits: true } })).toContain('Option pour le paiement de la taxe d’après les débits');
    expect(legalMentions({ ...input, lang: 'en', lines: [{ vatCategory: 'AE', taxRate: 0 }] })).toContain('Reverse charge — VAT to be accounted for by the customer');
    expect(legalMentions({ ...input, lines: [{ vatCategory: 'K', taxRate: 0 }] })).toContain('Exonération de TVA, article 262 ter I du CGI');
  });

  it('references the original invoice on credit notes', () => {
    expect(legalMentions({ ...input, type: 'credit_note', precedingInvoice: { number: 'INV-2026-004', date: '12/09/2026' } })[0]).toBe('Avoir sur la facture n° INV-2026-004 du 12/09/2026');
  });

  it('keeps quotes free of payment mentions', () => {
    const m = legalMentions({ ...input, type: 'quote' });
    expect(m.some((x) => x.includes('40 €'))).toBe(false);
  });
});

describe('epcPayload', async () => {
  const { epcPayload } = await import('./epc-qr');
  it('builds the EPC SEPA transfer payload', () => {
    expect(epcPayload({ name: 'Atlas Studio', iban: 'FR76 3000 6000 0112 3456 7890 189', bic: 'BNPAFRPP', amountMinor: 255000, reference: 'INV-2026-001' })).toBe(
      'BCD\n002\n1\nSCT\nBNPAFRPP\nAtlas Studio\nFR7630006000011234567890189\nEUR2550.00\n\n\nINV-2026-001',
    );
  });
  it('refuses invalid IBANs or amounts', () => {
    expect(epcPayload({ name: 'x', iban: '1234', amountMinor: 100, reference: '' })).toBeNull();
    expect(epcPayload({ name: 'x', iban: 'FR7630006000011234567890189', amountMinor: 0, reference: '' })).toBeNull();
  });
});
