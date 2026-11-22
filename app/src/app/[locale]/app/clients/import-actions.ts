'use server';

import { refresh } from 'next/cache';
import { clientKey, IMPORT_MAX_BYTES, planClientImport } from '@/lib/clients-import';
import { connectDb } from '@/lib/db';
import { guessCountry } from '@/lib/geo';
import { rateLimit } from '@/lib/rate-limit';
import { actionUser } from '@/lib/session';
import { audit } from '@/models/AuditLog';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Client } from '@/models/Client';

export type ImportState = {
  error?: 'noFile' | 'tooBig' | 'empty' | 'noName' | 'tooMany' | 'rateLimited';
  /** Result of the check, before anything is saved */
  preview?: { total: number; ready: number; duplicates: number; invalid: { line: number; name: string; errors: string[] }[]; ignoredColumns: string[] };
  created?: number;
};

/** Excel on Windows saves "CSV" in Windows-1252: fall back to it when the file isn't valid UTF-8. */
function decode(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/** Step 1 (commit=0): checks the file and shows what will be imported. Step 2 (commit=1): saves. */
export async function importClients(_prev: ImportState, form: FormData): Promise<ImportState> {
  const user = await actionUser();
  const file = form.get('file');
  const commit = form.get('commit') === '1';
  if (!(file instanceof File) || file.size === 0) return { error: 'noFile' };
  if (file.size > IMPORT_MAX_BYTES) return { error: 'tooBig' };
  if (!(await rateLimit(commit ? 'clients-import' : 'clients-import-check', user.id, commit ? 5 : 30, 3600))) return { error: 'rateLimited' };

  await connectDb();
  const profile = await BusinessProfile.findOne({ userId: user.id }).select('address.country').lean();
  const defaultCountry = profile?.address?.country ?? (await guessCountry(String(form.get('locale') ?? 'en')));
  const plan = planClientImport(decode(await file.arrayBuffer()), defaultCountry);
  if (plan.error) return { error: plan.error };

  // Already in the address book, or twice in the file: imported once
  const existing = await Client.find({ userId: user.id }).select('name email').lean();
  const seen = new Set(existing.map(clientKey));
  let duplicates = 0;
  const ready = [];
  for (const row of plan.rows) {
    if (!row.ok) continue;
    const key = clientKey(row.data);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    ready.push(row.data);
  }

  if (!commit) {
    const invalid = plan.rows.flatMap((r) => (r.ok ? [] : [{ line: r.line, name: r.name, errors: r.errors }]));
    return { preview: { total: plan.rows.length, ready: ready.length, duplicates, invalid: invalid.slice(0, 100), ignoredColumns: plan.ignoredColumns } };
  }

  if (ready.length) await Client.insertMany(ready.map((c) => ({ ...c, userId: user.id })));
  await audit({ userId: user.id, actorId: user.id, action: 'clients.import', targetType: 'user', targetId: user.id, details: { created: ready.length, duplicates, invalid: plan.rows.length - ready.length - duplicates } });
  refresh();
  return { created: ready.length };
}
