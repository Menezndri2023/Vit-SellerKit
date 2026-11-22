'use server';

import { refresh } from 'next/cache';
import { connectDb } from '@/lib/db';
import { hasActivePro } from '@/lib/plan';
import { actionUser } from '@/lib/session';
import { audit } from '@/models/AuditLog';
import { BusinessProfile } from '@/models/BusinessProfile';

export type ReminderSettingState = { error?: 'pro' | 'profile' | 'email'; ok?: boolean };

/** Turns automatic overdue reminders on/off for the whole account (Pro only to turn on). */
export async function setAutoReminders(enabled: boolean): Promise<ReminderSettingState> {
  const user = await actionUser();
  await connectDb();
  const profile = await BusinessProfile.findOne({ userId: user.id }).select('email').lean();
  if (enabled) {
    if (!(await hasActivePro(user.id))) return { error: 'pro' };
    if (!profile) return { error: 'profile' };
    // Clients reply to the seller: an email address is required
    if (!profile.email) return { error: 'email' };
  }
  await BusinessProfile.updateOne({ userId: user.id }, { $set: { 'reminders.enabled': Boolean(enabled) } });
  await audit({ userId: user.id, actorId: user.id, action: enabled ? 'reminders.enable' : 'reminders.disable', targetType: 'user', targetId: user.id });
  refresh();
  return { ok: true };
}
