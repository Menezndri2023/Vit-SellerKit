import 'server-only';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Client } from '@/models/Client';
import type { DocumentDoc } from '@/models/Document';
import { buildDocView } from './view-model';

/** Document view with live profile/client for drafts (issued documents use their frozen snapshots). */
export async function loadDocView(doc: DocumentDoc & { _id: unknown }) {
  const isDraft = doc.status === 'draft';
  const [profile, client] = await Promise.all([
    isDraft ? BusinessProfile.findOne({ userId: doc.userId }).lean() : null,
    isDraft && doc.clientId ? Client.findOne({ _id: doc.clientId, userId: doc.userId }).lean() : null,
  ]);
  return buildDocView(doc, profile, client);
}
