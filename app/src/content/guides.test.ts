import { describe, expect, it } from 'vitest';
import { computeProfit } from '@/lib/profit';
import { GUIDES, MARGIN_EXAMPLE, MARGIN_EXAMPLE_RESULTS } from './guides';

describe('guides', () => {
  it('the margin guide’s worked example matches the calculator', () => {
    const r = computeProfit(MARGIN_EXAMPLE)!;
    const e = MARGIN_EXAMPLE_RESULTS;
    expect(r.profit).toBeCloseTo(e.profit, 2);
    expect(r.margin * 100).toBeCloseTo(e.margin, 1);
    expect(r.breakEvenPrice!).toBeCloseTo(e.breakEvenPrice, 2);
    expect(r.maxAdCost).toBeCloseTo(e.maxAdCost, 2);
    expect(r.breakEvenRoas!).toBeCloseTo(e.breakEvenRoas, 2);
    const naive = MARGIN_EXAMPLE.price - MARGIN_EXAMPLE.productCost - MARGIN_EXAMPLE.packaging - MARGIN_EXAMPLE.shipping - MARGIN_EXAMPLE.adCostPerOrder;
    expect(naive).toBe(e.naiveProfit);
    // The published text shows these exact numbers
    const fr = JSON.stringify(GUIDES.find((g) => g.id === 'profit-margin')!.text.fr);
    for (const s of ['48,33', '19,3 %', '201,67', '76,25', '3,28', '= 80 DH']) expect(fr).toContain(s);
    const en = JSON.stringify(GUIDES.find((g) => g.id === 'profit-margin')!.text.en);
    for (const s of ['48.33', '19.3%', '201.67', '76.25', '3.28', '= 80 MAD']) expect(en).toContain(s);
  });

  it('every guide exists in French and English with unique slugs, titles and descriptions', () => {
    const slugs = GUIDES.flatMap((g) => [g.text.fr.slug, g.text.en.slug]);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const g of GUIDES) for (const l of ['fr', 'en'] as const) {
      expect(g.text[l].title.length).toBeLessThan(90);
      expect(g.text[l].description.length).toBeGreaterThan(80);
      expect(g.text[l].description.length).toBeLessThan(200);
      expect(g.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('regulatory guides cite their source', () => {
    for (const l of ['fr', 'en'] as const) expect(GUIDES.find((g) => g.id === 'morocco-invoice')!.text[l].sources?.[0].url).toBe('https://www.tax.gov.ma');
  });
});
