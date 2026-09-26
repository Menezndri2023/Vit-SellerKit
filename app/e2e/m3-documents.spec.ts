import { expect, test, type Page } from '@playwright/test';
import { signUpAndLogin } from './helpers';

const year = new Date().getUTCFullYear();

async function setupFrenchBusiness(page: Page) {
  await page.goto('/fr/app/settings');
  await page.getByLabel('Raison sociale / nom').fill('Atlas Studio');
  await page.getByLabel('Adresse', { exact: true }).fill('12 rue de la Paix');
  await page.getByLabel('Code postal').fill('75002');
  await page.getByLabel('Ville', { exact: true }).fill('Paris');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByLabel(/^SIREN/).fill('552032534');
  await page.getByLabel(/^N° de TVA intracommunautaire/).fill('FR27552032534');
  await page.getByLabel(/^Pénalités de retard/).fill('Pénalités de retard : 3 fois le taux d’intérêt légal');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Enregistré ✓')).toBeVisible();
}

async function createClient(page: Page, name: string) {
  await page.goto('/fr/app/clients/new');
  await page.getByLabel('Nom de l’entreprise').fill(name);
  await page.getByLabel('Adresse', { exact: true }).fill('1 avenue de Lyon');
  await page.getByLabel('Ville', { exact: true }).fill('Lyon');
  await page.getByLabel('Pays').selectOption('FR');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/clients$/);
}

test('invoice: compliance blocks, then issue, pay and credit', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await signUpAndLogin(page);
  await setupFrenchBusiness(page);
  await createClient(page, 'Client SAS');

  // Draft with live totals
  await page.goto('/fr/app/documents/new?type=invoice');
  await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Client SAS' });
  await page.getByLabel('Description', { exact: true }).fill('Création de logo');
  await page.getByLabel('Qté', { exact: true }).fill('2');
  await page.getByLabel('Prix unitaire', { exact: true }).fill('500');
  await expect(page.getByText(/1\s?200,00\s?€/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/documents\/[0-9a-f]{24}$/);
  const invoiceUrl = page.url();

  // Missing client SIREN blocks issuing (French e-invoicing reform)
  await page.getByRole('button', { name: /Émettre/ }).click();
  await expect(page.getByText('Le SIREN du client est obligatoire', { exact: false })).toBeVisible();

  // Add the SIREN, then issue
  await page.goto('/fr/app/clients');
  await page.getByRole('link', { name: /Client SAS/ }).click();
  await page.getByLabel(/^SIREN/).fill('404833048');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/clients$/);
  await page.goto(invoiceUrl);
  await page.getByRole('button', { name: /Émettre/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: `Facture INV-${year}-001` })).toBeVisible();
  await expect(page.getByText('Émis', { exact: true })).toBeVisible();

  // Legal mentions on the document
  await expect(page.getByText('Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 €')).toBeVisible();
  await expect(page.getByText('Nature de l’opération : prestation de services')).toBeVisible();
  await expect(page.getByText('SIREN : 404833048')).toBeVisible();
  await expect(page.getByRole('button', { name: /Émettre/ })).toHaveCount(0);

  // Full payment
  await page.getByRole('button', { name: 'Enregistrer un paiement' }).click();
  await expect(page.getByText('Payée', { exact: true })).toBeVisible();

  // Credit note for the full amount cancels the invoice
  await page.getByRole('button', { name: 'Créer un avoir' }).click();
  await expect(page).not.toHaveURL(invoiceUrl);
  await page.getByRole('button', { name: /Émettre/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: `Avoir CN-${year}-001` })).toBeVisible();
  await expect(page.getByText(`Avoir sur la facture n° INV-${year}-001`, { exact: false })).toBeVisible();
  await page.goto(invoiceUrl);
  await expect(page.getByText('Annulée', { exact: true })).toBeVisible();
});

test('quote: issue then convert to invoice', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await signUpAndLogin(page);
  await setupFrenchBusiness(page);
  await createClient(page, 'Prospect SARL');

  await page.goto('/fr/app/documents/new?type=quote');
  await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Prospect SARL' });
  await page.getByLabel('Description', { exact: true }).fill('Site vitrine');
  await page.getByLabel('Prix unitaire', { exact: true }).fill('1500');
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click();
  await page.getByRole('button', { name: /Émettre/ }).click(); // quotes don't need the client's SIREN
  await expect(page.getByRole('heading', { level: 1, name: `Devis QUO-${year}-001` })).toBeVisible();

  await page.getByRole('button', { name: 'Transformer en facture' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Facture' })).toBeVisible();
  await expect(page.getByText('Créée à partir d’un devis')).toBeVisible();
  await expect(page.getByLabel('Description', { exact: true })).toHaveValue('Site vitrine');

  await page.goto('/fr/app/documents?type=quote');
  await expect(page.getByText('Accepté', { exact: true })).toBeVisible();
});
