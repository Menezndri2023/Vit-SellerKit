import { describe, expect, it } from 'vitest';
import { publicName, reviewFormSchema, saleMatchesKit, summarize } from './reviews-shared';

const valid = { kit: 'tracker', rating: '5', name: 'Salma Bennani', comment: 'Je vois enfin mon vrai bénéfice par commande.', consent: 'on', email: 'Salma@Example.com' };

describe('review form', () => {
  it('accepts a valid review and normalises it', () => {
    const r = reviewFormSchema.parse(valid);
    expect(r.rating).toBe(5);
    expect(r.email).toBe('salma@example.com');
    expect(r.location).toBeUndefined();
  });

  it('rejects bad input with translation keys', () => {
    const r = reviewFormSchema.safeParse({ ...valid, rating: '6', comment: 'trop court', consent: undefined, kit: 'other' });
    expect(r.success).toBe(false);
    const msgs = Object.fromEntries(r.error!.issues.map((i) => [i.path.join('.'), i.message]));
    expect(msgs).toMatchObject({ rating: 'rating', comment: 'commentTooShort', consent: 'consent', kit: 'required' });
  });

  it('rejects bots filling the honeypot', () => {
    expect(reviewFormSchema.safeParse({ ...valid, website: 'spam.example' }).success).toBe(false);
  });

  it('treats an empty email as absent', () => {
    expect(reviewFormSchema.parse({ ...valid, email: '' }).email).toBeUndefined();
  });
});

describe('publicName', () => {
  it('keeps the first name and the initial of the last name', () => {
    expect(publicName('Salma Bennani')).toBe('Salma B.');
    expect(publicName('  jean  pierre  martin ')).toBe('jean M.');
    expect(publicName('Imane')).toBe('Imane');
  });
});

describe('saleMatchesKit', () => {
  const ids = { monthly: 'prod_monthly', lifetime: 'prod_lifetime' };
  const tracker = { productName: 'Order & Inventory Tracker — Google Sheets for Online Sellers (EN/FR)' };
  const pack = { productName: 'Seller Pack — Profit, Ads, Content & Cash in Google Sheets (EN/FR)' };
  it('matches each kit to its own product only', () => {
    expect(saleMatchesKit('tracker', tracker, ids)).toBe(true);
    expect(saleMatchesKit('pack', tracker, ids)).toBe(false);
    expect(saleMatchesKit('pack', pack, ids)).toBe(true);
    expect(saleMatchesKit('tracker', pack, ids)).toBe(false);
    expect(saleMatchesKit('pro', { productId: 'prod_lifetime', productName: 'Margokit Pro — Lifetime' }, ids)).toBe(true);
    expect(saleMatchesKit('pro', tracker, ids)).toBe(false);
    expect(saleMatchesKit('calculator', tracker, ids)).toBe(false);
  });
});

describe('summarize', () => {
  it('averages to one decimal', () => {
    expect(summarize('pro', [5, 4, 4])).toEqual({ kit: 'pro', count: 3, average: 4.3 });
    expect(summarize('pack', [])).toEqual({ kit: 'pack', count: 0, average: null });
  });
});
