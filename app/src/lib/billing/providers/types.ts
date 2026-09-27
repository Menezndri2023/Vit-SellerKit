/**
 * Payment providers for Margokit's own subscriptions (Gumroad today; Paddle, Lemon Squeezy,
 * Stripe or CMI later). Access rights only depend on the Subscription collection, so switching
 * or adding a provider never touches the rest of the app.
 */
export type Plan = 'monthly' | 'lifetime';

export interface BillingProvider {
  readonly id: string;
  readonly name: string;
  /** Hosted checkout URL for a plan, or null if not configured. */
  checkoutUrl(plan: Plan): string | null;
  /**
   * Handles the provider's webhook. Must authenticate the request (secret URL and/or signature
   * over the raw body), be idempotent, and re-verify anything that grants access.
   */
  handleWebhook(req: Request, secret: string): Promise<Response>;
}
