import { z } from 'zod';
import { DOC_LOCALES, UNIT_CODES, VAT_CATEGORIES, VAT_REGIMES } from './catalog';
import { countryRules, normalizeId, validateId } from './countries';
import { isBic, isIban } from './countries/validators';
import { currencyDigits, parseAmount } from './money';

// Error messages are translation keys (namespace `errors`)
// Missing fields count as empty strings, so partial or hand-crafted requests get field errors, not crashes
const text = (max: number) => z.string().trim().max(max, 'tooLong').prefault('');
const optionalText = (max: number) => text(max).optional().transform((v) => v || undefined);
const required = (max: number) => z.string().trim().min(1, 'required').max(max, 'tooLong').prefault('');
const checkbox = z.union([z.literal('on'), z.literal('true'), z.literal('')]).optional().transform((v) => v === 'on' || v === 'true');
const email = z.string().trim().max(254, 'tooLong').prefault('').refine((v) => v === '' || z.email().safeParse(v).success, 'invalidEmail').transform((v) => v || undefined);
const url = z.string().trim().max(500, 'tooLong').prefault('').refine((v) => v === '' || /^https:\/\/[^\s]+\.[^\s]+/.test(v), 'invalidUrl').transform((v) => v || undefined);
const country = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'required').prefault('');
const currency = z.string().trim().toUpperCase().refine((c) => /^[A-Z]{3}$/.test(c) && currencyDigits(c) >= 0 && Intl.supportedValuesOf('currency').includes(c), 'invalid');
const percent = z.coerce.number('invalid').min(0, 'invalid').max(100, 'invalid');

export const addressSchema = z.object({
  line1: required(200),
  line2: optionalText(200),
  postalCode: optionalText(20),
  city: required(100),
  region: optionalText(100),
  country,
});

/** `{ SIREN: '552 032 534', VAT: '' }` → normalized list of non-empty identifiers (checked per country below). */
const identifiers = z
  .record(z.string(), z.string().trim().max(40, 'tooLong'))
  .optional()
  .default({})
  .transform((ids) => Object.entries(ids).filter(([, v]) => v !== '').map(([scheme, value]) => ({ scheme: scheme.slice(0, 20), value: normalizeId(value) })));

function checkIds(ctx: z.RefinementCtx, countryCode: string, ids: { scheme: string; value: string }[]) {
  for (const id of ids) {
    if (!validateId(countryCode, id.scheme, id.value)) ctx.addIssue({ code: 'custom', path: ['ids', id.scheme], message: 'invalidId' });
  }
}

const numberingPattern = text(40).refine((p) => /\{SEQ(:\d)?\}/.test(p), 'numberingSeq');

export const profileSchema = z
  .object({
    legalName: required(150),
    tradeName: optionalText(150),
    address: addressSchema,
    email,
    phone: optionalText(40),
    website: url,
    ids: identifiers,
    vatRegime: z.enum(VAT_REGIMES),
    vatOnDebits: checkbox,
    taxRates: z
      .array(z.object({ name: optionalText(40), rate: z.string().trim() }))
      .optional()
      .default([])
      .transform((rows, ctx) =>
        rows.flatMap((r, i) => {
          if (r.rate === '') return [];
          const rate = Number(r.rate.replace(',', '.'));
          if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
            ctx.addIssue({ code: 'custom', path: [i, 'rate'], message: 'invalid' });
            return [];
          }
          return [{ name: r.name, rate }];
        }),
      ),
    bankAccounts: z
      .array(z.object({ label: optionalText(60), holder: optionalText(150), iban: text(40), bic: text(11), accountNumber: optionalText(40), bankName: optionalText(100) }))
      .optional()
      .default([])
      .transform((rows) => rows.filter((r) => r.iban || r.accountNumber))
      .superRefine((rows, ctx) => {
        rows.forEach((r, i) => {
          if (r.iban && !isIban(r.iban)) ctx.addIssue({ code: 'custom', path: [i, 'iban'], message: 'invalidIban' });
          if (r.bic && !isBic(r.bic)) ctx.addIssue({ code: 'custom', path: [i, 'bic'], message: 'invalidBic' });
        });
      })
      .transform((rows) => rows.map((r) => ({ ...r, iban: r.iban ? normalizeId(r.iban) : undefined, bic: r.bic ? normalizeId(r.bic) : undefined }))),
    paymentLinks: z
      .array(z.object({ label: optionalText(60), url }))
      .optional()
      .default([])
      .transform((rows) => rows.filter((r) => r.url)),
    paymentTermsDays: z.coerce.number('invalid').int('invalid').min(0, 'invalid').max(365, 'invalid'),
    latePenaltyText: optionalText(500),
    defaultCurrency: currency,
    defaultDocLocale: z.enum(DOC_LOCALES),
    numbering: z.object({ invoice: numberingPattern, quote: numberingPattern, credit_note: numberingPattern }),
    legalMentions: optionalText(2000),
    footer: optionalText(500),
  })
  .superRefine((p, ctx) => {
    checkIds(ctx, p.address.country, p.ids);
    const rules = countryRules(p.address.country);
    if (p.vatOnDebits && !rules.vatOnDebitsOption) p.vatOnDebits = false;
  })
  .transform((p) => ({
    ...p,
    taxRates: p.taxRates.map((r) => ({ name: r.name, rate: r.rate, category: r.rate === 0 ? ('Z' as const) : ('S' as const) })),
  }));

export type ProfileInput = z.infer<typeof profileSchema>;

export const clientSchema = z
  .object({
    kind: z.enum(['business', 'individual']),
    name: required(150),
    contactName: optionalText(150),
    email,
    phone: optionalText(40),
    address: addressSchema,
    hasDeliveryAddress: checkbox,
    deliveryAddress: z.unknown().optional(),
    ids: identifiers,
    preferredDocLocale: z.enum(DOC_LOCALES).or(z.literal('')).optional().transform((v) => v || undefined),
    preferredCurrency: z.string().optional().transform((v) => v || undefined).pipe(currency.optional()),
    notes: optionalText(2000),
  })
  .superRefine((c, ctx) => {
    if (c.kind === 'business') checkIds(ctx, c.address.country, c.ids);
    if (c.hasDeliveryAddress) {
      const r = addressSchema.safeParse(c.deliveryAddress);
      if (!r.success) for (const i of r.error.issues) ctx.addIssue({ code: 'custom', path: ['deliveryAddress', ...i.path], message: i.message });
    }
  })
  .transform(({ hasDeliveryAddress, deliveryAddress, ...c }) => ({
    ...c,
    ids: c.kind === 'business' ? c.ids : [],
    deliveryAddress: hasDeliveryAddress ? addressSchema.parse(deliveryAddress) : undefined,
  }));

export type ClientInput = z.infer<typeof clientSchema>;

export const productSchema = z
  .object({
    name: required(150),
    description: optionalText(1000),
    kind: z.enum(['goods', 'service']),
    unitCode: z.enum(UNIT_CODES),
    currency,
    unitPrice: z.string().trim(),
    taxRate: percent,
    vatCategory: z.enum(VAT_CATEGORIES),
  })
  .transform((p, ctx) => {
    const minor = parseAmount(p.unitPrice, p.currency);
    if (minor === null || minor < 0) {
      ctx.addIssue({ code: 'custom', path: ['unitPrice'], message: 'invalidAmount' });
      return z.NEVER;
    }
    return { ...p, unitPrice: minor, taxRate: ['S'].includes(p.vatCategory) ? p.taxRate : 0 };
  });

export type ProductInput = z.infer<typeof productSchema>;
