import { describe, expect, it } from 'vitest';
import { currencyDigits, formatMinor, parseAmount, toInput } from './money';

describe('money', () => {
  it('knows currency decimals', () => {
    expect(currencyDigits('EUR')).toBe(2);
    expect(currencyDigits('XOF')).toBe(0);
    expect(currencyDigits('TND')).toBe(3);
  });

  it('parses user input into minor units', () => {
    expect(parseAmount('12,5', 'EUR')).toBe(1250);
    expect(parseAmount('1 234.50', 'EUR')).toBe(123450);
    expect(parseAmount('5000', 'XOF')).toBe(5000);
    expect(parseAmount('1.234', 'TND')).toBe(1234);
    expect(parseAmount('0.1', 'EUR')).toBe(10);
    expect(parseAmount('12.345', 'EUR')).toBeNull();
    expect(parseAmount('abc', 'EUR')).toBeNull();
    expect(parseAmount('12.5', 'XOF')).toBeNull();
  });

  it('formats and round-trips', () => {
    expect(formatMinor(123450, 'EUR', 'en')).toBe('€1,234.50');
    expect(toInput(1250, 'EUR', 'fr')).toBe('12,5');
    expect(parseAmount(toInput(1999, 'MAD', 'fr'), 'MAD')).toBe(1999);
  });
});

describe('arabic input and display', async () => {
  const { fmtLocale } = await import('./intl');
  it('parses Arabic-Indic digits and separators', () => {
    expect(parseAmount('١٢٥٫٥٠', 'MAD')).toBe(12550);
    expect(parseAmount('۳۰۰', 'EUR')).toBe(30000);
  });
  it('shows Latin digits in the Arabic UI', () => {
    expect(formatMinor(123450, 'MAD', 'ar')).toMatch(/1,234\.50|1٬234٫50|1234/);
    expect(new Intl.NumberFormat(fmtLocale('ar')).format(1234)).toBe('1,234');
  });
});
