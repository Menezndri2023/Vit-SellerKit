'use server';

import { isValidObjectId } from 'mongoose';
import { refresh } from 'next/cache';
import { redirect } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { fieldErrors, formToObject, type FormState } from '@/lib/forms';
import { actionUser } from '@/lib/session';
import { productSchema } from '@/lib/validation';
import { Product } from '@/models/Product';

export async function saveProduct(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await actionUser();
  const id = String(form.get('id') ?? '');
  const locale = String(form.get('locale') ?? 'en');
  const parsed = productSchema.safeParse(formToObject(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await connectDb();
  if (id) {
    if (!isValidObjectId(id)) return { errors: { _form: 'notFound' } };
    const res = await Product.updateOne({ _id: id, userId: user.id }, { $set: parsed.data }, { runValidators: true });
    if (res.matchedCount === 0) return { errors: { _form: 'notFound' } };
  } else {
    await Product.create({ ...parsed.data, userId: user.id });
  }
  redirect({ href: '/app/products', locale });
  return { ok: true };
}

export async function deleteProduct(id: string, locale: string): Promise<void> {
  const user = await actionUser();
  if (!isValidObjectId(id)) return;
  await connectDb();
  await Product.deleteOne({ _id: id, userId: user.id });
  refresh();
  redirect({ href: '/app/products', locale });
}
