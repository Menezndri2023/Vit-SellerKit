import { expect, test } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { E2E_CRON_SECRET, E2E_DB } from '../playwright.config';
import { setupBusiness, signUpAndLogin } from './helpers';

const isoDaysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

test('automatic reminders: Pro only, opt-in, sent once by the daily job, history on the invoice', async ({ page, request }) => {
  page.on('dialog', (d) => d.accept()); // "Émettre" asks for confirmation
  const { email } = await signUpAndLogin(page, 'Relance Test');
  await setupBusiness(page);

  // Free plan: visible, but reserved to Pro
  await page.goto('/fr/app/settings');
  const section = page.locator('#reminders');
  await expect(section.getByText('Fonction Pro.')).toBeVisible();
  await expect(section.getByRole('button', { name: 'Activer les relances' })).toHaveCount(0);

  // Pro (lifetime code granted directly in the test database)
  const db = await MongoClient.connect(E2E_DB);
  const user = await db.db().collection('user').findOne({ email });
  await db.db().collection('subscriptions').insertOne({ userId: String(user!._id), plan: 'manual', provider: 'manual', status: 'active', expiresAt: null, startsAt: new Date(), remindersSent: [] });
  await page.reload();
  await section.getByRole('button', { name: 'Activer les relances' }).click();
  await expect(section.getByText('✓ Activées')).toBeVisible();

  // A client with an email, and an invoice already 3 days late
  await page.goto('/fr/app/clients/new');
  await page.getByLabel('Nom de l’entreprise').fill('Retard SARL');
  await page.getByLabel('E-mail').fill('compta@retard.example');
  await page.getByLabel('Adresse', { exact: true }).fill('3 rue du Port');
  await page.getByLabel('Ville', { exact: true }).fill('Marseille');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByLabel(/^SIREN/).fill('552100554');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.goto('/fr/app/documents/new?type=invoice');
  await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Retard SARL' });
  await page.getByLabel('Date', { exact: true }).fill(isoDaysAgo(33));
  await page.getByLabel('Échéance', { exact: true }).fill(isoDaysAgo(3));
  await page.getByLabel('Description', { exact: true }).fill('Maintenance site');
  await page.getByLabel('Prix unitaire', { exact: true }).fill('250');
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/documents\/[0-9a-f]{24}$/);
  await page.getByRole('button', { name: /Émettre/ }).click();
  await expect(page.getByRole('heading', { name: 'Relances automatiques' })).toBeVisible();
  await expect(page.getByText(/Prochaine relance le/)).toBeVisible();

  // The daily job sends the first reminder, once
  const run = async () => (await (await request.get('/api/cron/daily', { headers: { Authorization: `Bearer ${E2E_CRON_SECRET}` } })).json()).reminders_sent;
  expect(await run()).toBe(1);
  expect(await run()).toBe(0);
  await page.reload();
  await expect(page.getByText(/1re relance · .* · compta@retard\.example/)).toBeVisible();

  // Per-invoice switch
  await page.getByRole('button', { name: 'Ne pas relancer cette facture' }).click();
  await expect(page.getByText('Relances coupées pour cette facture.')).toBeVisible();
  await db.close();
});
