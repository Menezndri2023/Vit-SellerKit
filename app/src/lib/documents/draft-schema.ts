import { z } from 'zod';
import { DOC_LOCALES, UNIT_CODES, VAT_CATEGORIES } from '../catalog';
import { parseAmount } from '../money';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid');
const optionalDate = z.union([isoDate, z.literal('')]).optional().transform((v) => v || undefined);

/** Quantities: up to 3 decimals, comma or dot. */
const qty = z
  .union([z.string(), z.number()])
  .transform((v) => Number(String(v).replace(',', '.')))
  .refine((n) => Number.isFinite(n) && n >= 0 && n <= 1e9 && Math.round(n * 1000) === n * 1000, 'invalid');

export const lineSchema = z.object({
  productId: z.string().max(40).optional(),
  description: z.string().trim().min(1, 'required').max(1000, 'tooLong'),
  kind: z.enum(['goods', 'service']).default('service'),
  qty,
  unitCode: z.enum(UNIT_CODES).default('C62'),
  unitPrice: z.string().trim(),
  discountPct: z.coerce.number('invalid').min(0, 'invalid').max(100, 'invalid').default(0),
  vatCategory: z.enum(VAT_CATEGORIES),
  taxRate: z.coerce.number('invalid').min(0, 'invalid').max(100, 'invalid'),
  exemptionReason: z.string().trim().max(300, 'tooLong').optional(),
});

/** The editor sends its state as JSON; everything is re-validated and totals recomputed on the server. */
export const draftSchema = z
  .object({
    id: z.string().max(40).optional(),
    type: z.enum(['quote', 'invoice', 'credit_note', 'deposit_invoice']),
    clientId: z.string().max(40).optional(),
    issueDate: isoDate,
    dueDate: optionalDate,
    validUntil: optionalDate,
    serviceDate: optionalDate,
    currency: z.string().regex(/^[A-Z]{3}$/, 'invalid'),
    docLocale: z.enum(DOC_LOCALES),
    buyerReference: z.string().trim().max(100, 'tooLong').optional(),
    notes: z.string().trim().max(2000, 'tooLong').optional(),
    lines: z.array(lineSchema).max(200, 'tooLong'),
  })
  .transform((d, ctx) => {
    const lines = d.lines.map((l, i) => {
      const unitPrice = parseAmount(l.unitPrice, d.currency);
      if (unitPrice === null) ctx.addIssue({ code: 'custom', path: ['lines', i, 'unitPrice'], message: 'invalidAmount' });
      return { ...l, unitPrice: unitPrice ?? 0, taxRate: l.vatCategory === 'S' ? l.taxRate : 0, exemptionReason: l.vatCategory === 'E' ? l.exemptionReason : undefined };
    });
    return { ...d, lines };
  });

export type DraftInput = z.infer<typeof draftSchema>;
