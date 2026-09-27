import { createHmac } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { E2E_CRON_SECRET, E2E_DB, E2E_ENCRYPTION_KEY, E2E_PING_SECRET } from '../playwright.config';
import { createAndIssueQuote, setupBusiness, signUpAndLogin } from './helpers';

const registerLicense = (license: Record<string, unknown>) => fetch('http://localhost:3999/__register', { method: 'POST', body: JSON.stringify(license) });
const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();

test('free plan limit, watermark, then Pro with a Gumroad license', async ({ page }) => {
  test.setTimeout(120_000);
  page.on('dialog', (d) => d.accept());
  await signUpAndLogin(page);
  await setupBusiness(page);
  await expect(page.getByText('Plan gratuit : 0 sur 3 documents émis ce mois-ci.')).toBeVisible();

  for (const n of [1, 2, 3]) {
    await createAndIssueQuote(page, `Prestation ${n}`);
    await expect(page.getByText('Émis', { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Réalisé avec Margokit — margokit.com')).toBeVisible(); // free plan watermark
  await createAndIssueQuote(page, 'Prestation 4');
  await expect(page.getByText('Tu as atteint la limite du plan gratuit ce mois-ci.')).toBeVisible();

  // Wrong key, then a real lifetime license
  await page.goto('/fr/activate');
  await page.getByLabel('Clé de licence ou code d’activation').fill('NOT-A-REAL-KEY-12345678');
  await page.getByRole('button', { name: 'Activer' }).click();
  await expect(page.getByText('Cette clé ou ce code n’est pas valide.', { exact: false })).toBeVisible();
  const key = `LIFE-${uid()}-${uid()}`;
  await registerLicense({ key, product_id: 'prod_lifetime', email: 'buyer@example.com' });
  await page.getByLabel('Clé de licence ou code d’activation').fill(key);
  await page.getByRole('button', { name: 'Activer' }).click();
  await expect(page.getByText('Pro est activé. Merci ! 🎉')).toBeVisible();
  await expect(page.getByText('Pro à vie', { exact: true })).toBeVisible();

  // Now unlimited and without watermark
  await page.goto('/fr/app/documents?status=draft');
  await expect(page.getByText(/Plan gratuit/)).toHaveCount(0);
  await page.getByRole('link', { name: /Client SAS/ }).first().click();
  await page.getByRole('button', { name: /Émettre/ }).click();
  await expect(page.getByText('Émis', { exact: true })).toBeVisible();
  await expect(page.getByText('Réalisé avec Margokit — margokit.com')).toHaveCount(0);
});

test('a license can only be used by one account', async ({ page, browser }) => {
  const key = `LIFE-${uid()}-${uid()}`;
  await registerLicense({ key, product_id: 'prod_lifetime', email: 'x@example.com' });
  await signUpAndLogin(page);
  await page.goto('/fr/activate');
  await page.getByLabel('Clé de licence ou code d’activation').fill(key);
  await page.getByRole('button', { name: 'Activer' }).click();
  await expect(page.getByText('Pro est activé. Merci ! 🎉')).toBeVisible();

  const other = await browser.newContext({ locale: 'fr-FR' });
  const p2 = await other.newPage();
  await signUpAndLogin(p2, 'Autre');
  await p2.goto('/fr/activate');
  await p2.getByLabel('Clé de licence ou code d’activation').fill(key);
  await p2.getByRole('button', { name: 'Activer' }).click();
  await expect(p2.getByText('Cette clé ou ce code est déjà utilisé par un autre compte.')).toBeVisible();
  await other.close();
});

test('manual activation codes work once and extend Pro', async ({ page, browser }) => {
  const code = `MK-${uid().slice(0, 4).replace(/[01ILO]/g, 'A')}-${uid().slice(0, 4).replace(/[01ILO]/g, 'B')}-${uid().slice(0, 4).replace(/[01ILO]/g, 'C')}`;
  const hash = createHmac('sha256', Buffer.from(E2E_ENCRYPTION_KEY, 'base64')).update(code).digest('hex');
  const client = await MongoClient.connect(E2E_DB);
  await client.db().collection('activationcodes').insertOne({ codeHash: hash, hint: code.slice(-4), durationDays: 30, batch: 'e2e' });
  await client.close();

  await signUpAndLogin(page);
  await page.goto('/fr/activate');
  await page.getByLabel('Clé de licence ou code d’activation').fill(code.toLowerCase().replaceAll('-', ' '));
  await page.getByRole('button', { name: 'Activer' }).click();
  await expect(page.getByText('Pro est activé. Merci ! 🎉')).toBeVisible();
  await expect(page.getByText(/^Pro — jusqu’au /)).toBeVisible();

  const other = await browser.newContext({ locale: 'fr-FR' });
  const p2 = await other.newPage();
  await signUpAndLogin(p2, 'Autre');
  await p2.goto('/fr/activate');
  await p2.getByLabel('Clé de licence ou code d’activation').fill(code);
  await p2.getByRole('button', { name: 'Activer' }).click();
  await expect(p2.getByText('Cette clé ou ce code est déjà utilisé par un autre compte.')).toBeVisible();
  await other.close();
});

test('Gumroad webhook: secret, idempotency, automatic activation by verified email', async ({ page, request }) => {
  const { email } = await signUpAndLogin(page);
  const key = `MONTH-${uid()}-${uid()}`;
  const saleId = `sale_${uid()}`;
  await registerLicense({ key, product_id: 'prod_monthly', email, sale_id: saleId, subscription_id: `sub_${uid()}`, recurrence: 'monthly' });
  const form = { sale_id: saleId, product_id: 'prod_monthly', product_name: 'Margokit Pro — Monthly', email, license_key: key, price: '500', currency: 'usd', ip_country: 'Morocco' };

  expect((await request.post('/api/webhooks/gumroad/wrong-secret', { form })).status()).toBe(404);
  expect((await request.post(`/api/webhooks/unknown-provider/${E2E_PING_SECRET}`, { form })).status()).toBe(404);
  const first = await request.post(`/api/webhooks/gumroad/${E2E_PING_SECRET}`, { form });
  expect(await first.text()).toBe('OK');
  const again = await request.post(`/api/webhooks/gumroad/${E2E_PING_SECRET}`, { form });
  expect(await again.text()).toBe('Duplicate');

  await page.goto('/fr/activate');
  await expect(page.getByText('Pro mensuel — renouvelé automatiquement')).toBeVisible();

  // The license key is never stored in clear text in the event log
  const client = await MongoClient.connect(E2E_DB);
  const event = await client.db().collection('billingevents').findOne({ eventId: `gumroad:sale:${saleId}` });
  await client.close();
  expect(event?.verified).toBe(true);
  expect(JSON.stringify(event)).not.toContain(key);
  expect(event?.raw?.license_key).toBe(`…${key.slice(-4)}`);
});

test('daily cron requires its secret', async ({ request }) => {
  expect((await request.get('/api/cron/daily')).status()).toBe(401);
  const ok = await request.get('/api/cron/daily', { headers: { Authorization: `Bearer ${E2E_CRON_SECRET}` } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ rechecked: expect.any(Number), expired: expect.any(Number) });
});
