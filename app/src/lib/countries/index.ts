/**
 * Country rules registry. Adding a country = adding an entry here (and its tests).
 * Sources to re-check every quarter: official tax administration websites of each country.
 */
import { isBelgianEnterprise, isBelgianVat, isEuVatFormat, isFrenchVat, isMoroccanIce, isSiren, isSiret, normalizeId } from './validators';

type Localized = { en: string; fr: string };

export type IdScheme = {
  /** Stored identifier scheme (also used for EN 16931 mapping later) */
  scheme: string;
  label: Localized;
  placeholder?: string;
  validate?: (normalized: string) => boolean;
  /** Shown to sellers (business profile) */
  seller: boolean;
  /** Shown for business clients */
  buyer: boolean;
};

export type EInvoicingNetwork = 'fr-pa' | 'peppol' | 'zugferd' | 'national' | 'none';

export type CountryRules = {
  code: string;
  currency: string;
  /** Name of the consumption tax */
  taxLabel: Localized;
  /** Suggested rates in % (first = standard) */
  taxRates: number[];
  idSchemes: IdScheme[];
  einvoicing: EInvoicingNetwork;
  /** Seller can opt for VAT on debits (France) */
  vatOnDebitsOption?: boolean;
  /** Label of the small-business VAT exemption, if the country has one */
  franchiseMention?: Localized;
  /** 40 € recovery fee mention for late B2B payment (France) */
  b2bRecoveryFee?: boolean;
};

const VAT_EU = (country: string): IdScheme => ({
  scheme: 'VAT',
  label: { en: 'VAT number', fr: 'N° de TVA intracommunautaire' },
  placeholder: `${country}…`,
  validate: isEuVatFormat,
  seller: true,
  buyer: true,
});

const TIN: IdScheme = { scheme: 'TIN', label: { en: 'Tax ID', fr: 'Identifiant fiscal' }, seller: true, buyer: true };

