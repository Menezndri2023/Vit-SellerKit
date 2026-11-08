import { createHash, randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { E2E_DB } from '../playwright.config';
import { signUpAndLogin } from './helpers';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function db<T>(fn: (c: MongoClient) => Promise<T>): Promise<T> {
  const client = await MongoClient.connect(E2E_DB);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

test('anonymous review: email confirmation, verified purchase, moderation, publication', async ({ page }) => {
  test.setTimeout(90_000);
  page.on('dialog', (d) => d.accept());
  const email = `buyer-${randomUUID()}@example.com`;
  const comment = `Je vois enfin mon vrai bénéfice par commande, colis refusés compris. ${randomUUID().slice(0, 8)}`;

  // Validation errors
  await page.goto('/fr/reviews?kit=tracker');
  await expect(page.locator('#review-kit')).toHaveValue('tracker');
  await page.getByRole('button', { name: 'Envoyer mon avis' }).click();
  await expect(page.getByText('Choisis une note de 1 à 5 étoiles.')).toBeVisible();
  await expect(page.getByText('Coche la case pour accepter la publication.')).toBeVisible();

  // Valid anonymous review → asks for email confirmation
  await page.getByLabel('5 sur 5').check({ force: true });
  await page.locator('#review-comment').fill(comment);
  await page.locator('#review-name').fill('Salma Bennani');
  await page.locator('#review-location').fill('Casablanca');
  await page.locator('#review-email').fill(email);
  await page.getByLabel(/J’accepte que mon avis/).check();
  await page.getByRole('button', { name: 'Envoyer mon avis' }).click();
  await expect(page.getByText(/On vient de t’envoyer un e-mail/)).toBeVisible();

  // The buyer bought the Tracker on Gumroad; we know the confirmation token (the email is only printed in tests)
  const token = `tok-${randomUUID()}`;
  await db(async (c) => {
    await c.db().collection('billingevents').insertOne({ provider: 'gumroad', eventId: `gumroad:sale:${randomUUID()}`, type: 'sale', email, productName: 'Order & Inventory Tracker — Google Sheets for Online Sellers (EN/FR)', isTest: false, receivedAt: new Date() });
    const r = await c.db().collection('reviews').updateOne({ email, kit: 'tracker', status: 'unconfirmed' }, { $set: { confirmTokenHash: sha256(token) } });
    expect(r.modifiedCount).toBe(1);
  });

  // Not public before confirmation and moderation
  await page.goto('/fr/reviews?kit=tracker');
  await expect(page.getByText(comment)).toHaveCount(0);

  await page.goto(`/fr/reviews/confirm?token=${token}`);
  await page.getByRole('button', { name: 'Confirmer mon avis' }).click();
  await expect(page.getByRole('heading', { name: 'Avis confirmé, merci !' })).toBeVisible();
  // A used link does not work twice
  await page.goto(`/fr/reviews/confirm?token=${token}`);
  await page.getByRole('button', { name: 'Confirmer mon avis' }).click();
  await expect(page.getByRole('heading', { name: 'Lien invalide ou expiré' })).toBeVisible();

  // Admin moderation
  const { email: adminEmail } = await signUpAndLogin(page, 'Admin Avis');
  await db((c) => c.db().collection('user').updateOne({ email: adminEmail }, { $set: { role: 'admin' } }));
  await page.goto('/fr/admin/reviews');
  const item = page.locator('li', { hasText: comment });
  await expect(item.getByText('Achat vérifié')).toBeVisible();
  await expect(item.getByText(email, { exact: false })).toBeVisible();
  await item.getByRole('button', { name: 'Publier' }).click();
  await expect(page.locator('li', { hasText: comment })).toHaveCount(0);

  // Public: name shortened, badge, no email, counted in the summary
  await page.goto('/fr/reviews?kit=tracker');
  const card = page.locator('figure', { hasText: comment });
  await expect(card).toBeVisible();
  await expect(card.getByText('Salma B.')).toBeVisible();
  await expect(card.getByText('Achat vérifié')).toBeVisible();
  await expect(page.getByText(email)).toHaveCount(0);
  await expect(page.getByText('Bennani')).toHaveCount(0);

  // Signed-in user: no email confirmation, straight to moderation
  await page.goto('/fr/reviews?kit=pro');
  await expect(page.getByText(`Tu es connecté avec ${adminEmail}`)).toBeVisible();
  await page.getByLabel('4 sur 5').check({ force: true });
  await page.locator('#review-comment').fill('Les factures sont prêtes en une minute, le PDF est propre.');
  await page.getByLabel(/J’accepte que mon avis/).check();
  await page.getByRole('button', { name: 'Envoyer mon avis' }).click();
  await expect(page.getByText(/Ton avis sera publié après relecture/)).toBeVisible();
  await page.goto('/fr/admin/reviews');
  await expect(page.getByText('Les factures sont prêtes en une minute, le PDF est propre.').first()).toBeVisible();

  // Cleanup so other runs start from a known state
  await db((c) => c.db().collection('reviews').deleteMany({ email: { $in: [email, adminEmail.toLowerCase()] } }));
});
