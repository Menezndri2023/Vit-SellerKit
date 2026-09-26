import { expect, test, type Page } from '@playwright/test';
import { signUpAndLogin } from './helpers';

async function issuedInvoice(page: Page) {
  page.on('dialog', (d) => d.accept());
  await signUpAndLogin(page);
  await page.goto('/fr/app/settings');
  await page.getByLabel('Raison sociale / nom').fill('Atlas Studio');
  await page.getByLabel('Adresse', { exact: true }).fill('12 rue de la Paix');
  await page.getByLabel('Code postal').fill('75002');
  await page.getByLabel('Ville', { exact: true }).fill('Paris');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByLabel(/^SIREN/).fill('552032534');
  await page.getByLabel(/^N° de TVA intracommunautaire/).fill('FR27552032534');
  await page.getByLabel(/^IBAN/).fill('FR7630006000011234567890189');
  await page.getByLabel(/^BIC/).fill('BNPAFRPP');
  await page.getByLabel(/^Pénalités de retard/).fill('Pénalités de retard : 3 fois le taux d’intérêt légal');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Enregistré ✓')).toBeVisible();
  await page.goto('/fr/app/clients/new');
  await page.getByLabel('Nom de l’entreprise').fill('Danone');
  await page.getByLabel('E-mail').fill('compta@example.com');
  await page.getByLabel('Adresse', { exact: true }).fill('17 boulevard Haussmann');
  await page.getByLabel('Ville', { exact: true }).fill('Paris');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByLabel(/^SIREN/).fill('552032534');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.waitForURL(/clients$/);
  await page.goto('/fr/app/documents/new?type=invoice');
  await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Danone' });
  await page.getByLabel('Langue du document').selectOption('en');
  await page.getByLabel('Description', { exact: true }).fill('Brand identity');
  await page.getByLabel('Prix unitaire', { exact: true }).fill('1800');
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await page.waitForURL(/documents\/[0-9a-f]{24}$/);
  // Drafts can be previewed as PDF
  const draftPdf = await page.request.get(`${page.url().replace('/fr/app/documents/', '/api/documents/')}/pdf`);
  expect(draftPdf.headers()['content-type']).toBe('application/pdf');
  await page.getByRole('button', { name: /Émettre/ }).click();
  await expect(page.getByText('Émis', { exact: true })).toBeVisible();
  return page.url();
}

test('PDF, public link, regenerate, email', async ({ page, browser, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const docUrl = await issuedInvoice(page);
  const id = docUrl.split('/').pop();

  // Authenticated PDF (English document from a French UI)
  const pdf = await page.request.get(`/api/documents/${id}/pdf`);
  expect(pdf.status()).toBe(200);
  const bytes = await pdf.body();
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  require('node:fs').writeFileSync(`/tmp/mk-invoice-${test.info().project.name}.pdf`, bytes);

  // Public link works without an account, in the document language
  await page.getByRole('button', { name: 'Copier le lien client' }).click();
  await expect(page.getByRole('button', { name: 'Lien copié !' })).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/en\/d\/[A-Za-z0-9_-]{43}$/);
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(link);
  await expect(anonPage.getByRole('heading', { name: 'Invoice' })).toBeVisible();
  await expect(anonPage.getByText('Fixed compensation for recovery costs in case of late payment: €40')).toBeVisible();
  const publicPdf = await anonPage.request.get(`${link.replace(/\/en\/d\//, '/api/public/')}/pdf`);
  expect(publicPdf.status()).toBe(200);
  // Random tokens don't work, other users' private PDF routes don't either
  expect((await anonPage.goto(link.replace(/.{5}$/, 'AAAAA')))?.status()).toBe(404);
  expect((await anonPage.request.get(`/api/documents/${id}/pdf`)).status()).toBe(401);

  // Regenerating disables the old link
  await page.getByRole('button', { name: /Nouveau lien/ }).click();
  await page.waitForTimeout(500);
  expect((await anonPage.goto(link))?.status()).toBe(404);
  await anon.close();

  // Email with the PDF attached marks the invoice as sent
  await page.getByRole('button', { name: 'Envoyer par e-mail' }).click();
  await expect(page.getByLabel('E-mail du client')).toHaveValue('compta@example.com');
  await expect(page.getByLabel('Message')).toHaveValue(/Please find attached invoice INV-/);
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
  await expect(page.getByText('E-mail envoyé ✓')).toBeVisible();
  await expect(page.getByText('Envoyé', { exact: true })).toBeVisible();
});
