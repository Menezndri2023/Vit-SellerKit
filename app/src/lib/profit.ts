/**
 * Profit per order for online sellers, including refused / returned parcels.
 *
 * Model (per shipped order, delivery rate d = 1 − returnRate):
 * - delivered parcels pay the price and cost the product + platform & payment fees;
 * - every shipped parcel costs packaging, shipping and the ad cost;
 * - refused parcels also cost the return fee, and the product goes back to stock.
 *
 * Same formulas as the "Price calculator" tab of the Seller Pack (sheets/tracker/Code.gs).
 */

export type ProfitInputs = {
  price: number;
  productCost: number;
  packaging: number;
  shipping: number;
  /** Extra cost you pay when a parcel comes back (return label, carrier fee). */
  returnCost: number;
  /** Fractions: 0.065 = 6.5 % */
  platformPct: number;
  platformFixed: number;
  paymentPct: number;
  adCostPerOrder: number;
  returnRate: number;
  adBudget: number;
};

export type ProfitStatus = 'loss' | 'thin' | 'ok';

export type ProfitResults = {
  deliveryRate: number;
  /** Net profit per delivered order, after all costs and lost parcels. */
  profit: number;
  /** profit ÷ price */
  margin: number;
  /** What one delivered order really costs you, returns included. */
  realCost: number;
  breakEvenPrice: number | null;
  price30: number | null;
  price50: number | null;
  /** Highest ad cost per order that still breaks even. */
  maxAdCost: number;
  /** Minimum ROAS (as shown in the ads manager: price ÷ ad cost per order) to break even. */
  breakEvenRoas: number | null;
  /** Orders needed to earn back the ad budget. */
  ordersToRecoup: number | null;
  status: ProfitStatus;
};

/** Minimum margin considered healthy. */
export const THIN_MARGIN = 0.2;

export function computeProfit(i: ProfitInputs): ProfitResults | null {
  const d = 1 - i.returnRate;
  const net = 1 - i.platformPct - i.paymentPct;
  if (!(i.price > 0) || !(d > 0) || !(net > 0)) return null;

  // Costs per delivered order that do not depend on the price
  const perShipped = i.packaging + i.shipping + (1 - d) * i.returnCost + i.adCostPerOrder;
  const base = i.platformFixed + i.productCost + perShipped / d;

  const profit = i.price * net - base;
  const margin = profit / i.price;
  const priceFor = (m: number) => (net - m > 0 ? base / (net - m) : null);

  const maxAdCost = d * (i.price * net - i.platformFixed - i.productCost) - i.packaging - i.shipping - (1 - d) * i.returnCost;
  const breakEvenRoas = maxAdCost > 0 ? i.price / maxAdCost : null;
  const ordersToRecoup = maxAdCost > 0 && i.adBudget > 0 ? Math.ceil(i.adBudget / maxAdCost) : null;

  return {
    deliveryRate: d,
    profit,
    margin,
    realCost: i.price - profit,
    breakEvenPrice: priceFor(0),
    price30: priceFor(0.3),
    price50: priceFor(0.5),
    maxAdCost,
    breakEvenRoas,
    ordersToRecoup,
    status: profit < 0 ? 'loss' : margin < THIN_MARGIN ? 'thin' : 'ok',
  };
}
