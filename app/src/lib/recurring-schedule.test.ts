import { describe, expect, it } from 'vitest';
import { addMonthsClamped, nextOccurrence } from './recurring-schedule';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

describe('recurring invoice dates', () => {
  it('monthly, quarterly, yearly', () => {
    expect(iso(nextOccurrence(d('2026-11-22'), 'monthly'))).toBe('2026-12-22');
    expect(iso(nextOccurrence(d('2026-11-22'), 'quarterly'))).toBe('2027-02-22');
    expect(iso(nextOccurrence(d('2026-11-22'), 'yearly'))).toBe('2027-11-22');
  });
  it('keeps the end of month without skipping a month', () => {
    expect(iso(addMonthsClamped(d('2027-01-31'), 1))).toBe('2027-02-28');
    expect(iso(addMonthsClamped(d('2028-01-31'), 1))).toBe('2028-02-29');
    expect(iso(addMonthsClamped(d('2026-12-15'), 1))).toBe('2027-01-15');
  });
});
