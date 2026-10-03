import 'server-only';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { createElement } from 'react';
import { BusinessProfile } from '@/models/BusinessProfile';
import { epcPayload } from '../documents/epc-qr';
import type { DocView } from '../documents/view-model';
import { DocumentPdf, type PdfExtras } from './DocumentPdf';
import { pdfSafe, pdfTextCleaner } from './fonts';

async function loadLogo(key: string | undefined): Promise<PdfExtras['logo']> {
  if (!key) return undefined;
  const p = await BusinessProfile.findOne({ 'logo.key': key }).select('+logo.data logo.mime').lean();
  const raw = p?.logo?.data as unknown as { buffer?: Uint8Array } | Uint8Array | undefined;
  if (!raw || !p?.logo?.mime) return undefined;
  const data = Buffer.from(raw instanceof Uint8Array ? raw : (raw.buffer ?? []));
  return { data, format: p.logo.mime === 'image/png' ? 'png' : 'jpg' };
}

/** SEPA transfer QR code: EUR invoices with an IBAN and an amount due. */
async function epcQr(doc: DocView): Promise<string | null> {
  const iban = doc.seller?.bankAccount?.iban;
  if (!iban || doc.currency !== 'EUR' || doc.isDraft || !(doc.type === 'invoice' || doc.type === 'deposit_invoice') || doc.amountDue <= 0) return null;
  const payload = epcPayload({ name: doc.seller!.bankAccount!.holder || doc.seller!.legalName, iban, bic: doc.seller?.bankAccount?.bic, amountMinor: doc.amountDue, reference: doc.number ?? '' });
  return payload ? QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 0, width: 320 }) : null;
}

export async function renderDocumentPdf(doc: DocView): Promise<Buffer> {
  const [logo, qr, clean] = await Promise.all([loadLogo(doc.seller?.logoKey), epcQr(doc), pdfTextCleaner()]);
  // User text may hold Arabic or other scripts: only characters the embedded fonts can draw get through
  return renderToBuffer(createElement(DocumentPdf, { doc: pdfSafe(doc, clean), extras: { logo, epcQr: qr } }) as Parameters<typeof renderToBuffer>[0]);
}

export function pdfFileName(doc: DocView): string {
  const base = doc.number ?? `draft-${doc.id.slice(-6)}`;
  return `${base.replace(/[^A-Za-z0-9._-]/g, '_')}.pdf`;
}
