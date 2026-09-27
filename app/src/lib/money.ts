import { fmtLocale, normalizeDigits } from './intl';

/**
 * Money is stored as integer minor units (cents) to avoid floating-point errors.
 * The number of decimals depends on the currency (EUR 2, XOF 0, TND 3…), taken from Intl.
 */

export function currencyDigits(currency: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** "12,5" / "12.50" / "1 234.5" → minor units (1250, 1250, 123450). Returns null if not a valid amount. */
export function parseAmount(input: string, currency: string): number | null {
  const s = normalizeDigits(input).replace(/[\s  ]/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const digits = currencyDigits(currency);
  const [int, frac = ''] = s.replace('-', '').split('.');
  if (frac.length > digits) return null;
  const minor = Number(int) * 10 ** digits + Number(frac.padEnd(digits, '0') || 0);
  return s.startsWith('-') ? -minor : minor;
}

export const toMajor = (minor: number, currency: string) => minor / 10 ** currencyDigits(currency);

/** Minor units → plain decimal string for inputs ("12.5" for 1250 EUR). */
export function toInput(minor: number, currency: string, locale: string): string {
  const v = String(toMajor(minor, currency));
  return locale === 'fr' ? v.replace('.', ',') : v;
}

export function formatMinor(minor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(fmtLocale(locale), { style: 'currency', currency }).format(toMajor(minor, currency));
}

export const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'MAD', 'XOF', 'XAF', 'TND', 'DZD', 'AED', 'SAR', 'EGP', 'NGN', 'KES', 'ZAR'];
