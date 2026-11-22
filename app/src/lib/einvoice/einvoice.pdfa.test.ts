/**
 * PDF/A-3b conformance of real Factur-X files, checked by veraPDF (the reference validator).
 * Needs Java + veraPDF: `npm run verapdf:setup` once. Skipped automatically when missing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DocView } from '../documents/view-model';
import { renderFacturX } from './facturx';
import { sampleDoc } from './fixtures';

const VERAPDF = process.env.VERAPDF_BIN ?? path.resolve(import.meta.dirname, '../../../.verapdf/verapdf');
const ready = existsSync(VERAPDF);
const work = ready ? mkdtempSync(path.join(tmpdir(), 'mk-verapdf-')) : '';

function verapdf(pdf: Uint8Array, name: string): { compliant: boolean; failures: string[] } {
  const file = path.join(work, `${name}.pdf`);
  writeFileSync(file, pdf);
  let out: string;
  try {
    out = execFileSync(VERAPDF, ['--flavour', '3b', '--format', 'mrr', file], { encoding: 'utf8', maxBuffer: 50e6 });
  } catch (e) {
    out = String((e as { stdout?: string }).stdout ?? ''); // exit code 1 = not compliant
  }
  const compliant = /isCompliant="true"/.test(out);
  const failures = [...out.matchAll(/<rule [^>]*clause="([^"]+)"[^>]*testNumber="(\d+)"[^>]*status="failed"[^>]*>\s*<description>([^<]*)/g)].map((m) => `${m[1]}-${m[2]}: ${m[3].trim()}`);
  return { compliant, failures };
}

const long = 'Accompagnement mensuel : stratégie de contenu, création de visuels, rédaction des légendes, planification et analyse des résultats — « œuvre » à l’échelle, 12 € HT/heure.';
const SCENARIOS: Record<string, DocView> = {
  'fr-eur-qr-sepa': sampleDoc(),
  'en-credit-note': sampleDoc({ lang: 'en', type: 'credit_note', number: 'CN-2026-004', precedingInvoice: { number: 'INV-2026-001', issueDate: '2026-09-26T00:00:00.000Z' } }),
  'multi-page-long-lines': sampleDoc({
    lines: Array.from({ length: 45 }, (_, i) => ({ description: `${i + 1}. ${long}\nDétail : livrable n°${i + 1}`, qty: 1, unitCode: 'HUR', unitPrice: 1200, discountPct: 0, vatCategory: 'S', taxRate: 20, net: 1200 })),
    totals: { totalExclTax: 54000, totalTax: 10800, totalInclTax: 64800, taxBreakdown: [{ category: 'S', rate: 20, base: 54000, amount: 10800 }] },
    amountDue: 64800,
  }),
  'free-plan-watermark-and-links': sampleDoc({ watermark: true, seller: { ...sampleDoc().seller!, footer: 'Atlas Studio SAS — RCS Paris 552 032 534', paymentLinks: [{ label: 'Stripe', url: 'https://buy.stripe.com/test_123' }] } }),
  'arabic-and-other-scripts-in-user-text': sampleDoc({
    buyer: { ...sampleDoc().buyer!, name: 'شركة الأطلس — Atlas' },
    lines: [{ ...sampleDoc().lines[0], description: 'تصميم الهوية البصرية / Identité visuelle ✓ 日本' }],
    totals: { totalExclTax: 180000, totalTax: 36000, totalInclTax: 216000, taxBreakdown: [{ category: 'S', rate: 20, base: 180000, amount: 36000 }] },
    amountDue: 216000,
  }),
};

describe.skipIf(!ready)('Factur-X PDF/A-3b (veraPDF)', () => {
  for (const [name, doc] of Object.entries(SCENARIOS)) {
    it(`${name} is PDF/A-3b compliant`, async () => {
      const { pdf } = await renderFacturX(doc);
      const r = verapdf(pdf, name);
      expect(r.failures.join('\n')).toBe('');
      expect(r.compliant).toBe(true);
    }, 120_000);
  }
});
