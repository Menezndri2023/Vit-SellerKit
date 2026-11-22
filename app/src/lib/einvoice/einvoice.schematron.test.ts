/**
 * Official business-rule validation (Schematron) of the Factur-X CII and UBL exports:
 * CEN EN 16931 validation artefacts (CII + UBL) and, when present, Peppol BIS Billing 3.0.
 * Needs Java and the artefacts: run `npm run schematron:setup` once, then `npm test`.
 * Skipped automatically when they are missing (CI without Java).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildXml, Flavor, Profile } from '@stackforge-eu/factur-x';
import { describe, expect, it } from 'vitest';
import type { DocView } from '../documents/view-model';
import { sampleDoc } from './fixtures';
import { buildFacturXInput } from './facturx-input';
import { einvoiceRuleErrors } from './rules';
import { buildUbl } from './ubl';

const PEPPOL_ID = 'urn:fdc:peppol.eu:2017:poacc:billing:3.0';

const DIR = path.resolve(import.meta.dirname, '../../../.schematron');
const SAXON = path.join(DIR, 'saxon.jar');
const RULES = {
  cii: path.join(DIR, 'cii/xslt/EN16931-CII-validation.xslt'),
  ubl: path.join(DIR, 'ubl/xslt/EN16931-UBL-validation.xslt'),
  peppol: path.join(DIR, 'peppol/PEPPOL-EN16931-UBL.xslt'),
};
const javaOk = (() => {
  try {
    execFileSync('java', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();
const ready = javaOk && existsSync(SAXON) && existsSync(RULES.cii) && existsSync(RULES.ubl);
const work = ready ? mkdtempSync(path.join(tmpdir(), 'mk-schematron-')) : '';

/** Runs one compiled Schematron; returns the failed assertions flagged as errors (warnings ignored). */
function schematron(rules: string, xml: string, name: string): string[] {
  const input = path.join(work, `${name}.xml`);
  writeFileSync(input, xml);
  const svrl = execFileSync('java', ['-jar', SAXON, `-s:${input}`, `-xsl:${rules}`], { encoding: 'utf8', maxBuffer: 20e6 });
  const errors: string[] = [];
  for (const m of svrl.matchAll(/<svrl:failed-assert\b([^>]*)>([\s\S]*?)<\/svrl:failed-assert>/g)) {
    const attrs = m[1];
    if (/flag="warning"/.test(attrs)) continue;
    const id = /id="([^"]+)"/.exec(attrs)?.[1] ?? '?';
    const text = /<svrl:text>([\s\S]*?)<\/svrl:text>/.exec(m[2])?.[1].replace(/\s+/g, ' ').trim();
    errors.push(`${id}: ${text}`);
  }
  return errors;
}

const base = sampleDoc();
const iso = (d: string) => `${d}T00:00:00.000Z`;
const one = (patch: Partial<DocView['lines'][number]>, totals: DocView['totals'], extra: Partial<DocView> = {}): DocView =>
  sampleDoc({ lines: [{ ...base.lines[0], ...patch }], totals, amountDue: totals.totalInclTax, ...extra });

