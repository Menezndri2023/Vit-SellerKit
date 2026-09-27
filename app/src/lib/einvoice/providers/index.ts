import { sandboxProvider } from './sandbox';
import type { EInvoicingProvider } from './types';

/**
 * The configured transmission provider (EINVOICE_PROVIDER), or null when transmission is off.
 * To add a partner: implement EInvoicingProvider in ./<partner>.ts and register it here.
 */
const PROVIDERS: Record<string, EInvoicingProvider> = { sandbox: sandboxProvider };

export function einvoicingProvider(): EInvoicingProvider | null {
  const id = process.env.EINVOICE_PROVIDER;
  if (!id || id === 'none') return null;
  if (id === 'sandbox' && process.env.VERCEL_ENV === 'production') return null;
  return PROVIDERS[id] ?? null;
}

export type { EInvoicingProvider, LifecycleEvent, LifecycleStatus, OutgoingInvoice } from './types';
