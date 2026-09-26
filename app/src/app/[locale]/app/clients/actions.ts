'use server';

import { isValidObjectId } from 'mongoose';
import { refresh } from 'next/cache';
import { redirect } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { fieldErrors, formToObject, type FormState } from '@/lib/forms';
import { actionUser } from '@/lib/session';
import { clientSchema } from '@/lib/validation';
import { Client } from '@/models/Client';

export async function saveClient(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await actionUser();
  const id = String(form.get('id') ?? '');
  const locale = String(form.get('locale') ?? 'en');
  const parsed = clientSchema.safeParse(formToObject(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await connectDb();
  if (id) {
    if (!isValidObjectId(id)) return { errors: { _form: 'notFound' } };
    // userId in the filter: a user can only ever update their own clients
    const res = await Client.updateOne({ _id: id, userId: user.id }, { $set: parsed.data, ...(parsed.data.deliveryAddress ? {} : { $unset: { deliveryAddress: 1 } }) }, { runValidators: true });
    if (res.matchedCount === 0) return { errors: { _form: 'notFound' } };
  } else {
    await Client.create({ ...parsed.data, userId: user.id });
  }
  redirect({ href: '/app/clients', locale });
  return { ok: true };
}

export async function deleteClient(id: string, locale: string): Promise<void> {
  const user = await actionUser();
  if (!isValidObjectId(id)) return;
  await connectDb();
  await Client.deleteOne({ _id: id, userId: user.id });
  refresh();
  redirect({ href: '/app/clients', locale });
}
