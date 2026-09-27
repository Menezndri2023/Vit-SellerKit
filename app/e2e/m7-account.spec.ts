import { expect, test } from '@playwright/test';
import { setupBusiness, signUpAndLogin } from './helpers';

test('legal pages, data export and account deletion', async ({ page }) => {
  await page.goto('/fr/legal/terms');
  await expect(page.getByRole('heading', { level: 1, name: 'Conditions générales d’utilisation' })).toBeVisible();
  await page.goto('/en/legal/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();

  const { email, password } = await signUpAndLogin(page);
  await setupBusiness(page);

  const exported = await page.request.get('/api/account/export');
  expect(exported.status()).toBe(200);
  const data = await exported.json();
  expect(data.account.email).toBe(email);
  expect(data.businessProfile.legalName).toBe('Atlas Studio');
  expect(data.clients).toHaveLength(1);

  await page.goto('/fr/app/settings');
  await page.getByRole('button', { name: 'Supprimer mon compte' }).click();
  await page.getByLabel(/Tape ton e-mail/).fill('wrong@example.com');
  await page.getByRole('button', { name: 'Tout supprimer' }).click();
  await expect(page.getByText('L’e-mail ne correspond pas.')).toBeVisible();
  await page.getByLabel(/Tape ton e-mail/).fill(email);
  await page.getByRole('button', { name: 'Tout supprimer' }).click();
  await expect(page).toHaveURL(/\/fr$/);

  // The account is gone
  expect((await page.request.get('/api/account/export')).status()).toBe(401);
  const login = await page.request.post('/api/auth/sign-in/email', { data: { email, password }, headers: { Origin: 'http://localhost:3100' } });
  expect(login.ok()).toBe(false);
});
