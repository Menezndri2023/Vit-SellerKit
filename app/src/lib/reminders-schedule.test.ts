import { describe, expect, it } from 'vitest';
import { daysOverdue, nextReminderStep, upcomingReminder } from './reminders-schedule';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('overdue reminder schedule', () => {
  it('sends at 1, 7 and 15 days late, once each', () => {
    const due = d('2026-11-01');
    expect(nextReminderStep(due, d('2026-11-01'), [])).toBeNull(); // due today: not late
    expect(nextReminderStep(due, d('2026-11-02'), [])).toBe(1);
    expect(nextReminderStep(due, d('2026-11-05'), [1])).toBeNull();
    expect(nextReminderStep(due, d('2026-11-08'), [1])).toBe(7);
    expect(nextReminderStep(due, d('2026-11-16'), [1, 7])).toBe(15);
    expect(nextReminderStep(due, d('2026-12-30'), [1, 7, 15])).toBeNull();
  });
  it('a very late invoice gets only the latest reminder, never several at once', () => {
    expect(nextReminderStep(d('2026-09-01'), d('2026-11-22'), [])).toBe(15);
    expect(nextReminderStep(d('2026-11-10'), d('2026-11-22'), [])).toBe(7);
    expect(nextReminderStep(d('2026-11-10'), d('2026-11-22'), [7])).toBeNull();
  });
  it('no due date, no reminder; upcoming date for display', () => {
    expect(nextReminderStep(null, d('2026-11-22'), [])).toBeNull();
    expect(daysOverdue(d('2026-11-20'), d('2026-11-22'))).toBe(2);
    expect(upcomingReminder(d('2026-11-01'), [])?.toISOString().slice(0, 10)).toBe('2026-11-02');
    expect(upcomingReminder(d('2026-11-01'), [1])?.toISOString().slice(0, 10)).toBe('2026-11-08');
    expect(upcomingReminder(d('2026-11-01'), [1, 7, 15])).toBeNull();
  });
});
