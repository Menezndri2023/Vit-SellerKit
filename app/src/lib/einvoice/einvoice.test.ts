import { buildXml, Flavor, Profile, validateInput, validateXsd } from '@stackforge-eu/factur-x';
import { describe, expect, it } from 'vitest';
import type { DocView } from '../documents/view-model';
import { buildFacturXInput } from './facturx-input';

export function sampleDoc(patch: Partial<DocView> = {}): DocView {
  return {
    id: 'x',
    type: 'invoice',
    status: 'issued',
    number: 'INV-2026-001',
    lang: 'fr',
    currency: 'EUR',
    issueDate: '2026-09-26T00:00:00.000Z',
    dueDate: '2026-10-26T00:00:00.000Z',
    serviceDate: '2026-09-20T00:00:00.000Z',
    lines: [
      { description: 'Identité visuelle', qty: 1, unitCode: 'C62', unitPrice: 180000, discountPct: 0, vatCategory: 'S', taxRate: 20, net: 180000 },
      { description: 'Séance photo', qty: 0.5, unitCode: 'DAY', unitPrice: 65000, discountPct: 10, vatCategory: 'S', taxRate: 20, net: 29250 },
    ],
    totals: { totalExclTax: 209250, totalTax: 41850, totalInclTax: 251100, taxBreakdown: [{ category: 'S', rate: 20, base: 209250, amount: 41850 }] },
    paid: 0,
    amountDue: 251100,
    seller: {
      legalName: 'Atlas Studio SAS',
      tradeName: 'Atlas Studio',
      address: { line1: '12 rue de la Paix', postalCode: '75002', city: 'Paris', country: 'FR' },
      email: 'hello@atlas.example',
      ids: [
        { scheme: 'SIREN', value: '552032534' },
        { scheme: 'VAT', value: 'FR27552032534' },
      ],
      vatRegime: 'standard',
      latePenaltyText: 'Pénalités de retard : 3 fois le taux d’intérêt légal',
      bankAccount: { holder: 'Atlas Studio SAS', iban: 'FR7630006000011234567890189', bic: 'BNPAFRPP' },
      paymentLinks: [],
    },
    buyer: {
      kind: 'business',
      name: 'Danone',
      address: { line1: '17 boulevard Haussmann', postalCode: '75009', city: 'Paris', country: 'FR' },
      deliveryAddress: { line1: '1 quai de la Loire', postalCode: '75019', city: 'Paris', country: 'FR' },
      ids: [{ scheme: 'SIREN', value: '404833048' }],
    },
    sellerIds: [],
    buyerIds: [],
    mentions: [
      'Nature de l’opération : prestation de services',
      'Pénalités de retard : 3 fois le taux d’intérêt légal',
      'Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 €',
      'Pas d’escompte pour paiement anticipé',
    ],
    watermark: false,
    isDraft: false,
    operationCategory: 'services',
    ...patch,
  };
}

async function expectValid(doc: DocView) {
  const input = buildFacturXInput(doc);
  const check = validateInput(input, Profile.EN16931);
  expect(check.errors).toEqual([]);
  const xml = buildXml(input, Profile.EN16931, Flavor.FACTUR_X);
  const xsd = await validateXsd(xml, Profile.EN16931);
  expect(xsd.errors).toEqual([]);
  return { input, xml };
}

