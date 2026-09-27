/**
 * UBL 2.1 invoice / credit note, Peppol BIS Billing 3.0 (EN 16931 compliant).
 * Built from the same normalized input as Factur-X, so VAT, exemption and identifier rules live in one place.
 * Element order follows the UBL schema sequence (order matters for validation).
 */
import type { FacturXInvoiceInput } from '@stackforge-eu/factur-x';

const CUSTOMIZATION = 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0';
const PROFILE = 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0';

type Party = FacturXInvoiceInput['seller'];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const el = (name: string, value: string | number | undefined | null, attrs: Record<string, string | undefined> = {}) =>
  value === undefined || value === null || value === ''
    ? ''
    : `<${name}${Object.entries(attrs)
        .filter(([, v]) => v)
        .map(([k, v]) => ` ${k}="${esc(v!)}"`)
        .join('')}>${esc(String(value))}</${name}>`;

/**
 * Peppol electronic address (EndpointID, mandatory in Peppol) from the party's identifiers:
 * BE enterprise number (0208), FR SIRET (0009) or SIREN (0002), NL KvK (0106), DE/LU VAT (9930/9938).
 */
export function endpointId(p: Party): { id: string; scheme: string } | null {
  const legal = p.legalOrganization;
  const country = p.address?.country;
  const vat = p.taxRegistrations?.find((t) => t.schemeId === 'VA')?.id;
  if (legal?.id && legal.schemeID && ['0208', '0009', '0002', '0106'].includes(legal.schemeID)) return { id: legal.id.replace(/^BE/, ''), scheme: legal.schemeID };
  if (vat && country === 'DE') return { id: vat, scheme: '9930' };
  if (vat && country === 'LU') return { id: vat, scheme: '9938' };
  return null;
}

