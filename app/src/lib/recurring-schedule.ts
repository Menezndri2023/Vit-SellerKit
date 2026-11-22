/** Recurring invoices: date arithmetic (pure, unit-tested). */
export type Frequency = 'monthly' | 'quarterly' | 'yearly';
export const FREQUENCIES: Frequency[] = ['monthly', 'quarterly', 'yearly'];
const MONTHS: Record<Frequency, number> = { monthly: 1, quarterly: 3, yearly: 12 };

/** Adds whole months, keeping the day when it exists (31 Jan + 1 month = 28/29 Feb). */
export function addMonthsClamped(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const target = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(date.getUTCDate(), lastDay)));
}

export const nextOccurrence = (date: Date, frequency: Frequency) => addMonthsClamped(date, MONTHS[frequency]);
