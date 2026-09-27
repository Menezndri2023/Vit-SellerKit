import { extractXml, Profile, validateXsd } from '@stackforge-eu/factur-x';
import { expect, test } from '@playwright/test';
import { createAndIssueQuote, setupBusiness, signUpAndLogin } from './helpers';

test('Factur-X and UBL exports of an issued invoice', async ({ page, playwright }) => {
  page.on('dialog', (d) => d.accept());
  await signUpAndLogin(page);
  await setupBusiness(page);
  await page.goto('/fr/app/documents/new?type=invoice');
  await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Client SAS' });
  await page.getByLabel('Description', { exact: true }).fill('Conseil en stratégie');
  await page.getByLabel('Qté', { exact: true }).fill('3');
  await page.getByLabel('Prix unitaire', { exact: true }).fill('450');
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await page.waitForURL(/documents\/[0-9a-f]{24}$/);
  const id = page.url().split('/').pop();

  // Drafts can't be exported
  expect((await page.request.get(`/api/documents/${id}/facturx`)).status()).toBe(422);

  await page.getByRole('button', { name: /Émettre/ }).click();
  await expect(page.getByText('Émis', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Factur-X (PDF)' })).toBeVisible();

  // Factur-X: PDF with embedded, schema-valid CII XML
  const fx = await page.request.get(`/api/documents/${id}/facturx`);
  expect(fx.status(), await fx.text().catch(() => '')).toBe(200);
  const pdf = await fx.body();
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  const { xml, filename } = await extractXml(pdf);
  expect(filename).toBe('factur-x.xml');
  expect(xml).toMatch(/<ram:ID>INV-\d{4}-001<\/ram:ID>/);
  expect(xml).toContain('<ram:GrandTotalAmount>1620.00</ram:GrandTotalAmount>');
  expect(xml).toContain('404833048'); // client SIREN
  expect((await validateXsd(xml, Profile.EN16931)).errors).toEqual([]);

  // UBL (Peppol BIS 3.0)
  const ubl = await page.request.get(`/api/documents/${id}/ubl`);
  expect(ubl.status()).toBe(200);
  const ublXml = await ubl.text();
  expect(ublXml).toContain('urn:fdc:peppol.eu:2017:poacc:billing:3.0');
  expect(ublXml).toContain('<cbc:PayableAmount currencyID="EUR">1620.00</cbc:PayableAmount>');

  // Quotes are not e-invoices
  await createAndIssueQuote(page, 'Devis test');
  await expect(page.getByText('Émis', { exact: true })).toBeVisible();
  const quoteId = page.url().split('/').pop();
  expect((await page.request.get(`/api/documents/${quoteId}/ubl`)).status()).toBe(422);
  await expect(page.getByRole('button', { name: 'Factur-X (PDF)' })).toHaveCount(0);

  // Without a session, nothing is exported
  const anon = await playwright.request.newContext({ baseURL: 'http://localhost:3100' });
  expect((await anon.get(`/api/documents/${id}/ubl`)).status()).toBe(401);
  expect((await anon.get(`/api/documents/${id}/facturx`)).status()).toBe(401);
  await anon.dispose();
});
