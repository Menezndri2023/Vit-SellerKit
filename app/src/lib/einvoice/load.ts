import 'server-only';
import { connectDb } from '../db';
import { loadDocView } from '../documents/load';
import { findOwned } from '../documents/service';
import { getSession } from '../session';

const EXPORTABLE = ['invoice', 'credit_note', 'deposit_invoice'];

/** Issued invoice-like document of the signed-in user, ready for e-invoice export. */
export async function exportableDoc(id: string) {
  const session = await getSession();
  if (!session) return { error: new Response('Unauthorized', { status: 401 }) } as const;
  await connectDb();
  const doc = await findOwned(session.user.id, id);
  if (!doc) return { error: new Response('Not found', { status: 404 }) } as const;
  if (doc.status === 'draft' || !EXPORTABLE.includes(doc.type)) return { error: Response.json({ errors: ['notExportable'] }, { status: 422 }) } as const;
  return { doc, view: await loadDocView(doc.toObject()) } as const;
}
