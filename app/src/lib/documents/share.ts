import 'server-only';
import { decrypt, encrypt, randomToken, sha256 } from '../crypto';
import { siteUrl } from '../site-url';
import { Document } from '@/models/Document';

export const publicUrl = async (token: string, locale: string) => `${await siteUrl()}/${locale}/d/${token}`;

/** The document's public link (created on first use). Only issued documents can be shared. */
export async function getOrCreateShareToken(userId: string, id: string, regenerate = false): Promise<string | null> {
  const doc = await Document.findOne({ _id: id, userId }).select('+publicTokenEnc status');
  if (!doc || doc.status === 'draft') return null;
  if (doc.publicTokenEnc && !regenerate) return decrypt(doc.publicTokenEnc);
  const token = randomToken(32);
  doc.publicTokenHash = sha256(token);
  doc.publicTokenEnc = encrypt(token);
  await doc.save();
  return token;
}

/** Looks up a shared document by token (never drafts). */
export function findByShareToken(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return Document.findOne({ publicTokenHash: sha256(token), status: { $ne: 'draft' } }).lean();
}
