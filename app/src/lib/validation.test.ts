import { describe, expect, it } from 'vitest';
import { fieldErrors, formToObject } from './forms';
import { clientSchema, productSchema, profileSchema } from './validation';

const form = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return formToObject(f);
};

const baseProfile = {
  legalName: 'Atlas Studio SARL',
  'address.line1': '12 rue de la Paix',
  'address.city': 'Paris',
  'address.country': 'fr',
  vatRegime: 'standard',
  paymentTermsDays: '30',
  defaultCurrency: 'eur',
  defaultDocLocale: 'fr',
  'numbering.invoice': 'F-{YYYY}-{SEQ:4}',
  'numbering.quote': 'D-{YYYY}-{SEQ:3}',
  'numbering.credit_note': 'A-{YYYY}-{SEQ:3}',
};

describe('formToObject', () => {
  it('builds nested objects and arrays from dot paths', () => {
    expect(form({ 'a.b': '1', 'list.0.x': 'y', 'list.1.x': 'z' })).toEqual({ a: { b: '1' }, list: [{ x: 'y' }, { x: 'z' }] });
  });
});

describe('profileSchema', () => {
  it('accepts a valid French profile and normalizes values', () => {
    const r = profileSchema.parse(form({ ...baseProfile, 'ids.SIREN': '552 032 534', 'ids.VAT': 'fr 27 552032534', 'taxRates.0.rate': '20', 'taxRates.1.rate': '5,5', 'taxRates.2.rate': '', vatOnDebits: 'on' }));
    expect(r.address.country).toBe('FR');
    expect(r.defaultCurrency).toBe('EUR');
    expect(r.ids).toEqual([{ scheme: 'SIREN', value: '552032534' }, { scheme: 'VAT', value: 'FR27552032534' }]);
    expect(r.taxRates).toEqual([{ name: undefined, rate: 20, category: 'S' }, { name: undefined, rate: 5.5, category: 'S' }]);
    expect(r.vatOnDebits).toBe(true);
  });

  it('rejects invalid identifiers, IBAN, links and numbering', () => {
    const r = profileSchema.safeParse(form({ ...baseProfile, 'ids.SIREN': '552032535', 'bankAccounts.0.iban': 'FR7630006000011234567890188', 'bankAccounts.0.bic': '', 'paymentLinks.0.url': 'http://paypal.me/x', 'numbering.invoice': 'F-{YYYY}' }));
    expect(r.success).toBe(false);
    const e = fieldErrors(r.error!);
    expect(e['ids.SIREN']).toBe('invalidId');
    expect(e['bankAccounts.0.iban']).toBe('invalidIban');
    expect(e['paymentLinks.0.url']).toBe('invalidUrl');
    expect(e['numbering.invoice']).toBe('numberingSeq');
  });

  it('requires the legal name and address', () => {
    const e = fieldErrors(profileSchema.safeParse(form({ ...baseProfile, legalName: ' ', 'address.city': '' })).error!);
    expect(e.legalName).toBe('required');
    expect(e['address.city']).toBe('required');
  });

  it('rejects a request where required fields are missing entirely', () => {
    const rest: Record<string, string> = { ...baseProfile };
    delete rest.legalName;
    delete rest['address.country'];
    const e = fieldErrors(profileSchema.safeParse(form(rest)).error!);
    expect(e.legalName).toBe('required');
    expect(e['address.country']).toBe('required');
  });

  it('drops the VAT-on-debits option outside France', () => {
    const r = profileSchema.parse(form({ ...baseProfile, 'address.country': 'MA', vatOnDebits: 'on', 'ids.ICE': '001234567000089' }));
    expect(r.vatOnDebits).toBe(false);
  });
});

describe('clientSchema', () => {
  const base = { kind: 'business', name: 'Danone', 'address.line1': '17 bd Haussmann', 'address.city': 'Paris', 'address.country': 'FR' };

  it('checks buyer identifiers for businesses only', () => {
    expect(clientSchema.safeParse(form({ ...base, 'ids.SIREN': '123' })).success).toBe(false);
    const individual = clientSchema.parse(form({ ...base, kind: 'individual', 'ids.SIREN': '123' }));
    expect(individual.ids).toEqual([]);
  });

  it('validates the delivery address only when enabled', () => {
    expect(clientSchema.parse(form({ ...base })).deliveryAddress).toBeUndefined();
    const e = fieldErrors(clientSchema.safeParse(form({ ...base, hasDeliveryAddress: 'on', 'deliveryAddress.line1': '', 'deliveryAddress.city': 'Lyon', 'deliveryAddress.country': 'FR' })).error!);
    expect(e['deliveryAddress.line1']).toBe('required');
  });
});

describe('productSchema', () => {
  const base = { name: 'Logo design', kind: 'service', unitCode: 'C62', currency: 'MAD', unitPrice: '1 500,50', taxRate: '20', vatCategory: 'S' };

  it('stores prices in minor units', () => {
    expect(productSchema.parse(form(base)).unitPrice).toBe(150050);
  });

  it('forces a 0% rate outside the standard category', () => {
    expect(productSchema.parse(form({ ...base, vatCategory: 'E' })).taxRate).toBe(0);
  });

  it('rejects invalid amounts', () => {
    expect(fieldErrors(productSchema.safeParse(form({ ...base, unitPrice: '12.345' })).error!).unitPrice).toBe('invalidAmount');
  });
});
