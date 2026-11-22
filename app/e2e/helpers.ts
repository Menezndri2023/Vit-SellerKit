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
  // First visit: terms + transfer-abroad consent (law 09-08), then the dashboard
  await expect(page).toHaveURL(/\/fr\/consent/);
  await page.locator('input[name=terms]').check();
  await page.locator('input[name=transfer]').check();
  await page.getByRole('button', { name: 'Continuer' }).click();
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

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s) from a base32 secret, like authenticator apps. */
export function totp(secretBase32: string, at = Date.now()): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of secretBase32.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const h = require('node:crypto').createHmac('sha1', key).update(counter).digest() as Buffer;
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

/** Turns on two-factor authentication from Settings (required for admins). Returns the TOTP secret. */
export async function enableTwoFactor(page: Page, password: string): Promise<string> {
  await page.goto('/fr/app/settings');
  await page.getByRole('button', { name: 'Activer la double authentification' }).click();
  await page.getByLabel('Ton mot de passe Margokit').fill(password);
  await page.getByRole('button', { name: 'Continuer' }).click();
  const secret = (await page.getByTestId('totp-secret').innerText()).trim();
  await page.getByLabel('Code à 6 chiffres').fill(totp(secret));
  await page.getByRole('button', { name: 'Confirmer' }).click();
  await page.getByRole('button', { name: 'J’ai enregistré mes codes' }).click();
  await expect(page.getByText('✓ Activée')).toBeVisible();
  return secret;
}
