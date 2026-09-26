'use server';

import { randomUUID } from 'node:crypto';
import { refresh } from 'next/cache';
import { connectDb } from '@/lib/db';
import { fieldErrors, formToObject, type FormState } from '@/lib/forms';
import { MAX_LOGO_BYTES, sniffImage } from '@/lib/logo';
import { actionUser } from '@/lib/session';
import { profileSchema } from '@/lib/validation';
import { BusinessProfile } from '@/models/BusinessProfile';

export async function saveProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await actionUser();
  const parsed = profileSchema.safeParse(formToObject(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await connectDb();
  await BusinessProfile.updateOne({ userId: user.id }, { $set: { ...parsed.data, userId: user.id } }, { upsert: true, runValidators: true });
  refresh();
  return { ok: true, savedAt: Date.now() };
}

export async function uploadLogo(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await actionUser();
  const file = form.get('logo');
  if (!(file instanceof File) || file.size === 0) return { errors: { logo: 'required' } };
  if (file.size > MAX_LOGO_BYTES) return { errors: { logo: 'fileTooLarge' } };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImage(bytes);
  if (!mime) return { errors: { logo: 'fileType' } };

  await connectDb();
  const res = await BusinessProfile.updateOne(
    { userId: user.id },
    // A new key on every upload: the logo URL is cached forever, so a new file needs a new URL
    { $set: { logo: { key: randomUUID(), mime, size: bytes.length, data: Buffer.from(bytes) } } },
  );
  if (res.matchedCount === 0) return { errors: { logo: 'profileFirst' } };
  refresh();
  return { ok: true, savedAt: Date.now() };
}

export async function deleteLogo(): Promise<void> {
  const user = await actionUser();
  await connectDb();
  await BusinessProfile.updateOne({ userId: user.id }, { $unset: { logo: 1 } });
  refresh();
}
