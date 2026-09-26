import { expect, test } from '@playwright/test';
import { signUpAndLogin } from './helpers';

test('business profile: validation keeps values, then saves', async ({ page }) => {
  await signUpAndLogin(page);
  await page.goto('/fr/app/settings');

  await page.getByLabel('Raison sociale / nom').fill('Atlas Studio');
  await page.getByLabel('Adresse', { exact: true }).fill('12 rue de la Paix');
  await page.getByLabel('Ville', { exact: true }).fill('Paris');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByLabel(/^SIREN/).fill('552 032 535'); // wrong check digit
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.getByText('Ce numéro ne semble pas correct. Vérifie-le.')).toBeVisible();
  await expect(page.getByLabel('Raison sociale / nom')).toHaveValue('Atlas Studio'); // not wiped

  await page.getByLabel(/^SIREN/).fill('552 032 534');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Enregistré ✓')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(/^SIREN/)).toHaveValue('552032534');
  await expect(page.getByLabel('Devise par défaut')).toHaveValue('EUR');
});

test('clients and products: create, list, search, and stay private', async ({ page, browser }) => {
  await signUpAndLogin(page);

  await page.goto('/fr/app/clients');
  await expect(page.getByText('Aucun client pour l’instant')).toBeVisible();
  await page.getByRole('link', { name: 'Nouveau client' }).click();
  await page.getByLabel('Nom de l’entreprise').fill('Danone');
  await page.getByLabel('Adresse', { exact: true }).fill('17 bd Haussmann');
  await page.getByLabel('Ville', { exact: true }).fill('Paris');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByLabel(/^SIREN/).fill('552032534');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/clients$/);
  await expect(page.getByText('Danone')).toBeVisible();
  const clientUrl = await page.getByRole('link', { name: /Danone/ }).getAttribute('href');

  await page.goto('/fr/app/products/new');
  await page.getByLabel('Nom', { exact: true }).fill('Création de logo');
  await page.getByLabel('Devise').selectOption('MAD');
  await page.getByLabel('Prix unitaire HT').fill('1 500,50');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/products$/);
  await expect(page.getByText('Création de logo')).toBeVisible();
  await expect(page.getByText(/1\s?500,50\s?MAD/)).toBeVisible();

  // Another user must not see this client
  const other = await browser.newContext({ locale: 'fr-FR' });
  const otherPage = await other.newPage();
  await signUpAndLogin(otherPage, 'Autre Utilisateur');
  const res = await otherPage.goto(clientUrl!);
  expect(res?.status()).toBe(404);
  await other.close();
});
