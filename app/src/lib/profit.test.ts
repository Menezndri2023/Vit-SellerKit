import { describe, expect, it } from 'vitest';
import { computeProfit, type ProfitInputs } from './profit';

// Default values of the Seller Pack price calculator (validated in Google Sheets)
const sheetDefaults: ProfitInputs = {
  price: 25,
  productCost: 6,
  packaging: 0.5,
  shipping: 5,
  returnCost: 3,
  platformPct: 0,
  platformFixed: 0,
  paymentPct: 0.029,
  adCostPerOrder: 4,
  returnRate: 0.2,
  adBudget: 300,
};

describe('computeProfit', () => {
  it('matches the Seller Pack price calculator', () => {
    const r = computeProfit(sheetDefaults)!;
    expect(r.profit).toBeCloseTo(5.65, 2);
    expect(r.margin).toBeCloseTo(0.226, 3);
    expect(r.realCost).toBeCloseTo(19.35, 2);
    expect(r.breakEvenPrice).toBeCloseTo(19.18, 2);
    expect(r.price30).toBeCloseTo(27.76, 2);
    expect(r.price50).toBeCloseTo(39.54, 2);
    expect(r.maxAdCost).toBeCloseTo(8.52, 2);
    expect(r.breakEvenRoas).toBeCloseTo(2.93, 2);
    expect(r.ordersToRecoup).toBe(36);
    expect(r.status).toBe('ok');
  });

  it('breaks even exactly at the break-even price', () => {
    const r = computeProfit(sheetDefaults)!;
    const atBreakEven = computeProfit({ ...sheetDefaults, price: r.breakEvenPrice! })!;
    expect(atBreakEven.profit).toBeCloseTo(0, 8);
  });

  it('hits the target margin at the suggested prices', () => {
    const r = computeProfit(sheetDefaults)!;
    expect(computeProfit({ ...sheetDefaults, price: r.price30! })!.margin).toBeCloseTo(0.3, 8);
    expect(computeProfit({ ...sheetDefaults, price: r.price50! })!.margin).toBeCloseTo(0.5, 8);
  });

  it('breaks even when the ad cost equals the max ad cost', () => {
    const r = computeProfit(sheetDefaults)!;
    expect(computeProfit({ ...sheetDefaults, adCostPerOrder: r.maxAdCost })!.profit).toBeCloseTo(0, 8);
  });

  it('with no returns, fees or ads, profit is price minus costs', () => {
    const r = computeProfit({ ...sheetDefaults, returnRate: 0, paymentPct: 0, adCostPerOrder: 0 })!;
    expect(r.profit).toBeCloseTo(25 - 6 - 0.5 - 5, 8);
    expect(r.breakEvenRoas).toBeCloseTo(25 / 13.5, 8);
  });

  it('flags losses and thin margins', () => {
    expect(computeProfit({ ...sheetDefaults, price: 15 })!.status).toBe('loss');
    expect(computeProfit({ ...sheetDefaults, price: 23 })!.status).toBe('thin');
  });

  it('returns null when the numbers cannot give a result', () => {
    expect(computeProfit({ ...sheetDefaults, price: 0 })).toBeNull();
    expect(computeProfit({ ...sheetDefaults, returnRate: 1 })).toBeNull();
    expect(computeProfit({ ...sheetDefaults, platformPct: 0.6, paymentPct: 0.5 })).toBeNull();
  });

  it('has no suggested price when fees make the margin impossible', () => {
    const r = computeProfit({ ...sheetDefaults, platformPct: 0.4, paymentPct: 0.2 })!;
    expect(r.price50).toBeNull();
    expect(r.price30).not.toBeNull();
  });
});
