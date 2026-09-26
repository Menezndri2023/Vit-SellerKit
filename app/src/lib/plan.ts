import 'server-only';

/**
 * Plan limits. The free plan will allow 3 issued documents per month with a watermark
 * (implemented with subscriptions in M5). Until then every user is treated as free
 * but without a hard limit, so the flow can be tested end to end.
 */
export type PlanCheck = { allowed: boolean; watermark: boolean; used: number; limit: number | null };

export async function checkIssueAllowed(userId: string): Promise<PlanCheck> {
  void userId;
  return { allowed: true, watermark: false, used: 0, limit: null };
}
