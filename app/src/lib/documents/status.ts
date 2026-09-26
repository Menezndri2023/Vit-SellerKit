/** Status shown to the user, including derived states (overdue, partially paid, expired quote). */
export function displayStatus(d: { type: string; status: string; dueDate?: string | Date | null; validUntil?: string | Date | null; paid?: number | null; amountDue?: number | null }, today: Date) {
  const payable = d.type === 'invoice' || d.type === 'deposit_invoice';
  if (payable && ['issued', 'sent'].includes(d.status)) {
    if (d.dueDate && new Date(d.dueDate) < today && (d.amountDue ?? 0) > 0) return 'overdue';
    if ((d.paid ?? 0) > 0) return 'partially_paid';
  }
  if (d.type === 'quote' && ['issued', 'sent'].includes(d.status) && d.validUntil && new Date(d.validUntil) < today) return 'expired';
  return d.status;
}

export const statusTone: Record<string, string> = {
  draft: 'bg-slate-500/10 text-muted',
  issued: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  sent: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  accepted: 'bg-profit/10 text-profit',
  paid: 'bg-profit/10 text-profit',
  partially_paid: 'bg-warn/10 text-warn',
  overdue: 'bg-loss/10 text-loss',
  declined: 'bg-loss/10 text-loss',
  expired: 'bg-slate-500/10 text-muted',
  cancelled: 'bg-slate-500/10 text-muted line-through',
};
