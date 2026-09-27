import { sha256 } from '@/lib/crypto';
import { EInvoiceValidationError, renderFacturX } from '@/lib/einvoice/facturx';
import { exportableDoc } from '@/lib/einvoice/load';
import { pdfFileName } from '@/lib/pdf/render';
import { Document } from '@/models/Document';

/** Hybrid Factur-X PDF (PDF/A-3 + CII XML, EN 16931 profile) of an issued invoice or credit note. */
export async function GET(_req: Request, ctx: RouteContext<'/api/documents/[id]/facturx'>) {
  const res = await exportableDoc((await ctx.params).id);
  if ('error' in res) return res.error;
  try {
    const { pdf, xml } = await renderFacturX(res.view);
    await Document.updateOne({ _id: res.doc._id }, { $set: { 'einvoice.format': 'factur-x-en16931', 'einvoice.xmlHash': sha256(xml) } });
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFileName(res.view).replace(/\.pdf$/, '-facturx.pdf')}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    if (e instanceof EInvoiceValidationError) return Response.json({ errors: e.errors }, { status: 422 });
    throw e;
  }
}
