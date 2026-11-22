/** Representative issued invoice used by the e-invoicing tests. */
import type { DocView } from '../documents/view-model';

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
