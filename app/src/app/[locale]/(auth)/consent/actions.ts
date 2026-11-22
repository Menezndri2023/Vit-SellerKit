'use server';

import { ObjectId } from 'mongodb';
import { headers } from 'next/headers';
import { redirect } from '@/i18n/navigation';
import { CONSENT_VERSION, safeNext } from '@/lib/consent';
import { connectDb, mongoClient } from '@/lib/db';
import { clientIp } from '@/lib/rate-limit';
import { actionUser } from '@/lib/session';
import { audit } from '@/models/AuditLog';

export type ConsentState = { error?: 'required' };

/** Records both agreements with their proof (text version, date, IP, browser). */
export async function giveConsent(_prev: ConsentState, form: FormData): Promise<ConsentState> {
  const user = await actionUser();
  const locale = String(form.get('locale') ?? 'en');
  if (form.get('terms') !== 'on' || form.get('transfer') !== 'on') return { error: 'required' };
  await connectDb();
  const now = new Date();
  const record = { version: CONSENT_VERSION, termsAcceptedAt: now, transferAcceptedAt: now, ip: await clientIp(), userAgent: (await headers()).get('user-agent')?.slice(0, 300) ?? undefined };
  await mongoClient().db().collection('user').updateOne({ _id: new ObjectId(user.id) }, { $set: { consent: record } });
  await audit({ userId: user.id, actorId: user.id, action: 'consent.give', targetType: 'user', targetId: user.id, details: { version: CONSENT_VERSION } });
  redirect({ href: safeNext(form.get('next')), locale });
  return {};
}
