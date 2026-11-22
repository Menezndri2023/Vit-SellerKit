import { expect, test } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { E2E_DB } from '../playwright.config';
import { signUpAndLogin, totp } from './helpers';

async function makeAdmin(email: string) {
  const client = await MongoClient.connect(E2E_DB);
  await client.db().collection('user').updateOne({ email }, { $set: { role: 'admin' } });
  await client.close();
}

test('admin area is server-protected, requires two-factor authentication, then usable by an admin', async ({ page, browser }) => {
  page.on('dialog', (d) => d.accept());
  // A regular user never reaches the admin
  const { email, password } = await signUpAndLogin(page, 'Admin Person');
  await page.goto('/fr/admin');
  await expect(page).toHaveURL(/\/fr\/app$/);

  // Another user who will receive Pro from the admin
  const other = await browser.newContext({ locale: 'fr-FR' });
  const userPage = await other.newPage();
  const { email: userEmail } = await signUpAndLogin(userPage, 'Client Whatsapp');

  await makeAdmin(email);
  // Admin area requires two-factor authentication: sent to Settings until it is on
  await page.goto('/fr/admin');
  await expect(page).toHaveURL(/\/fr\/app\/settings\?twofa=required/);
  await expect(page.getByText('Active la double authentification pour accéder à l’espace administrateur.')).toBeVisible();
  await page.getByRole('button', { name: 'Activer la double authentification' }).click();
  await page.getByLabel('Ton mot de passe Margokit').fill('wrong-password-1');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Mot de passe incorrect.')).toBeVisible();
  await page.getByLabel('Ton mot de passe Margokit').fill(password);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('img', { name: 'QR code à scanner avec l’application d’authentification' })).toBeVisible();
  const secret = (await page.getByTestId('totp-secret').innerText()).trim();
  await page.getByLabel('Code à 6 chiffres').fill(totp(secret));
  await page.getByRole('button', { name: 'Confirmer' }).click();
  const backupCodes = (await page.getByTestId('backup-codes').innerText()).split(/\s+/).filter(Boolean);
  expect(backupCodes.length).toBeGreaterThanOrEqual(8);
  await page.getByRole('button', { name: 'J’ai enregistré mes codes' }).click();
  await expect(page.getByText('✓ Activée')).toBeVisible();
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

  // Signing in now asks the code: a wrong one is refused, the app code works
  const login = async () => {
    const ctx = await browser.newContext({ locale: 'fr-FR' });
    const p = await ctx.newPage();
    await p.goto('/fr/login');
    await p.getByLabel('E-mail').fill(email);
    await p.getByLabel('Mot de passe').fill(password);
    await p.getByRole('button', { name: 'Se connecter' }).click();
    await expect(p.getByLabel('Code de vérification')).toBeVisible();
    return { ctx, p };
  };
  const a = await login();
  await expect(a.p).toHaveURL(/\/fr\/login$/); // no session before the code
  expect((await a.p.request.get('/api/account/export')).status()).toBe(401);
  await a.p.getByLabel('Code de vérification').fill(totp(secret) === '000000' ? '111111' : '000000');
  await a.p.getByRole('button', { name: 'Vérifier' }).click();
  await expect(a.p.getByText('Code incorrect. Vérifie l’heure de ton téléphone et réessaie.')).toBeVisible();
  await a.p.getByLabel('Code de vérification').fill(totp(secret));
  await a.p.getByRole('button', { name: 'Vérifier' }).click();
  await expect(a.p).toHaveURL(/\/fr\/app$/);
  await a.p.goto('/fr/admin');
  await expect(a.p.getByText('Conversion gratuit → Pro')).toBeVisible();
  await a.ctx.close();

  // Lost phone: a backup code works once
  const b = await login();
  await b.p.getByRole('button', { name: 'Utiliser un code de secours' }).click();
  await b.p.getByLabel('Code de secours').fill(backupCodes[0]);
  await b.p.getByRole('button', { name: 'Vérifier' }).click();
  await expect(b.p).toHaveURL(/\/fr\/app$/);
  await b.ctx.close();
  const c = await login();
  await c.p.getByRole('button', { name: 'Utiliser un code de secours' }).click();
  await c.p.getByLabel('Code de secours').fill(backupCodes[0]);
  await c.p.getByRole('button', { name: 'Vérifier' }).click();
  await expect(c.p.getByText('Code de secours incorrect ou déjà utilisé.')).toBeVisible();
  await c.ctx.close();
});
