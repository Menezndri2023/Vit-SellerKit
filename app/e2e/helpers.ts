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