describe('Factur-X (CII EN 16931)', () => {
  it('produces a schema-valid French B2B invoice', async () => {
    const { input, xml } = await expectValid(sampleDoc());
    expect(input.document.typeCode).toBe('380');
    expect(input.seller.legalOrganization).toEqual({ id: '552032534', schemeID: '0002', tradingName: 'Atlas Studio' });
    expect(input.buyer.legalOrganization).toEqual({ id: '404833048', schemeID: '0002' });
    expect(input.document.notes?.map((n) => n.subjectCode)).toEqual(['AAI', 'PMD', 'PMT', 'AAB']);
    expect(input.lines?.[1]).toMatchObject({ quantity: 0.5, unitPrice: 585, grossUnitPrice: 650, priceDiscount: 65, lineTotal: 292.5 });
    expect(xml).toContain('<ram:ID>INV-2026-001</ram:ID>');
    expect(xml).toContain('FR7630006000011234567890189');
    expect(xml).toContain('<ram:GrandTotalAmount>2511.00</ram:GrandTotalAmount>');
  });

  it('maps the French small-business exemption to E + VATEX-FR-FRANCHISE', async () => {
    const doc = sampleDoc({
      seller: { ...sampleDoc().seller!, vatRegime: 'franchise', ids: [{ scheme: 'SIREN', value: '552032534' }] },
      lines: [{ description: 'Conseil', qty: 2, unitCode: 'HUR', unitPrice: 5000, discountPct: 0, vatCategory: 'O', taxRate: 0, net: 10000 }],
      totals: { totalExclTax: 10000, totalTax: 0, totalInclTax: 10000, taxBreakdown: [{ category: 'O', rate: 0, base: 10000, amount: 0 }] },
      amountDue: 10000,
      mentions: ['TVA non applicable, art. 293 B du CGI'],
    });
    const { input } = await expectValid(doc);
    expect(input.vatBreakdown?.[0]).toMatchObject({ categoryCode: 'E', exemptionReasonCode: 'VATEX-FR-FRANCHISE', exemptionReason: 'TVA non applicable, art. 293 B du CGI' });
    expect(input.lines?.[0].vatCategoryCode).toBe('E');
  });

  it('handles reverse charge to an EU business', async () => {
    const doc = sampleDoc({
      buyer: { kind: 'business', name: 'Berlin GmbH', address: { line1: 'Str. 1', postalCode: '10115', city: 'Berlin', country: 'DE' }, ids: [{ scheme: 'VAT', value: 'DE123456789' }] },
      lines: [{ description: 'Design', qty: 1, unitCode: 'C62', unitPrice: 100000, discountPct: 0, vatCategory: 'AE', taxRate: 0, net: 100000 }],
      totals: { totalExclTax: 100000, totalTax: 0, totalInclTax: 100000, taxBreakdown: [{ category: 'AE', rate: 0, base: 100000, amount: 0 }] },
      amountDue: 100000,
    });
    const { input } = await expectValid(doc);
    expect(input.vatBreakdown?.[0]).toMatchObject({ categoryCode: 'AE', exemptionReasonCode: 'VATEX-EU-AE' });
    expect(input.buyer.taxRegistrations).toEqual([{ id: 'DE123456789', schemeId: 'VA' }]);
  });

  it('exports credit notes with a reference to the original invoice', async () => {
    const { input } = await expectValid(sampleDoc({ type: 'credit_note', number: 'CN-2026-001', precedingInvoice: { number: 'INV-2026-001', issueDate: '2026-09-26T00:00:00.000Z' } }));
    expect(input.document.typeCode).toBe('381');
    expect(input.references).toEqual([{ id: 'INV-2026-001', type: 'preceding', issueDate: '2026-09-26' }]);
    expect(input.payment).toBeUndefined();
  });

  it('refuses drafts', () => {
    expect(() => buildFacturXInput(sampleDoc({ number: undefined }))).toThrow();
  });
});

describe('UBL Peppol BIS 3.0', async () => {
  const { buildUbl, endpointId } = await import('./ubl');
  const { execFileSync } = await import('node:child_process');
  const { writeFileSync } = await import('node:fs');
  const wellFormed = (xml: string) => {
    const f = `/tmp/mk-ubl-${Math.random().toString(36).slice(2)}.xml`;
    writeFileSync(f, xml);
    execFileSync('xmllint', ['--noout', f]); // throws if malformed
  };

  it('builds a well-formed invoice with Peppol endpoints and totals', () => {
    const xml = buildUbl(buildFacturXInput(sampleDoc()), 2);
    wellFormed(xml);
    expect(xml).toContain('<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"');
    expect(xml).toContain('<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>');
    expect(xml).toContain('<cbc:EndpointID schemeID="0002">552032534</cbc:EndpointID>');
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">2511.00</cbc:PayableAmount>');
    expect(xml).toContain('<cbc:InvoicedQuantity unitCode="DAY">0.5</cbc:InvoicedQuantity>');
    expect(xml).toContain('<cbc:BaseAmount currencyID="EUR">650</cbc:BaseAmount>');
    expect(xml).toContain('#PMT#Indemnité forfaitaire');
    expect(xml).toContain('Pénalités de retard : 3 fois le taux d&apos;intérêt légal'.replace('&apos;', '’'));
  });

  it('builds a credit note referencing the invoice', () => {
    const xml = buildUbl(buildFacturXInput(sampleDoc({ type: 'credit_note', number: 'CN-2026-001', precedingInvoice: { number: 'INV-2026-001', issueDate: '2026-09-26T00:00:00.000Z' } })), 2);
    wellFormed(xml);
    expect(xml).toContain('<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"');
    expect(xml).toContain('<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>');
    expect(xml).toContain('<cac:InvoiceDocumentReference><cbc:ID>INV-2026-001</cbc:ID><cbc:IssueDate>2026-09-26</cbc:IssueDate>');
    expect(xml).toContain('<cbc:CreditedQuantity');
  });

  it('uses the Belgian enterprise number as Peppol endpoint', () => {
    expect(endpointId({ name: 'x', address: { line1: 'a', city: 'b', postalCode: '1000', country: 'BE' }, legalOrganization: { id: '0202239951', schemeID: '0208' } })).toEqual({ id: '0202239951', scheme: '0208' });
    expect(endpointId({ name: 'x', address: { line1: 'a', city: 'b', postalCode: '1', country: 'MA' } })).toBeNull();
  });

  it('escapes XML special characters', () => {
    const xml = buildUbl(buildFacturXInput(sampleDoc({ lines: [{ ...sampleDoc().lines[0], description: 'Logo <R&D> "v2"' }] })), 2);
    wellFormed(xml);
    expect(xml).toContain('Logo &lt;R&amp;D&gt; &quot;v2&quot;');
  });
});
