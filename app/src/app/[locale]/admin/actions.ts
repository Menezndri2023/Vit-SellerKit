'use server';

import { ObjectId } from 'mongodb';
import { refresh } from 'next/cache';
import { z } from 'zod';
import { generateCode } from '@/lib/billing/codes';
import { hmac } from '@/lib/crypto';
import { connectDb, mongoClient } from '@/lib/db';
import { actionAdmin } from '@/lib/session';
import { ActivationCode } from '@/models/ActivationCode';
import { audit } from '@/models/AuditLog';
import { Subscription } from '@/models/Subscription';

const DAY = 86_400_000;

async function userExists(userId: string) {
  if (!ObjectId.isValid(userId)) return false;
  return Boolean(await mongoClient().db().collection('user').findOne({ _id: new ObjectId(userId) }, { projection: { _id: 1 } }));
}

/** Grants or extends manual Pro access (e.g. a WhatsApp sale paid by transfer). */
export async function grantPro(userId: string, days: number | null) {
  const admin = await actionAdmin();
  if (days !== null && ![30, 365].includes(days)) return;
  await connectDb();
  if (!(await userExists(userId))) return;
  const now = new Date();
  const current = await Subscription.findOne({ userId, provider: 'manual', status: { $in: ['active', 'cancelled'] } }).sort({ expiresAt: -1 });
  if (current && !current.expiresAt) return; // already lifetime
  const from = current?.expiresAt && current.expiresAt > now ? current.expiresAt : now;
  const expiresAt = days === null ? null : new Date(from.getTime() + days * DAY);
  if (current) {
    current.expiresAt = expiresAt;
    current.status = 'active';
    current.remindersSent = [];
    await current.save();
  } else {
    await Subscription.create({ userId, plan: 'manual', provider: 'manual', status: 'active', expiresAt });
  }
  await audit({ userId, actorId: admin.id, action: 'admin.grant', targetType: 'user', targetId: userId, details: { days } });
  refresh();
}

export async function revokePro(userId: string) {
  const admin = await actionAdmin();
  await connectDb();
  await Subscription.updateMany({ userId, status: { $in: ['active', 'cancelled'] } }, { $set: { status: 'revoked' } });
  await audit({ userId, actorId: admin.id, action: 'admin.revoke', targetType: 'user', targetId: userId });
  refresh();
}

const codesSchema = z.object({
  count: z.coerce.number().int().min(1).max(100),
  duration: z.enum(['30', '365', 'lifetime']),
  note: z.string().trim().max(200).optional(),
});

export type CodesState = { codes?: string[]; error?: string };

export async function createCodes(_prev: CodesState, form: FormData): Promise<CodesState> {
  const admin = await actionAdmin();
  const parsed = codesSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'invalid' };
  await connectDb();
  const batch = `admin-${new Date().toISOString().slice(0, 16)}`;
  const durationDays = parsed.data.duration === 'lifetime' ? null : Number(parsed.data.duration);
  const codes = Array.from({ length: parsed.data.count }, generateCode);
  await ActivationCode.insertMany(codes.map((c) => ({ codeHash: hmac(c), hint: c.slice(-4), batch, durationDays, note: parsed.data.note || undefined, createdBy: admin.id })));
  await audit({ userId: admin.id, actorId: admin.id, action: 'admin.codes.create', targetType: 'batch', targetId: batch, details: { count: codes.length, durationDays } });
  refresh();
  // Shown once: only hashes are stored
  return { codes };
}

export async function revokeCode(id: string) {
  const admin = await actionAdmin();
  if (!ObjectId.isValid(id)) return;
  await connectDb();
  await ActivationCode.updateOne({ _id: id, usedBy: { $exists: false } }, { $set: { revokedAt: new Date() } });
  await audit({ userId: admin.id, actorId: admin.id, action: 'admin.codes.revoke', targetType: 'code', targetId: id });
  refresh();
}
