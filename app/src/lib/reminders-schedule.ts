/**
 * Overdue invoice reminders: days after the due date. Pure, unit-tested.
 * When reminders are switched on for an invoice that is already very late, only the latest
 * applicable reminder is sent (never several at once); earlier ones are skipped for good.
 */
export const REMINDER_STEPS = [1, 7, 15] as const;
export type ReminderStep = (typeof REMINDER_STEPS)[number];

const DAY = 86_400_000;

export function daysOverdue(dueDate: Date, today: Date): number {
  return Math.floor((today.getTime() - dueDate.getTime()) / DAY);
}

/** The reminder to send today, or null. `sent` = steps already sent for this invoice. */
export function nextReminderStep(dueDate: Date | null | undefined, today: Date, sent: number[]): ReminderStep | null {
  if (!dueDate) return null;
  const late = daysOverdue(dueDate, today);
  const reached = REMINDER_STEPS.filter((s) => late >= s);
  if (!reached.length) return null;
  const step = reached[reached.length - 1];
  // Already sent this one or a later one
  if (sent.some((s) => s >= step)) return null;
  return step;
}

/** Date of the next reminder (for display), or null when none is left. */
export function upcomingReminder(dueDate: Date | null | undefined, sent: number[]): Date | null {
  if (!dueDate) return null;
  const last = Math.max(0, ...sent);
  const next = REMINDER_STEPS.find((s) => s > last);
  return next ? new Date(dueDate.getTime() + next * DAY) : null;
}