function party(p: Party): string {
  const endpoint = endpointId(p);
  const a = p.address!;
  const vat = p.taxRegistrations?.find((t) => t.schemeId === 'VA')?.id;
  return [
    '<cac:Party>',
    endpoint ? el('cbc:EndpointID', endpoint.id, { schemeID: endpoint.scheme }) : '',
    p.legalOrganization?.tradingName ? `<cac:PartyName>${el('cbc:Name', p.legalOrganization.tradingName)}</cac:PartyName>` : '',
    '<cac:PostalAddress>',
    el('cbc:StreetName', a.line1),
    el('cbc:AdditionalStreetName', a.line2),
    el('cbc:CityName', a.city),
    el('cbc:PostalZone', a.postalCode),
    el('cbc:CountrySubentity', a.subdivision),
    `<cac:Country>${el('cbc:IdentificationCode', a.country)}</cac:Country>`,
    '</cac:PostalAddress>',
    vat ? `<cac:PartyTaxScheme>${el('cbc:CompanyID', vat)}<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : '',
    '<cac:PartyLegalEntity>',
    el('cbc:RegistrationName', p.name),
    p.legalOrganization?.id ? el('cbc:CompanyID', p.legalOrganization.id, { schemeID: p.legalOrganization.schemeID }) : '',
    '</cac:PartyLegalEntity>',
    p.contact?.email || p.contact?.phone ? `<cac:Contact>${el('cbc:Telephone', p.contact.phone)}${el('cbc:ElectronicMail', p.contact.email)}</cac:Contact>` : '',
    '</cac:Party>',
  ].join('');
}

function taxCategory(tag: 'cac:TaxCategory' | 'cac:ClassifiedTaxCategory', code: string, rate: number, reason?: { code?: string; text?: string }) {
  return [
    `<${tag}>`,
    el('cbc:ID', code),
    code === 'O' ? '' : el('cbc:Percent', rate.toFixed(2)), // BR-O-5: no rate for "not subject to VAT"
    reason?.code ? el('cbc:TaxExemptionReasonCode', reason.code) : '',
    reason?.text ? el('cbc:TaxExemptionReason', reason.text) : '',
    '<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>',
    `</${tag}>`,
  ].join('');
}

export function buildUbl(input: FacturXInvoiceInput, digits: number): string {
  const isCredit = input.document.typeCode === '381';
  const root = isCredit ? 'CreditNote' : 'Invoice';
  const cur = input.totals.currency;
  const amount = (v: number) => v.toFixed(digits);
  const money = (name: string, v: number | undefined) => (v === undefined ? '' : el(name, amount(v), { currencyID: cur }));
  const qty = (v: number) => String(Number(v.toFixed(3)));
  const price = (v: number) => String(Number(v.toFixed(4)));
  const p = input.payment;

  const lines = (input.lines ?? [])
    .map((l) =>
      [
        `<cac:${root}Line>`,
        el('cbc:ID', l.id),
        el(isCredit ? 'cbc:CreditedQuantity' : 'cbc:InvoicedQuantity', qty(l.quantity), { unitCode: String(l.unitCode ?? 'C62') }),
        money('cbc:LineExtensionAmount', l.lineTotal ?? l.quantity * l.unitPrice),
        '<cac:Item>',
        el('cbc:Description', l.description),
        el('cbc:Name', l.name),
        taxCategory('cac:ClassifiedTaxCategory', String(l.vatCategoryCode ?? 'S'), l.vatRatePercent ?? 0),
        '</cac:Item>',
        '<cac:Price>',
        el('cbc:PriceAmount', price(l.unitPrice), { currencyID: cur }),
        l.grossUnitPrice !== undefined && l.priceDiscount
          ? `<cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator>${el('cbc:Amount', price(l.priceDiscount), { currencyID: cur })}${el('cbc:BaseAmount', price(l.grossUnitPrice), { currencyID: cur })}</cac:AllowanceCharge>`
          : '',
        '</cac:Price>',
        `</cac:${root}Line>`,
      ].join(''),
    )
    .join('');

  const breakdown = input.vatBreakdown ?? [];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${root} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${root}-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">`,
    el('cbc:CustomizationID', CUSTOMIZATION),
    el('cbc:ProfileID', PROFILE),
    el('cbc:ID', input.document.id),
    el('cbc:IssueDate', input.document.issueDate),
    isCredit ? '' : el('cbc:DueDate', input.document.dueDate),
    el(isCredit ? 'cbc:CreditNoteTypeCode' : 'cbc:InvoiceTypeCode', String(input.document.typeCode ?? '380')),
    ...(input.document.notes ?? []).map((n) => el('cbc:Note', n.subjectCode ? `#${n.subjectCode}#${n.content}` : n.content)),
    el('cbc:DocumentCurrencyCode', cur),
    // Peppol requires a buyer reference or an order reference
    el('cbc:BuyerReference', input.document.buyerReference ?? input.document.id),
    ...(input.references ?? [])
      .filter((r) => r.type === 'preceding')
      .map((r) => `<cac:BillingReference><cac:InvoiceDocumentReference>${el('cbc:ID', r.id)}${el('cbc:IssueDate', r.issueDate)}</cac:InvoiceDocumentReference></cac:BillingReference>`),
    `<cac:AccountingSupplierParty>${party(input.seller)}</cac:AccountingSupplierParty>`,
    `<cac:AccountingCustomerParty>${party(input.buyer)}</cac:AccountingCustomerParty>`,
    input.delivery
      ? `<cac:Delivery>${el('cbc:ActualDeliveryDate', input.delivery.date)}${
          input.delivery.location
            ? `<cac:DeliveryLocation><cac:Address>${el('cbc:StreetName', input.delivery.location.line1)}${el('cbc:CityName', input.delivery.location.city)}${el('cbc:PostalZone', input.delivery.location.postalCode)}<cac:Country>${el('cbc:IdentificationCode', input.delivery.location.country)}</cac:Country></cac:Address></cac:DeliveryLocation>`
            : ''
        }</cac:Delivery>`
      : '',
    p
      ? `<cac:PaymentMeans>${el('cbc:PaymentMeansCode', p.meansCode ?? '30')}${el('cbc:PaymentID', p.paymentReference)}${
          p.iban ? `<cac:PayeeFinancialAccount>${el('cbc:ID', p.iban)}${el('cbc:Name', p.accountName)}${p.bic ? `<cac:FinancialInstitutionBranch>${el('cbc:ID', p.bic)}</cac:FinancialInstitutionBranch>` : ''}</cac:PayeeFinancialAccount>` : ''
        }</cac:PaymentMeans>`
      : '',
    `<cac:TaxTotal>${money('cbc:TaxAmount', input.totals.taxTotal)}${breakdown
      .map((g) => `<cac:TaxSubtotal>${money('cbc:TaxableAmount', g.taxableAmount)}${money('cbc:TaxAmount', g.taxAmount)}${taxCategory('cac:TaxCategory', String(g.categoryCode), g.ratePercent, { code: g.exemptionReasonCode, text: g.exemptionReason })}</cac:TaxSubtotal>`)
      .join('')}</cac:TaxTotal>`,
    '<cac:LegalMonetaryTotal>',
    money('cbc:LineExtensionAmount', input.totals.lineTotal),
    money('cbc:TaxExclusiveAmount', input.totals.taxBasisTotal),
    money('cbc:TaxInclusiveAmount', input.totals.grandTotal),
    money('cbc:PrepaidAmount', input.totals.prepaidAmount),
    money('cbc:PayableAmount', input.totals.duePayableAmount),
    '</cac:LegalMonetaryTotal>',
    lines,
    `</${root}>`,
  ];
  return xml.filter(Boolean).join('\n');
}
