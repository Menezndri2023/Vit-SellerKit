import { buildFacturXInput } from '@/lib/einvoice/facturx-input';
import { exportableDoc } from '@/lib/einvoice/load';
import { buildUbl } from '@/lib/einvoice/ubl';
import { currencyDigits } from '@/lib/money';
import { pdfFileName } from '@/lib/pdf/render';

/** UBL 2.1 XML (Peppol BIS Billing 3.0) of an issued invoice or credit note. */
export async function GET(_req: Request, ctx: RouteContext<'/api/documents/[id]/ubl'>) {
  const res = await exportableDoc((await ctx.params).id);
  if ('error' in res) return res.error;
  const xml = buildUbl(buildFacturXInput(res.view), currencyDigits(res.view.currency));
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${pdfFileName(res.view).replace(/\.pdf$/, '-ubl.xml')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
