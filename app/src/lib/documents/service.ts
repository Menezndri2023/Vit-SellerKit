import 'server-only';
import { isValidObjectId } from 'mongoose';
import type { BusinessProfileDoc } from '@/models/BusinessProfile';
import type { ClientDoc } from '@/models/Client';
import { Document, type DocumentDoc } from '@/models/Document';
import type { BuyerSnapshot, SellerSnapshot } from './compliance';
import { computeTotals, operationCategory } from './totals';

export type BankAccountSnapshot = { label?: string; holder?: string; iban?: string; bic?: string; accountNumber?: string; bankName?: string };
export type SellerWithPayment = SellerSnapshot & { bankAccount?: BankAccountSnapshot; paymentLinks?: { label?: string; url?: string }[] };

const clean = <T extends object>(o: T | null | undefined) =>
  o ? (Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '')) as { [K in keyof T]?: NonNullable<T[K]> }) : undefined;

export function sellerSnapshot(p: BusinessProfileDoc): SellerWithPayment {
  return {
    legalName: p.legalName,
    tradeName: p.tradeName ?? undefined,
    address: p.address as SellerSnapshot['address'],
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    website: p.website ?? undefined,
    ids: p.ids ?? [],
    vatRegime: (p.vatRegime ?? 'standard') as SellerSnapshot['vatRegime'],
    vatOnDebits: p.vatOnDebits ?? false,
    latePenaltyText: p.latePenaltyText ?? undefined,
    latePenaltyTextEn: p.latePenaltyTextEn ?? undefined,
    legalMentions: p.legalMentions ?? undefined,
    footer: p.footer ?? undefined,
    logoKey: p.logo?.key ?? undefined,
    bankAccount: clean(p.bankAccounts?.[0]) as BankAccountSnapshot | undefined,
    paymentLinks: (p.paymentLinks ?? []).map((l) => clean(l) as { label?: string; url?: string }).filter((l) => l.url),
  };
}

export function buyerSnapshot(c: ClientDoc): BuyerSnapshot & { phone?: string } {
  return {
    kind: c.kind as BuyerSnapshot['kind'],
    name: c.name,
    contactName: c.contactName ?? undefined,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    address: c.address as BuyerSnapshot['address'],
    deliveryAddress: (c.deliveryAddress as BuyerSnapshot['deliveryAddress']) ?? undefined,
    ids: c.ids ?? [],
  };
}

type LineLike = { qty: number; unitPrice: number; discountPct?: number | null; vatCategory?: string | null; taxRate?: number | null; kind?: string | null };

/** Recomputes every derived amount from the lines and payments. Call before each save. */
export function derive(doc: { lines: LineLike[]; payments?: { amount: number }[]; type: string; status: string }) {
  const inputs = doc.lines.map((l) => ({
    qty: l.qty,
    unitPrice: l.unitPrice,
    discountPct: l.discountPct ?? 0,
    vatCategory: (l.vatCategory ?? 'S') as 'S',
    taxRate: l.taxRate ?? 0,
  }));
  const totals = computeTotals(inputs);
  const paid = (doc.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const isPayable = doc.type === 'invoice' || doc.type === 'deposit_invoice';
  const amountDue = isPayable ? Math.max(totals.totalInclTax - paid, 0) : 0;
  let status = doc.status;
  if (isPayable && ['issued', 'sent', 'paid'].includes(status)) status = paid >= totals.totalInclTax && totals.totalInclTax > 0 ? 'paid' : status === 'paid' ? 'sent' : status;
  return {
    lineNets: totals.lines,
    totals: { totalExclTax: totals.totalExclTax, taxBreakdown: totals.taxBreakdown, totalTax: totals.totalTax, totalInclTax: totals.totalInclTax },
    operationCategory: operationCategory(doc.lines.map((l) => (l.kind === 'goods' ? 'goods' : 'service'))),
    paid,
    amountDue,
    status,
  };
}

/** A document of this user, or null (another user's document is "not found"). */
export async function findOwned(userId: string, id: string) {
  if (!isValidObjectId(id)) return null;
  return Document.findOne({ _id: id, userId });
}

export const isLocked = (d: Pick<DocumentDoc, 'status'>) => d.status !== 'draft';

/** Today at 00:00 UTC in the user's time zone, as a Date (documents store calendar days at UTC midnight). */
export function todayIn(timeZone: string | undefined): Date {
  const iso = new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return new Date(`${iso}T00:00:00Z`);
}

export const isoDay = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

/** Overdue = issued/sent invoice, unpaid, due date before today (in the user's time zone). */
export function isOverdue(d: { type: string; status: string; dueDate?: Date | null; amountDue?: number | null }, today: Date) {
  return (d.type === 'invoice' || d.type === 'deposit_invoice') && ['issued', 'sent'].includes(d.status) && Boolean(d.dueDate) && new Date(d.dueDate!) < today && (d.amountDue ?? 0) > 0;
}
