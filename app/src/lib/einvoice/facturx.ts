import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { embedFacturX, Flavor, Profile, validateInput } from '@stackforge-eu/factur-x';
import type { DocView } from '../documents/view-model';
import { renderDocumentPdf } from '../pdf/render';
import { buildFacturXInput } from './facturx-input';

let icc: Buffer | undefined;
const iccProfile = async () => (icc ??= await readFile(path.join(process.cwd(), 'assets', 'icc', 'sRGB-v2-micro.icc')));

export class EInvoiceValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`E-invoice validation failed: ${errors.join('; ')}`);
  }
}

/**
 * Hybrid Factur-X invoice: our PDF + CII XML (EN 16931 profile), PDF/A-3 metadata and sRGB output intent.
 * Input and XSD validation must pass, otherwise nothing is produced.
 */
export async function renderFacturX(doc: DocView): Promise<{ pdf: Uint8Array; xml: string }> {
  const input = buildFacturXInput(doc);
  // Validate first: the library throws on invalid input, we want readable errors for the user
  const check = validateInput(input, Profile.EN16931);
  if (!check.valid) throw new EInvoiceValidationError(check.errors.map((e) => `${e.field}: ${e.message}`));
  const pdf = await renderDocumentPdf(doc);
  const result = await embedFacturX({
    pdf,
    input,
    profile: Profile.EN16931,
    flavor: Flavor.FACTUR_X,
    validateBeforeEmbed: true,
    validateXsd: true,
    rgbIccProfile: await iccProfile(),
    meta: { author: doc.seller?.legalName, title: doc.number, creator: 'Margokit' },
  });
  const errors = [...(result.validation?.errors ?? []).map((e) => `${e.field}: ${e.message}`), ...(result.xsdValidation?.errors ?? []).map((e) => e.message)];
  if (errors.length) throw new EInvoiceValidationError(errors);
  return { pdf: result.pdf, xml: result.xml };
}
