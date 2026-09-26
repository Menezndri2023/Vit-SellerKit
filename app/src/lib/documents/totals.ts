/**
 * Invoice totals, EN 16931 style, in integer minor units:
 * - line net amount = qty × unit price × (1 − discount), rounded per line;
 * - VAT is computed per breakdown group (same category + rate) on the sum of line nets,
 *   then rounded once per group (BT-117 = BT-116 × rate);
 * - total incl. tax = total excl. tax + total VAT.
 * The server recomputes totals on every save; the browser only shows a preview.
 */
import type { VatCategory } from '../catalog';

export type LineInput = {
  qty: number;
  /** Minor units */
  unitPrice: number;
  /** 0–100 */
  discountPct: number;
  vatCategory: VatCategory;
  /** 0–100, only meaningful for category S */
  taxRate: number;
};

export type TaxGroup = { category: VatCategory; rate: number; base: number; amount: number };

export type Totals = {
  lines: number[];
  totalExclTax: number;
  taxBreakdown: TaxGroup[];
  totalTax: number;
  totalInclTax: number;
};

/** Round half away from zero (commercial rounding). */
export const roundMinor = (value: number) => Math.sign(value) * Math.round(Math.abs(value) + Number.EPSILON * 10);

export const effectiveRate = (l: Pick<LineInput, 'vatCategory' | 'taxRate'>) => (l.vatCategory === 'S' ? l.taxRate : 0);

export function lineNet(l: LineInput): number {
  return roundMinor(l.qty * l.unitPrice * (1 - l.discountPct / 100));
}

export function computeTotals(lines: LineInput[]): Totals {
  const nets = lines.map(lineNet);
  const groups = new Map<string, TaxGroup>();
  lines.forEach((l, i) => {
    const rate = effectiveRate(l);
    const key = `${l.vatCategory}|${rate}`;
    const g = groups.get(key) ?? { category: l.vatCategory, rate, base: 0, amount: 0 };
    g.base += nets[i];
    groups.set(key, g);
  });
  const taxBreakdown = [...groups.values()]
    .map((g) => ({ ...g, amount: roundMinor((g.base * g.rate) / 100) }))
    .sort((a, b) => b.rate - a.rate || a.category.localeCompare(b.category));
  const totalExclTax = nets.reduce((s, n) => s + n, 0);
  const totalTax = taxBreakdown.reduce((s, g) => s + g.amount, 0);
  return { lines: nets, totalExclTax, taxBreakdown, totalTax, totalInclTax: totalExclTax + totalTax };
}

/** "Goods", "services" or "mixed" — the French "nature of the operation" mention, derived from the lines. */
export function operationCategory(kinds: ('goods' | 'service')[]): 'goods' | 'services' | 'mixed' {
  const hasGoods = kinds.includes('goods');
  const hasServices = kinds.includes('service');
  if (hasGoods && hasServices) return 'mixed';
  return hasGoods ? 'goods' : 'services';
}
