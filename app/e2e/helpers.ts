import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { E2E_DB } from '../playwright.config';

/** Creates a verified account through the real sign-up API, then logs in through the UI. */
export async function signUpAndLogin(page: Page, name = 'Salma Test') {
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'correct-horse-9';
  const res = await page.request.post('/api/auth/sign-up/email', {
    data: { name, email, password, uiLocale: 'fr' },
    headers: { Origin: 'http://localhost:3100' },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const client = await MongoClient.connect(E2E_DB);
  await client.db().collection('user').updateOne({ email }, { $set: { emailVerified: true } });
  await client.close();

  await page.goto('/fr/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/fr\/app$/);
  return { email, password };
}

export async function setupBusiness(page: Page) {
  await page.goto('/fr/app/settings');
  await page.getByLabel('Raison sociale / nom').fill('Atlas Studio');
  await page.getByLabel('Adresse', { exact: true }).fill('12 rue de la Paix');
  await page.getByLabel('Ville', { exact: true }).fill('Paris');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByLabel(/^SIREN/).fill('552032534');
  await page.getByLabel(/^N° de TVA intracommunautaire/).fill('FR27552032534');
  await page.getByLabel(/^Pénalités de retard(?! —)/).fill('Pénalités de retard : 3 fois le taux d’intérêt légal');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Enregistré ✓')).toBeVisible();
  await page.goto('/fr/app/clients/new');
  await page.getByLabel('Nom de l’entreprise').fill('Client SAS');
  await page.getByLabel('Adresse', { exact: true }).fill('1 avenue de Lyon');
  await page.getByLabel('Ville', { exact: true }).fill('Lyon');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByLabel(/^SIREN/).fill('404833048');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/clients$/);
}

/** Creates a quote draft and tries to issue it. Returns the page URL. */
export async function createAndIssueQuote(page: Page, description: string) {
  await page.goto('/fr/app/documents/new?type=quote');
  await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Client SAS' });
  await page.getByLabel('Description', { exact: true }).fill(description);
  await page.getByLabel('Prix unitaire', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/documents\/[0-9a-f]{24}$/);
  await page.getByRole('button', { name: /Émettre/ }).click();
}
