import { expect, test } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import { E2E_CRON_SECRET, E2E_DB } from '../playwright.config';
import { setupBusiness, signUpAndLogin } from './helpers';

test('recurring invoice: Pro only, scheduled from an issued invoice, the daily job prepares a draft', async ({ page, request }) => {
  page.on('dialog', (d) => d.accept());
  const { email } = await signUpAndLogin(page, 'Recurrent Test');
  await setupBusiness(page);
  await page.goto('/fr/app/documents/new?type=invoice');
  await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Client SAS' });
  await page.getByLabel('Description', { exact: true }).fill('Abonnement maintenance');
  await page.getByLabel('Prix unitaire', { exact: true }).fill('300');
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/documents\/[0-9a-f]{24}$/);
  const invoiceUrl = page.url();
  const sourceId = invoiceUrl.split('/').pop()!;
  await page.getByRole('button', { name: /Émettre/ }).click();
  const panel = page.locator('section', { has: page.getByRole('heading', { name: 'Facture récurrente' }) });
  await expect(panel.getByText('Fonction Pro.')).toBeVisible();

  // Pro
  const db = await MongoClient.connect(E2E_DB);
  const user = await db.db().collection('user').findOne({ email });
  await db.db().collection('subscriptions').insertOne({ userId: String(user!._id), plan: 'manual', provider: 'manual', status: 'active', expiresAt: null, startsAt: new Date(), remindersSent: [] });
  await page.reload();
  await panel.getByLabel('Fréquence').selectOption('monthly');
  await panel.getByRole('button', { name: 'Programmer' }).click();
  await expect(panel.getByText(/Chaque mois · prochain brouillon le .* · aucun brouillon créé/)).toBeVisible();

  // The date comes: the daily job prepares the draft (once)
  await db.db().collection('recurrences').updateOne({ sourceId }, { $set: { nextDate: new Date(new Date().toISOString().slice(0, 10)) } });
  const run = async () => (await (await request.get('/api/cron/daily', { headers: { Authorization: `Bearer ${E2E_CRON_SECRET}` } })).json()).recurring_drafts;
  expect(await run()).toBe(1);
  expect(await run()).toBe(0);
  const rec = await db.db().collection('recurrences').findOne({ sourceId });
  const draft = await db.db().collection('documents').findOne({ _id: new ObjectId(rec!.lastDraftId) });
  expect(draft).toMatchObject({ status: 'draft', type: 'invoice' });
  await page.goto(`/fr/app/documents/${rec!.lastDraftId}`);
  await expect(page.getByText('Brouillon préparé par une facture récurrente : vérifie-le, puis émets-le.')).toBeVisible();
  await expect(page.getByLabel('Description', { exact: true })).toHaveValue('Abonnement maintenance');

  // Stop
  await page.goto(invoiceUrl);
  await panel.getByRole('button', { name: 'Arrêter la récurrence' }).click();
  await expect(panel.getByRole('button', { name: 'Programmer' })).toBeVisible();
  await db.close();
});
