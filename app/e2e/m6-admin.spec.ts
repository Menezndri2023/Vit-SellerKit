import { expect, test } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { E2E_DB } from '../playwright.config';
import { signUpAndLogin } from './helpers';

async function makeAdmin(email: string) {
  const client = await MongoClient.connect(E2E_DB);
  await client.db().collection('user').updateOne({ email }, { $set: { role: 'admin' } });
  await client.close();
}

test('admin area is server-protected, then usable by an admin', async ({ page, browser }) => {
  page.on('dialog', (d) => d.accept());
  // A regular user never reaches the admin
  const { email } = await signUpAndLogin(page, 'Admin Person');
  await page.goto('/fr/admin');
  await expect(page).toHaveURL(/\/fr\/app$/);

  // Another user who will receive Pro from the admin
  const other = await browser.newContext({ locale: 'fr-FR' });
  const userPage = await other.newPage();
  const { email: userEmail } = await signUpAndLogin(userPage, 'Client Whatsapp');

  await makeAdmin(email);
  await page.goto('/fr/admin');
  await expect(page.getByText('Conversion gratuit → Pro')).toBeVisible();

  // Grant 30 days to the other user
  await page.goto(`/fr/admin/users?q=${encodeURIComponent(userEmail)}`);
  await expect(page.getByText(userEmail)).toBeVisible();
  await page.getByRole('button', { name: '+30 jours' }).click();
  await expect(page.getByText(/manual\/manual · Jusqu’au/)).toBeVisible();
  await userPage.goto('/fr/activate');
  await expect(userPage.getByText(/^Pro — jusqu’au /)).toBeVisible();

  // Revoke
  await page.getByRole('button', { name: 'Retirer Pro' }).click();
  await expect(page.getByRole('button', { name: 'Retirer Pro' })).toHaveCount(0);
  await userPage.reload();
  await expect(userPage.getByText('Gratuit', { exact: true })).toBeVisible();

  // Generate a lifetime code, shown once, then redeemed by the user
  await page.goto('/fr/admin/codes');
  await page.getByLabel('Durée').selectOption('lifetime');
  await page.getByLabel('Note (qui, comment payé)').fill('Virement Youssef');
  await page.getByRole('button', { name: 'Générer' }).click();
  const code = (await page.locator('pre').innerText()).trim();
  expect(code).toMatch(/^MK-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
  await userPage.getByLabel('Clé de licence ou code d’activation').fill(code);
  await userPage.getByRole('button', { name: 'Activer' }).click();
  await expect(userPage.getByText('Pro — à vie')).toBeVisible();
  await page.reload();
  await expect(page.getByText(`MK-…-${code.slice(-4)}`)).toBeVisible();
  await expect(page.getByText(new RegExp(`Utilisé .* par ${userEmail.replace(/[.+]/g, '\\$&')}`))).toBeVisible();

  // Sales journal and stats render
  await page.goto('/fr/admin/sales');
  await expect(page.getByRole('link', { name: 'Ventes' })).toBeVisible();
  await other.close();
});
