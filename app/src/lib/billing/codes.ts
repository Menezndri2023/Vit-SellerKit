import { randomBytes } from 'node:crypto';

/** No 0/O, 1/I/L: easy to read out loud or type from a WhatsApp message. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** MK-XXXX-XXXX-XXXX: 12 random characters from a 31-symbol alphabet (~59 bits). */
export function generateCode(): string {
  const bytes = randomBytes(24);
  let out = '';
  for (const b of bytes) {
    if (b >= 248) continue; // rejection sampling: 248 = 31 × 8, keeps the distribution uniform
    out += ALPHABET[b % 31];
    if (out.length === 12) break;
  }
  if (out.length < 12) return generateCode();
  return `MK-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8)}`;
}

/** Accepts lowercase, spaces and missing dashes typed by hand. */
export function normalizeCode(input: string): string | null {
  const s = input.toUpperCase().replace(/[\s-]/g, '');
  const body = s.startsWith('MK') ? s.slice(2) : s;
  if (!/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$/.test(body)) return null;
  return `MK-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}`;
}

export const looksLikeCode = (input: string) => /^\s*mk[\s-]?/i.test(input);
