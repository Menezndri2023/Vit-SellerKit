/** Check-digit validators for business identifiers. Inputs are normalized (spaces, dots, dashes removed). */

export const normalizeId = (value: string) => value.replace(/[\s.\-/]/g, '').toUpperCase();

/** Luhn checksum (French SIREN / SIRET). */
export function luhn(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export const isSiren = (v: string) => /^\d{9}$/.test(v) && luhn(v);

/** SIRET = SIREN + 5-digit establishment number. La Poste establishments are an official exception to Luhn. */
export const isSiret = (v: string) => /^\d{14}$/.test(v) && (luhn(v) || (v.startsWith('356000000') && [...v].reduce((s, d) => s + Number(d), 0) % 5 === 0));

/** French VAT number: FR + 2-digit key + SIREN, key = (12 + 3 × (SIREN mod 97)) mod 97. */
export function isFrenchVat(v: string): boolean {
  const m = /^FR(\d{2})(\d{9})$/.exec(v);
  if (!m) return /^FR[A-HJ-NP-Z0-9]{2}\d{9}$/.test(v); // new alphanumeric keys: format check only
  return Number(m[1]) === (12 + 3 * (Number(m[2]) % 97)) % 97;
}

/** Belgian enterprise number (BCE/KBO): 10 digits, last 2 = 97 − (first 8 mod 97). */
export function isBelgianEnterprise(v: string): boolean {
  const n = v.startsWith('BE') ? v.slice(2) : v;
  if (!/^[01]\d{9}$/.test(n)) return false;
  return 97 - (Number(n.slice(0, 8)) % 97) === Number(n.slice(8));
}

export const isBelgianVat = (v: string) => v.startsWith('BE') && isBelgianEnterprise(v);

/** Moroccan ICE: 15 digits (9 company + 4 establishment + 2 key). */
export const isMoroccanIce = (v: string) => /^\d{15}$/.test(v);

/** Generic EU VAT format: 2-letter country prefix + 2–13 alphanumerics. */
export const isEuVatFormat = (v: string) => /^(AT|BE|BG|CY|CZ|DE|DK|EE|EL|ES|FI|FR|HR|HU|IE|IT|LT|LU|LV|MT|NL|PL|PT|RO|SE|SI|SK|XI)[A-Z0-9]{2,13}$/.test(v);

/** IBAN (ISO 13616): move first 4 chars to the end, letters → numbers, mod 97 must equal 1. */
export function isIban(value: string): boolean {
  const v = normalizeId(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v)) return false;
  const digits = (v.slice(4) + v.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

export const isBic = (value: string) => /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalizeId(value));
