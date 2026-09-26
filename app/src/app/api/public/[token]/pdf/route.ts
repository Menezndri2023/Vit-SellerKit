import { connectDb } from '@/lib/db';
import { loadDocView } from '@/lib/documents/load';
import { findByShareToken } from '@/lib/documents/share';
import { pdfFileName, renderDocumentPdf } from '@/lib/pdf/render';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/** PDF of a shared document, for the user's client (no account). */
export async function GET(_req: Request, ctx: RouteContext<'/api/public/[token]/pdf'>) {
  if (!(await rateLimit('public-pdf', await clientIp(), 30, 60))) return new Response('Too many requests', { status: 429 });
  const { token } = await ctx.params;
  await connectDb();
  const doc = await findByShareToken(token);
  if (!doc) return new Response('Not found', { status: 404 });
  const view = await loadDocView(doc);
  const pdf = await renderDocumentPdf(view);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFileName(view)}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