/** Representative documents: what users actually issue. */
const SCENARIOS: Record<string, DocView> = {
  'fr-b2b-two-rates-discount': sampleDoc({
    lines: [
      { description: 'Identité visuelle', qty: 1, unitCode: 'C62', unitPrice: 180000, discountPct: 0, vatCategory: 'S', taxRate: 20, net: 180000 },
      { description: 'Séance photo', qty: 0.5, unitCode: 'DAY', unitPrice: 65000, discountPct: 10, vatCategory: 'S', taxRate: 20, net: 29250 },
      { description: 'Livre', qty: 3, unitCode: 'C62', unitPrice: 1999, discountPct: 0, vatCategory: 'S', taxRate: 5.5, net: 5997 },
    ],
    totals: { totalExclTax: 215247, totalTax: 42180, totalInclTax: 257427, taxBreakdown: [{ category: 'S', rate: 20, base: 209250, amount: 41850 }, { category: 'S', rate: 5.5, base: 5997, amount: 330 }] },
    amountDue: 257427,
  }),
  'fr-franchise-293B': one(
    { description: 'Conseil', qty: 2, unitCode: 'HUR', unitPrice: 5000, vatCategory: 'O', taxRate: 0, net: 10000 },
    { totalExclTax: 10000, totalTax: 0, totalInclTax: 10000, taxBreakdown: [{ category: 'O', rate: 0, base: 10000, amount: 0 }] },
    { seller: { ...base.seller!, vatRegime: 'franchise' }, mentions: ['TVA non applicable, art. 293 B du CGI'] },
  ),
  'eu-reverse-charge': one(
    { description: 'Design', unitPrice: 100000, vatCategory: 'AE', taxRate: 0, net: 100000 },
    { totalExclTax: 100000, totalTax: 0, totalInclTax: 100000, taxBreakdown: [{ category: 'AE', rate: 0, base: 100000, amount: 0 }] },
    { buyer: { kind: 'business', name: 'Berlin GmbH', address: { line1: 'Str. 1', postalCode: '10115', city: 'Berlin', country: 'DE' }, ids: [{ scheme: 'VAT', value: 'DE123456789' }] } },
  ),
  'intra-eu-goods': one(
    { description: 'Lampes', qty: 10, unitPrice: 4500, vatCategory: 'K', taxRate: 0, net: 45000 },
    { totalExclTax: 45000, totalTax: 0, totalInclTax: 45000, taxBreakdown: [{ category: 'K', rate: 0, base: 45000, amount: 0 }] },
    { buyer: { kind: 'business', name: 'Madrid SL', address: { line1: 'Calle 1', postalCode: '28001', city: 'Madrid', country: 'ES' }, ids: [{ scheme: 'VAT', value: 'ESB12345674' }] }, operationCategory: 'goods' },
  ),
  'export-outside-eu': one(
    { description: 'Site web', unitPrice: 250000, vatCategory: 'G', taxRate: 0, net: 250000 },
    { totalExclTax: 250000, totalTax: 0, totalInclTax: 250000, taxBreakdown: [{ category: 'G', rate: 0, base: 250000, amount: 0 }] },
    { buyer: { kind: 'business', name: 'Atlas Maroc SARL', address: { line1: 'Bd Zerktouni', postalCode: '20000', city: 'Casablanca', country: 'MA' }, ids: [] } },
  ),
  'out-of-scope-O': one(
    { description: 'Débours', unitPrice: 3000, vatCategory: 'O', taxRate: 0, net: 3000 },
    { totalExclTax: 3000, totalTax: 0, totalInclTax: 3000, taxBreakdown: [{ category: 'O', rate: 0, base: 3000, amount: 0 }] },
  ),
  'credit-note': sampleDoc({ type: 'credit_note', number: 'CN-2026-001', precedingInvoice: { number: 'INV-2026-001', issueDate: iso('2026-09-26') } }),
  'deposit-invoice': sampleDoc({ type: 'deposit_invoice', number: 'INV-2026-002' }),
  'partially-paid': sampleDoc({ paid: 100000, amountDue: 151100 }),
};

/** Data the official rules reject: our pre-export check must stop them with a readable message. */
const REJECTED: Record<string, DocView> = {
  'standard-seller-without-vat': sampleDoc({ seller: { ...base.seller!, ids: [{ scheme: 'SIREN', value: '552032534' }] } }),
  'franchise-without-vat-number': sampleDoc({ ...SCENARIOS['fr-franchise-293B'], seller: { ...base.seller!, vatRegime: 'franchise', ids: [{ scheme: 'SIREN', value: '552032534' }] } }),
  'reverse-charge-without-buyer-vat': sampleDoc({ ...SCENARIOS['eu-reverse-charge'], buyer: { ...SCENARIOS['eu-reverse-charge'].buyer!, ids: [] } }),
  'out-of-scope-mixed-with-standard': sampleDoc({
    lines: [base.lines[0], { ...base.lines[0], description: 'Débours', vatCategory: 'O', taxRate: 0 }],
    totals: { totalExclTax: 360000, totalTax: 36000, totalInclTax: 396000, taxBreakdown: [{ category: 'S', rate: 20, base: 180000, amount: 36000 }, { category: 'O', rate: 0, base: 180000, amount: 0 }] },
  }),
};

describe('pre-export EN 16931 checks', () => {
  it('accept every valid scenario', () => {
    for (const [name, doc] of Object.entries(SCENARIOS)) expect(einvoiceRuleErrors(doc), name).toEqual([]);
  });
  it('stop data that the official rules reject, with a message in the document language', () => {
    for (const [name, doc] of Object.entries(REJECTED)) expect(einvoiceRuleErrors(doc).length, name).toBeGreaterThan(0);
    expect(einvoiceRuleErrors(REJECTED['standard-seller-without-vat'])[0]).toMatch(/numéro de TVA/);
  });
});

describe.skipIf(!ready)('Schematron: EN 16931 (CEN artefacts 1.3.17) and Peppol BIS 3.0', () => {
  for (const [name, doc] of Object.entries(SCENARIOS)) {
    it(`${name}: Factur-X CII passes EN 16931`, () => {
      const xml = buildXml(buildFacturXInput(doc), Profile.EN16931, Flavor.FACTUR_X);
      expect(schematron(RULES.cii, xml, `${name}-cii`).join('\n')).toBe('');
    });
    it(`${name}: UBL passes EN 16931${existsSync(RULES.peppol) ? ' and Peppol BIS 3.0' : ''}`, () => {
      const xml = buildUbl(buildFacturXInput(doc), 2);
      expect(schematron(RULES.ubl, xml, `${name}-ubl`).join('\n')).toBe('');
      if (existsSync(RULES.peppol) && xml.includes(PEPPOL_ID)) expect(schematron(RULES.peppol, xml, `${name}-peppol`).join('\n')).toBe('');
    });
  }
});
