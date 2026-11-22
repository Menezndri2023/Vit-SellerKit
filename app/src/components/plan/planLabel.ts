import type { PlanInfo } from '@/lib/plan';

/** Translation key + values describing the current plan. */
export function planLabel(p: PlanInfo, formatDate: (d: Date) => string): { key: string; values?: Record<string, string> } {
  const s = p.subscription;
  if (!s) return { key: 'free' };
  if (s.plan === 'trial' && p.expiresAt) return { key: 'trial', values: { date: formatDate(p.expiresAt) } };
  if (s.plan === 'lifetime') return { key: 'lifetime' };
  if (s.plan === 'annual') return s.status === 'cancelled' && p.expiresAt ? { key: 'annualCancelled', values: { date: formatDate(p.expiresAt) } } : { key: 'annual' };
  if (s.plan === 'monthly') return s.status === 'cancelled' && p.expiresAt ? { key: 'monthlyCancelled', values: { date: formatDate(p.expiresAt) } } : { key: 'monthly' };
  return p.expiresAt ? { key: 'manualUntil', values: { date: formatDate(p.expiresAt) } } : { key: 'manualLifetime' };
}
