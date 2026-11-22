import 'server-only';
import { ObjectId } from 'mongodb';
import { redirect } from '@/i18n/navigation';
import { mongoClient } from './db';

/**
 * Version of the terms + transfer-abroad consent (Moroccan law 09-08, art. 44: transfers to the
 * United States need the person's express consent). Bump it when the texts or the list of
 * countries change: everyone is asked again at their next visit.
 */
export const CONSENT_VERSION = '2026-11-22';

export type ConsentRecord = { version: string; termsAcceptedAt: Date; transferAcceptedAt: Date; ip: string; userAgent?: string };

export async function consentOf(userId: string): Promise<ConsentRecord | null> {
  if (!ObjectId.isValid(userId)) return null;
  const u = await mongoClient().db().collection('user').findOne({ _id: new ObjectId(userId) }, { projection: { consent: 1 } });
  return (u?.consent as ConsentRecord | undefined) ?? null;
}

/** Signed-in areas: until the current consent is given, send the user to the consent page. */
export async function requireConsent(userId: string, locale: string, next = '/app'): Promise<void> {
  const c = await consentOf(userId);
  if (c?.version === CONSENT_VERSION) return;
  redirect({ href: { pathname: '/consent', query: { next } }, locale });
}

/** Only in-app paths are accepted after consent (no open redirect). */
export const safeNext = (next: unknown) => (typeof next === 'string' && /^\/(app|activate|admin)(\/[\w/-]*)?$/.test(next) ? next : '/app');
