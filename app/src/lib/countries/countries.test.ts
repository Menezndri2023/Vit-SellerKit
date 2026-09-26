import { describe, expect, it } from 'vitest';
import { countryOptions, countryRules, validateId } from '.';
import { isBelgianEnterprise, isFrenchVat, isSiren, isSiret, luhn, normalizeId } from './validators';

describe('identifier validators', () => {
  it('validates real French SIREN / SIRET (Luhn)', () => {
    expect(isSiren('552032534')).toBe(true); // Danone
    expect(isSiren('552032535')).toBe(false);
    expect(isSiret('55203253400646')).toBe(true);
    expect(isSiret('55203253400647')).toBe(false);
    expect(luhn('12a')).toBe(false);
  });

  it('validates French VAT keys', () => {
    expect(isFrenchVat('FR27552032534')).toBe(true); // Danone
    expect(isFrenchVat('FR83404833048')).toBe(true);
    expect(isFrenchVat('FR28552032534')).toBe(false);
  });

  it('validates Belgian enterprise numbers (mod 97)', () => {
    expect(isBelgianEnterprise('0202239951')).toBe(true); // Proximus
    expect(isBelgianEnterprise('BE0403170701')).toBe(true);
    expect(isBelgianEnterprise('0202239952')).toBe(false);
  });

  it('normalizes spaces, dots and dashes', () => {
    expect(normalizeId('552 032 534')).toBe('552032534');
    expect(normalizeId('be 0202.239.951')).toBe('BE0202239951');
  });
});

describe('countryRules', () => {
  it('has dedicated rules for key markets', () => {
    expect(countryRules('FR').einvoicing).toBe('fr-pa');
    expect(countryRules('fr').vatOnDebitsOption).toBe(true);
    expect(countryRules('MA').currency).toBe('MAD');
    expect(countryRules('MA').idSchemes.map((s) => s.scheme)).toContain('ICE');
    expect(countryRules('BE').einvoicing).toBe('peppol');
  });

  it('falls back to EU VAT or a generic tax ID', () => {
    expect(countryRules('PT').idSchemes[0].scheme).toBe('VAT');
    expect(countryRules('PT').currency).toBe('EUR');
    expect(countryRules('GR').idSchemes[0].placeholder).toBe('EL…');
    expect(countryRules('KE').idSchemes[0].scheme).toBe('TIN');
  });

  it('validates identifiers per country', () => {
    expect(validateId('FR', 'SIREN', '552 032 534')).toBe(true);
    expect(validateId('FR', 'SIREN', '552 032 535')).toBe(false);
    expect(validateId('MA', 'ICE', '001234567000089')).toBe(true);
    expect(validateId('MA', 'ICE', '12345')).toBe(false);
    expect(validateId('FR', 'SIREN', '')).toBe(true);
    expect(validateId('KE', 'TIN', 'P051234567Z')).toBe(true);
  });

  it('lists countries in the UI language', () => {
    const fr = countryOptions('fr');
    expect(fr.find((c) => c.code === 'MA')?.name).toBe('Maroc');
    expect(countryOptions('en').find((c) => c.code === 'MA')?.name).toBe('Morocco');
  });
});

describe('bank identifiers', async () => {
  const { isIban, isBic } = await import('./validators');
  it('validates IBAN checksums', () => {
    expect(isIban('FR76 3000 6000 0112 3456 7890 189')).toBe(true);
    expect(isIban('FR76 3000 6000 0112 3456 7890 188')).toBe(false);
    expect(isIban('BE68 5390 0754 7034')).toBe(true);
    expect(isIban('MA64 0115 1900 0001 2050 0053 4921')).toBe(true);
  });
  it('validates BIC format', () => {
    expect(isBic('BNPAFRPP')).toBe(true);
    expect(isBic('BNPAFRPPXXX')).toBe(true);
    expect(isBic('BNP')).toBe(false);
  });
});
