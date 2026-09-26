import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from '@/i18n/navigation';
import { getAuth } from './auth';

export const getSession = cache(async () => getAuth().api.getSession({ headers: await headers() }));

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>['user'];

/** Signed-in user or redirect to the login page. Use in every protected page and action. */
export async function requireUser(locale: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect({ href: '/login', locale });
  return session!.user;
}

/** Admin only — checked on the server, never just hidden in the UI. */
export async function requireAdmin(locale: string): Promise<SessionUser> {
  const user = await requireUser(locale);
  if (user.role !== 'admin') redirect({ href: '/app', locale });
  return user;
}

/** For Server Actions and route handlers: the signed-in user, or throws (never trust the client). */
export async function actionUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session.user;
}

/** For admin Server Actions: throws unless the signed-in user is an admin. */
export async function actionAdmin(): Promise<SessionUser> {
  const user = await actionUser();
  if (user.role !== 'admin') throw new Error('FORBIDDEN');
  return user;
}
