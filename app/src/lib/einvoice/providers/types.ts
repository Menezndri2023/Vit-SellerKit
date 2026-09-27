/**
 * E-invoicing transmission providers: a French "Plateforme Agréée" (PA) partner, or a Peppol access point.
 * Margokit is a "compatible solution": it produces the structured invoice and hands it to the provider,
 * which delivers it and reports lifecycle statuses. Adding a partner = implementing this interface.
 */

/** Lifecycle statuses of the French e-invoicing reform (names; the provider maps its own codes). */
export const LIFECYCLE = [
  'submitted', // déposée
  'issued', // émise par la plateforme
  'received', // reçue par la plateforme du destinataire
  'made_available', // mise à disposition du destinataire
  'in_process', // prise en charge
  'approved', // approuvée
  'partially_approved', // approuvée partiellement
  'disputed', // en litige
  'suspended', // suspendue
  'refused', // refusée par le destinataire
  'rejected', // rejetée (erreur de format / contrôle)
  'payment_sent', // paiement transmis
  'cashed', // encaissée
] as const;
export type LifecycleStatus = (typeof LIFECYCLE)[number];

export type LifecycleEvent = { status: LifecycleStatus; at: Date; reason?: string };

export type OutgoingInvoice = {
  number: string;
  /** Factur-X PDF (PDF/A-3 with CII XML) */
  facturX: Uint8Array;
  /** UBL 2.1 XML (Peppol BIS 3.0) */
  ubl: string;
  seller: { name: string; country: string; siren?: string; vat?: string };
  buyer: { name: string; country: string; siren?: string; vat?: string; email?: string };
  currency: string;
  totalInclTax: number;
};

export interface EInvoicingProvider {
  readonly id: string;
  readonly name: string;
  /** Submits the invoice; returns the provider's reference and the first status. */
  send(invoice: OutgoingInvoice): Promise<{ providerId: string; event: LifecycleEvent }>;
  /** Current lifecycle events for a submitted invoice (polling fallback). */
  getStatus(providerId: string): Promise<LifecycleEvent[]>;
  /** Tells the platform the invoice was paid ("encaissée"), required in France for VAT on receipts. */
  reportPayment(providerId: string, paidAt: Date, amount: number): Promise<LifecycleEvent>;
  /** Parses a status webhook sent by the provider (already authenticated by the route). */
  parseWebhook(body: unknown): { providerId: string; event: LifecycleEvent } | null;
}
