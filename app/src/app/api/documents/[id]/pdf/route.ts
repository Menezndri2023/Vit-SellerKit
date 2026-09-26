import { connectDb } from '@/lib/db';
import { loadDocView } from '@/lib/documents/load';
import { findOwned } from '@/lib/documents/service';
import { pdfFileName, renderDocumentPdf } from '@/lib/pdf/render';
import { getSession } from '@/lib/session';

/** PDF of one of the signed-in user's documents (drafts included, with a DRAFT watermark). */
export async function GET(req: Request, ctx: RouteContext<'/api/documents/[id]/pdf'>) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const { id } = await ctx.params;
  await connectDb();
  const doc = await findOwned(session.user.id, id);
  if (!doc) return new Response('Not found', { status: 404 });
  const view = await loadDocView(doc.toObject());
  const pdf = await renderDocumentPdf(view);
  const download = new URL(req.url).searchParams.has('download');
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${pdfFileName(view)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
