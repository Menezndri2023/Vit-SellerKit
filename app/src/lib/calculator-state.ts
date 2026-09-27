import { z } from 'zod';
import { fmtLocale } from './intl';
import type { ProfitInputs } from './profit';

/**
 * Platform fee presets. Fees change often — values checked in September 2026,
 * rounded, for a standard seller in the US. The UI tells users to check their own fees.
 */
export const PLATFORM_PRESETS = {
  direct: { platformPct: 0, platformFixed: 0, paymentPct: 0 },
  shopify: { platformPct: 0, platformFixed: 0.3, paymentPct: 2.9 },
  etsy: { platformPct: 6.5, platformFixed: 0.45, paymentPct: 3 },
  tiktok: { platformPct: 6, platformFixed: 0, paymentPct: 0 },
  custom: null,
} as const;

export type Platform = keyof typeof PLATFORM_PRESETS;
export const PLATFORMS = Object.keys(PLATFORM_PRESETS) as Platform[];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'MAD', 'XOF', 'TND', 'DZD', 'AED', 'SAR'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Form state, in display units (percentages as 0–100). Keys double as URL query params. */
export const stateSchema = z.object({
  cur: z.enum(CURRENCIES).catch('USD'),
  pl: z.enum(PLATFORMS as [Platform, ...Platform[]]).catch('direct'),
  p: z.coerce.number().min(0).max(1e9).catch(25),
  pc: z.coerce.number().min(0).max(1e9).catch(6),
  pk: z.coerce.number().min(0).max(1e9).catch(0.5),
  sh: z.coerce.number().min(0).max(1e9).catch(5),
  rc: z.coerce.number().min(0).max(1e9).catch(0),
  pf: z.coerce.number().min(0).max(100).catch(0),
  ff: z.coerce.number().min(0).max(1e9).catch(0),
  pay: z.coerce.number().min(0).max(100).catch(0),
  ad: z.coerce.number().min(0).max(1e9).catch(4),
  rr: z.coerce.number().min(0).max(99).catch(20),
  b: z.coerce.number().min(0).max(1e12).catch(300),
});

export type CalculatorState = z.infer<typeof stateSchema>;
export type NumberField = Exclude<keyof CalculatorState, 'cur' | 'pl'>;

const defaultCurrency: Record<string, Currency> = { en: 'USD', fr: 'EUR' };

export function parseState(params: Record<string, string | string[] | undefined>, locale: string): CalculatorState {
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params)) flat[k] = Array.isArray(v) ? v[0] : v;
  if (!flat.cur) flat.cur = defaultCurrency[locale] ?? 'USD';
  return stateSchema.parse(flat);
}

export function toQuery(s: CalculatorState): string {
  return new URLSearchParams(Object.entries(s).map(([k, v]) => [k, String(v)])).toString();
}

export function toInputs(s: CalculatorState): ProfitInputs {
  return {
    price: s.p,
    productCost: s.pc,
    packaging: s.pk,
    shipping: s.sh,
    returnCost: s.rc,
    platformPct: s.pf / 100,
    platformFixed: s.ff,
    paymentPct: s.pay / 100,
    adCostPerOrder: s.ad,
    returnRate: s.rr / 100,
    adBudget: s.b,
  };
}

export function formatMoney(value: number, currency: Currency, locale: string): string {
  return new Intl.NumberFormat(fmtLocale(locale), { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export function formatPct(value: number, locale: string): string {
  return new Intl.NumberFormat(fmtLocale(locale), { style: 'percent', maximumFractionDigits: 1 }).format(value);
}
