import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { E2E_DB } from '../playwright.config';

test('terms + transfer consent: required once, recorded with proof, no open redirect', async ({ page }) => {
  const email = `e2e-consent-${randomUUID()}@example.com`;
  const password = 'correct-horse-9';
  const res = await page.request.post('/api/auth/sign-up/email', { data: { name: 'Nour', email, password, uiLocale: 'fr' }, headers: { Origin: 'http://localhost:3100' } });
  expect(res.ok()).toBeTruthy();
  const db = await MongoClient.connect(E2E_DB);
  const users = db.db().collection('user');
  await users.updateOne({ email }, { $set: { emailVerified: true } });

  await page.goto('/fr/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/fr\/consent\?next=%2Fapp$/);

  // Every signed-in area sends back to the consent page until it is given
  for (const url of ['/fr/app/documents', '/fr/activate', '/fr/app/settings']) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/fr\/consent/);
  }
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);

  // A forged "next" can't send the user to another site
  await page.goto('/fr/consent?next=//evil.example/steal');
  await page.locator('input[name=terms]').check();
  await page.locator('input[name=transfer]').check();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page).toHaveURL(/\/fr\/app$/);

  const consent = (await users.findOne({ email }))?.consent;
  expect(consent).toMatchObject({ version: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
  expect(consent.termsAcceptedAt).toBeInstanceOf(Date);
  expect(consent.transferAcceptedAt).toBeInstanceOf(Date);
  expect(typeof consent.ip).toBe('string');

  // Given once: no more detour, and it appears in the data export
  await page.goto('/fr/app/documents');
  await expect(page).toHaveURL(/\/fr\/app\/documents$/);
  expect((await (await page.request.get('/api/account/export')).json()).consent.version).toBe(consent.version);
  await db.close();
});
