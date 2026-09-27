import { expect, test } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import { E2E_DB } from '../playwright.config';
import { setupBusiness, signUpAndLogin } from './helpers';

test('send an invoice to the e-invoicing platform and follow its lifecycle', async ({ page, request }) => {
  page.on('dialog', (d) => d.accept());
  await signUpAndLogin(page);
  await setupBusiness(page);
  await page.goto('/fr/app/documents/new?type=invoice');
  await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Client SAS' });
  await page.getByLabel('Description', { exact: true }).fill('Maintenance annuelle');
  await page.getByLabel('Prix unitaire', { exact: true }).fill('1200');
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await page.waitForURL(/documents\/[0-9a-f]{24}$/);
  const id = page.url().split('/').pop()!;
  await page.getByRole('button', { name: /Émettre/ }).click();
  await expect(page.getByText('Émis', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Envoyer via Sandbox (simulation)' }).click();
  await expect(page.getByText('Déposée', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Actualiser le statut' }).click();
  await expect(page.getByText('Reçue', { exact: true })).toBeVisible();

  // Full payment → reported to the platform as "cashed"
  await page.getByRole('button', { name: 'Enregistrer un paiement' }).click();
  await expect(page.getByText('Encaissée', { exact: true })).toBeVisible();

  // Status pushed by the platform's webhook
  const client = await MongoClient.connect(E2E_DB);
  const doc = await client.db().collection('documents').findOne({ _id: new ObjectId(id) });
  await client.close();
  const providerId = doc?.einvoice?.providerId as string;
  expect(providerId).toMatch(/^sbx_/);
  expect((await request.post('/api/einvoicing/sandbox/wrong', { data: { providerId, status: 'disputed' } })).status()).toBe(404);
  const ok = await request.post('/api/einvoicing/sandbox/einvoice-webhook-secret-e2e', { data: { providerId, status: 'disputed', reason: 'Montant contesté' } });
  expect(await ok.text()).toBe('OK');
  await page.reload();
  await expect(page.getByText('En litige', { exact: true })).toBeVisible();
  await expect(page.getByText('Montant contesté')).toBeVisible();
});
