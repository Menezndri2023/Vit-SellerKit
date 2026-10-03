import { writeFileSync } from 'node:fs';
import { renderToBuffer } from '@react-pdf/renderer';
import { PDFArray, PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { DocView } from '../documents/view-model';
import { DocumentPdf } from './DocumentPdf';
import { pdfSafe, pdfTextCleaner } from './fonts';

/** BaseFont names used by the pages (Type0 descendants included). */
async function pageFonts(bytes: Buffer): Promise<string[]> {
  const pdf = await PDFDocument.load(bytes);
  const names = new Set<string>();
  const visit = (font: PDFDict) => {
    const desc = font.lookup(PDFName.of('DescendantFonts'));
    if (desc instanceof PDFArray) for (let i = 0; i < desc.size(); i++) visit(desc.lookup(i, PDFDict));
    else names.add(String(font.lookup(PDFName.of('BaseFont'))));
  };
  for (const p of pdf.getPages()) {
    const fonts = p.node.Resources()?.lookup(PDFName.of('Font'));
    if (fonts instanceof PDFDict) for (const [, ref] of fonts.entries()) visit(pdf.context.lookup(ref) as PDFDict);
  }
  return [...names];
}

const view = (over: Partial<DocView>): DocView => ({
  id: '0123456789abcdef01234567',
  type: 'invoice',
  status: 'issued',
  number: 'INV-2026-001',
  lang: 'fr',
  currency: 'MAD',
  issueDate: '2026-10-03T00:00:00.000Z',
  dueDate: '2026-11-02T00:00:00.000Z',
  lines: [{ description: 'Conseil', qty: 3, unitCode: 'C62', unitPrice: 45000, discountPct: 0, vatCategory: 'S', taxRate: 20, net: 135000 }],
  totals: { totalExclTax: 135000, totalTax: 27000, totalInclTax: 162000, taxBreakdown: [{ category: 'S', rate: 20, base: 135000, amount: 27000 }] },
  paid: 0,
  amountDue: 162000,
  seller: { legalName: 'Atelier Nour SARL', ids: [], vatRegime: 'standard', vatOnDebits: false, address: { line1: '12 rue Exemple', city: 'Casablanca', country: 'MA' } } as unknown as DocView['seller'],
  buyer: { kind: 'business', name: 'Client SAS', ids: [], address: { line1: '1 rue de Paris', postalCode: '75001', city: 'Paris', country: 'FR' } } as unknown as DocView['buyer'],
  sellerIds: [],
  buyerIds: [],
  mentions: [],
  watermark: false,
  isDraft: false,
  operationCategory: 'services',
  ...over,
});

async function render(doc: DocView) {
  const clean = await pdfTextCleaner();
  return renderToBuffer(createElement(DocumentPdf, { doc: pdfSafe(doc, clean), extras: {} }) as Parameters<typeof renderToBuffer>[0]);
}

describe('PDF text', () => {
  it('keeps printable text, drops or replaces what no embedded font can draw', async () => {
    const clean = await pdfTextCleaner();
    expect(clean('Atelier Nour — مشغل نور')).toBe('Atelier Nour — مشغل نور');
    expect(clean('Łukasz Żółć, Şahin, Nguyễn, Ελλάδα, Москва')).toBe('Łukasz Żółć, Şahin, Nguyễn, Ελλάδα, Москва');
    expect(clean('1 234,00')).toBe('1 234,00');
    expect(clean('a\r\nb')).toBe('a b');
    expect(clean('a\r\nb', true)).toBe('a\nb');
    expect(clean('東京 🙂')).toBe('?? ?');
    expect(clean('é')).toBe('é');
  });

  it('embeds every font for Arabic, other scripts and multi-line text (PDF/A-3)', async () => {
    const pdf = await render(
      view({
        buyer: { kind: 'business', name: 'شركة الأطلس للتجارة', contactName: 'Łukasz Żółć', ids: [], address: { line1: '12 شارع محمد الخامس', city: 'الدار البيضاء', country: 'MA' } } as unknown as DocView['buyer'],
        seller: { legalName: 'Atelier Nour — مشغل نور', footer: 'Merci !\nشكرا لكم', ids: [], vatRegime: 'standard', vatOnDebits: false, address: { line1: '12 rue Exemple', city: 'Casablanca', country: 'MA' } } as unknown as DocView['seller'],
        lines: [{ description: 'تصميم شعار — logo design\nDeuxième ligne 東京 🙂', qty: 1, unitCode: 'C62', unitPrice: 135000, discountPct: 0, vatCategory: 'S', taxRate: 20, net: 135000 }],
        notes: 'Paiement à réception.\nالدفع عند الاستلام.\tMerci.',
        mentions: ['Mention légale\nسطر ثاني'],
      }),
    );
    if (process.env.PDF_SAMPLE) writeFileSync(process.env.PDF_SAMPLE, pdf);
    const fonts = await pageFonts(pdf);
    expect(fonts.filter((f) => !/^\/[A-Z]{6}\+/.test(f))).toEqual([]);
    expect(fonts.some((f) => f.includes('IBMPlexSansArabic'))).toBe(true);
    expect(fonts.some((f) => f.includes('Inter'))).toBe(true);
  });

  it('keeps Latin-only documents on Inter alone', async () => {
    const fonts = await pageFonts(await render(view({ notes: 'Ligne 1\nLigne 2' })));
    expect(fonts.every((f) => /^\/[A-Z]{6}\+Inter-/.test(f))).toBe(true);
  });
});
