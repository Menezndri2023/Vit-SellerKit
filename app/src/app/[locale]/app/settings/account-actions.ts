'use server';

import { ObjectId } from 'mongodb';
import { redirect } from '@/i18n/navigation';
import { connectDb, mongoClient } from '@/lib/db';
import { actionUser } from '@/lib/session';
import { AuditLog } from '@/models/AuditLog';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Client } from '@/models/Client';
import { Document } from '@/models/Document';
import { Product } from '@/models/Product';
import { Subscription } from '@/models/Subscription';

export type DeleteState = { error?: string };

/**
 * Deletes the account and all its data (GDPR right to erasure). The user must type their email.
 * Invoices must be kept by the user (10 years in France): the UI asks them to export first.
 */
export async function deleteAccount(_prev: DeleteState, form: FormData): Promise<DeleteState> {
  const user = await actionUser();
  const locale = String(form.get('locale') ?? 'en');
  if (String(form.get('confirm') ?? '').trim().toLowerCase() !== user.email.toLowerCase()) return { error: 'confirm' };

  await connectDb();
  const userId = user.id;
  await Promise.all([
    BusinessProfile.deleteMany({ userId }),
    Client.deleteMany({ userId }),
    Product.deleteMany({ userId }),
    Document.deleteMany({ userId }),
    Subscription.deleteMany({ userId }),
    AuditLog.deleteMany({ userId }),
  ]);
  const db = mongoClient().db();
  const oid = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
  // Better Auth collections (sessions and linked accounts reference the user id)
  await Promise.all([
    db.collection('session').deleteMany({ userId: { $in: [userId, oid].filter(Boolean) } }),
    db.collection('account').deleteMany({ userId: { $in: [userId, oid].filter(Boolean) } }),
    db.collection('verification').deleteMany({ identifier: user.email }),
  ]);
  if (oid) await db.collection('user').deleteOne({ _id: oid });
  redirect({ href: '/', locale });
  return {};
}