const rules: Record<string, CountryRules> = {
  FR: {
    code: 'FR',
    currency: 'EUR',
    taxLabel: { en: 'VAT', fr: 'TVA' },
    taxRates: [20, 10, 5.5, 2.1, 0],
    idSchemes: [
      { scheme: 'SIREN', label: { en: 'SIREN', fr: 'SIREN' }, placeholder: '123 456 789', validate: isSiren, seller: true, buyer: true },
      { scheme: 'SIRET', label: { en: 'SIRET', fr: 'SIRET' }, placeholder: '123 456 789 00012', validate: isSiret, seller: true, buyer: false },
      { ...VAT_EU('FR'), validate: isFrenchVat, placeholder: 'FR12 123456789' },
      { scheme: 'RCS', label: { en: 'Trade register (RCS / RM)', fr: 'RCS / RM (ville)' }, placeholder: 'RCS Paris', seller: true, buyer: false },
    ],
    einvoicing: 'fr-pa',
    vatOnDebitsOption: true,
    franchiseMention: { en: 'VAT not applicable, article 293 B of the French General Tax Code', fr: 'TVA non applicable, art. 293 B du CGI' },
    b2bRecoveryFee: true,
  },
  BE: {
    code: 'BE',
    currency: 'EUR',
    taxLabel: { en: 'VAT', fr: 'TVA' },
    taxRates: [21, 12, 6, 0],
    idSchemes: [
      { scheme: 'BCE', label: { en: 'Enterprise number (BCE/KBO)', fr: 'N° d’entreprise (BCE)' }, placeholder: '0123 456 789', validate: isBelgianEnterprise, seller: true, buyer: true },
      { ...VAT_EU('BE'), validate: isBelgianVat, placeholder: 'BE0123456789' },
    ],
    einvoicing: 'peppol',
    franchiseMention: { en: 'Small business VAT exemption scheme', fr: 'Régime de la franchise de taxe pour petites entreprises' },
  },
  MA: {
    code: 'MA',
    currency: 'MAD',
    taxLabel: { en: 'VAT', fr: 'TVA' },
    taxRates: [20, 14, 10, 7, 0],
    idSchemes: [
      { scheme: 'ICE', label: { en: 'ICE', fr: 'ICE' }, placeholder: '001234567000089', validate: isMoroccanIce, seller: true, buyer: true },
      { scheme: 'IF', label: { en: 'Tax ID (IF)', fr: 'Identifiant fiscal (IF)' }, seller: true, buyer: false },
      { scheme: 'RC', label: { en: 'Trade register (RC)', fr: 'Registre du commerce (RC)' }, seller: true, buyer: false },
      { scheme: 'PATENTE', label: { en: 'Business tax (Patente/TP)', fr: 'Taxe professionnelle (Patente)' }, seller: true, buyer: false },
      { scheme: 'CNSS', label: { en: 'CNSS', fr: 'CNSS' }, seller: true, buyer: false },
    ],
    einvoicing: 'none',
  },
  DE: {
    code: 'DE',
    currency: 'EUR',
    taxLabel: { en: 'VAT', fr: 'TVA' },
    taxRates: [19, 7, 0],
    idSchemes: [VAT_EU('DE'), { scheme: 'STNR', label: { en: 'Tax number (Steuernummer)', fr: 'N° fiscal (Steuernummer)' }, seller: true, buyer: false }],
    einvoicing: 'zugferd',
    franchiseMention: { en: 'VAT exempt under § 19 UStG (small business)', fr: 'Exonéré de TVA, § 19 UStG (petite entreprise)' },
  },
  ES: {
    code: 'ES',
    currency: 'EUR',
    taxLabel: { en: 'VAT (IVA)', fr: 'TVA (IVA)' },
    taxRates: [21, 10, 4, 0],
    idSchemes: [{ scheme: 'NIF', label: { en: 'NIF / CIF', fr: 'NIF / CIF' }, seller: true, buyer: true }, VAT_EU('ES')],
    einvoicing: 'national',
  },
  IT: { code: 'IT', currency: 'EUR', taxLabel: { en: 'VAT (IVA)', fr: 'TVA (IVA)' }, taxRates: [22, 10, 5, 4, 0], idSchemes: [VAT_EU('IT'), { scheme: 'CF', label: { en: 'Codice fiscale', fr: 'Codice fiscale' }, seller: true, buyer: true }], einvoicing: 'national' },
  NL: { code: 'NL', currency: 'EUR', taxLabel: { en: 'VAT', fr: 'TVA' }, taxRates: [21, 9, 0], idSchemes: [VAT_EU('NL'), { scheme: 'KVK', label: { en: 'KvK number', fr: 'N° KvK' }, seller: true, buyer: false }], einvoicing: 'peppol' },
  LU: { code: 'LU', currency: 'EUR', taxLabel: { en: 'VAT', fr: 'TVA' }, taxRates: [17, 14, 8, 3, 0], idSchemes: [VAT_EU('LU'), { scheme: 'RCS', label: { en: 'RCS Luxembourg', fr: 'RCS Luxembourg' }, seller: true, buyer: false }], einvoicing: 'peppol' },
  CH: { code: 'CH', currency: 'CHF', taxLabel: { en: 'VAT', fr: 'TVA' }, taxRates: [8.1, 3.8, 2.6, 0], idSchemes: [{ scheme: 'UID', label: { en: 'UID / VAT number', fr: 'IDE / N° TVA' }, placeholder: 'CHE-123.456.789', validate: (v) => /^CHE\d{9}(MWST|TVA|IVA)?$/.test(v), seller: true, buyer: true }], einvoicing: 'none' },
  GB: { code: 'GB', currency: 'GBP', taxLabel: { en: 'VAT', fr: 'TVA' }, taxRates: [20, 5, 0], idSchemes: [{ scheme: 'VAT', label: { en: 'VAT number', fr: 'N° de TVA' }, placeholder: 'GB123456789', validate: (v) => /^GB(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/.test(v), seller: true, buyer: true }, { scheme: 'CRN', label: { en: 'Company number', fr: 'Company number' }, seller: true, buyer: false }], einvoicing: 'none' },
  US: { code: 'US', currency: 'USD', taxLabel: { en: 'Sales tax', fr: 'Taxe de vente' }, taxRates: [0], idSchemes: [{ scheme: 'EIN', label: { en: 'EIN', fr: 'EIN' }, placeholder: '12-3456789', validate: (v) => /^\d{9}$/.test(v), seller: true, buyer: false }], einvoicing: 'none' },
  CA: { code: 'CA', currency: 'CAD', taxLabel: { en: 'GST/HST', fr: 'TPS/TVH' }, taxRates: [5, 13, 15, 0], idSchemes: [{ scheme: 'BN', label: { en: 'Business number (GST/HST)', fr: 'N° d’entreprise (TPS/TVH)' }, placeholder: '123456789RT0001', seller: true, buyer: true }], einvoicing: 'none' },
  SN: { code: 'SN', currency: 'XOF', taxLabel: { en: 'VAT', fr: 'TVA' }, taxRates: [18, 10, 0], idSchemes: [{ scheme: 'NINEA', label: { en: 'NINEA', fr: 'NINEA' }, seller: true, buyer: true }, { scheme: 'RCCM', label: { en: 'RCCM', fr: 'RCCM' }, seller: true, buyer: false }], einvoicing: 'none' },
  CI: { code: 'CI', currency: 'XOF', taxLabel: { en: 'VAT', fr: 'TVA' }, taxRates: [18, 9, 0], idSchemes: [{ scheme: 'NCC', label: { en: 'Taxpayer account (NCC)', fr: 'Compte contribuable (NCC)' }, seller: true, buyer: true }, { scheme: 'RCCM', label: { en: 'RCCM', fr: 'RCCM' }, seller: true, buyer: false }], einvoicing: 'none' },
  TN: { code: 'TN', currency: 'TND', taxLabel: { en: 'VAT', fr: 'TVA' }, taxRates: [19, 13, 7, 0], idSchemes: [{ scheme: 'MF', label: { en: 'Tax ID (Matricule fiscal)', fr: 'Matricule fiscal' }, seller: true, buyer: true }, { scheme: 'RNE', label: { en: 'RNE', fr: 'RNE' }, seller: true, buyer: false }], einvoicing: 'none' },
  DZ: { code: 'DZ', currency: 'DZD', taxLabel: { en: 'VAT', fr: 'TVA' }, taxRates: [19, 9, 0], idSchemes: [{ scheme: 'NIF', label: { en: 'Tax ID (NIF)', fr: 'NIF' }, seller: true, buyer: true }, { scheme: 'NIS', label: { en: 'NIS', fr: 'NIS' }, seller: true, buyer: false }, { scheme: 'RC', label: { en: 'Trade register (RC)', fr: 'Registre du commerce (RC)' }, seller: true, buyer: false }, { scheme: 'AI', label: { en: 'Tax article (AI)', fr: 'Article d’imposition (AI)' }, seller: true, buyer: false }], einvoicing: 'none' },
};

const EU = new Set(['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK']);

export const isEu = (country: string) => EU.has(country);

/** Rules for a country; EU countries without an entry get the EU VAT scheme, others a generic tax ID. */
export function countryRules(code: string | undefined): CountryRules {
  const c = (code ?? '').toUpperCase();
  if (rules[c]) return rules[c];
  return {
    code: c,
    currency: EU.has(c) ? 'EUR' : 'USD',
    taxLabel: EU.has(c) ? { en: 'VAT', fr: 'TVA' } : { en: 'Tax', fr: 'Taxe' },
    taxRates: [0],
    idSchemes: EU.has(c) ? [VAT_EU(c === 'GR' ? 'EL' : c)] : [TIN],
    einvoicing: EU.has(c) ? 'peppol' : 'none',
  };
}

/** Trade-register entries hold text ("RCS Paris 552 032 534"): keep their spelling instead of normalizing. */
export const FREE_TEXT_ID_SCHEMES = new Set(['RCS', 'RC', 'RCCM', 'RNE']);

export const normalizeIdFor = (scheme: string, value: string) => (FREE_TEXT_ID_SCHEMES.has(scheme) ? value.trim().replace(/\s+/g, ' ') : normalizeId(value));

/** Validates one identifier against its scheme. Unknown schemes and schemes without a check are accepted. */
export function validateId(country: string, scheme: string, value: string): boolean {
  const s = countryRules(country).idSchemes.find((x) => x.scheme === scheme);
  const v = normalizeId(value);
  if (!v) return true;
  return s?.validate ? s.validate(v) : v.length <= 40;
}

/** All ISO 3166 countries, named in the UI language. */
export function countryOptions(locale: string): { code: string; name: string }[] {
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const codes = 'AD AE AF AG AL AM AO AR AT AU AZ BA BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PS PT PY QA RE RO RS RU RW SA SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TR TT TW TZ UA UG US UY UZ VE VN YE ZA ZM ZW'.split(' ');
  return codes.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name, locale));
}

export { normalizeId };
