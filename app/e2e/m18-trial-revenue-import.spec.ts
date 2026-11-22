import { expect, test } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { E2E_DB } from '../playwright.config';
import { setupBusiness, signUpAndLogin } from './helpers';

test('7-day Pro trial: one click, once', async ({ page }) => {
  await signUpAndLogin(page);
  await page.getByRole('button', { name: 'Essayer Pro gratuitement 7 jours' }).click();
  await expect(page.getByText(/Essai Pro en cours : tout est débloqué jusqu’au/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Essayer Pro gratuitement 7 jours' })).toHaveCount(0);
  await page.goto('/fr/activate');
  await expect(page.getByText(/^Essai Pro — jusqu’au/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Essaie Pro gratuitement pendant 7 jours' })).toHaveCount(0);
});

test('import clients from a CSV file: check, then import', async ({ page }) => {
  await signUpAndLogin(page);
  await setupBusiness(page); // creates "Client SAS" (no email)
  await page.goto('/fr/app/clients');
  await page.getByRole('link', { name: 'Importer (CSV)' }).click();
  await expect(page).toHaveURL(/\/fr\/app\/clients\/import$/);
  const csv = [
    'Nom;E-mail;Adresse;Ville;Pays;ICE;Chiffre',
    'Atlas Négoce SARL;compta@atlas.ma;12 bd Zerktouni;Casablanca;Maroc;001234567000089;10',
    'Jean Martin;jean@example.fr;3 rue de la Paix;Paris;;;',
    'client sas;;1 avenue de Lyon;Lyon;FR;;',
    'Sans Adresse;x@example.com;;;;;',
  ].join('\n');
  await page.getByLabel('Fichier CSV').setInputFiles({ name: 'clients.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: 'Vérifier le fichier' }).click();
  await expect(page.getByText('4 lignes lues : 2 clients prêts à importer.')).toBeVisible();
  await expect(page.getByText('1 client existe déjà et sera ignoré.')).toBeVisible();
  await expect(page.getByText('Colonnes ignorées : Chiffre.')).toBeVisible();
  await expect(page.getByText(/Ligne 5 \(Sans Adresse\) : adresse, ville/)).toBeVisible();
  await page.getByRole('button', { name: 'Importer 2 clients' }).click();
  await expect(page.getByText('2 clients importés.')).toBeVisible();
  await page.getByRole('link', { name: 'Voir mes clients' }).click();
  await expect(page.getByText('3 clients', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: /Atlas Négoce SARL/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Jean Martin/ })).toBeVisible();
});

test('revenue page: empty, then figures from issued invoices', async ({ page }) => {
  const { email } = await signUpAndLogin(page);
  await page.goto('/fr/app/revenue');
  await expect(page.getByRole('heading', { name: 'Pas encore de revenus à afficher' })).toBeVisible();

  const client = await MongoClient.connect(E2E_DB);
  const user = await client.db().collection('user').findOne({ email });
  const year = new Date().getUTCFullYear();
  const base = {
    userId: String(user!._id), type: 'invoice', currency: 'EUR', docLocale: 'fr', lines: [], payments: [],
    buyer: { kind: 'business', name: 'Client SAS', address: { line1: 'x', city: 'Lyon', country: 'FR' } },
    createdAt: new Date(), updatedAt: new Date(), issuedAt: new Date(),
  };
  await client.db().collection('documents').insertMany([
    { ...base, status: 'paid', number: 'F-1', issueDate: new Date(Date.UTC(year, 0, 10)), totals: { totalExclTax: 100000, totalTax: 20000, totalInclTax: 120000, taxBreakdown: [] }, paid: 120000, amountDue: 0, payments: [{ amount: 120000, date: new Date(Date.UTC(year, 0, 20)), method: 'transfer', source: 'manual' }] },
    { ...base, status: 'issued', number: 'F-2', issueDate: new Date(Date.UTC(year, 0, 15)), dueDate: new Date(Date.UTC(year, 0, 16)), totals: { totalExclTax: 50000, totalTax: 10000, totalInclTax: 60000, taxBreakdown: [] }, paid: 0, amountDue: 60000 },
  ]);
  await client.close();

  await page.goto('/fr/app');
  await page.getByRole('link', { name: /Voir mes revenus/ }).click();
  await expect(page).toHaveURL(/\/fr\/app\/revenue$/);
  await expect(page.getByText(`Facturé en ${year}`)).toBeVisible();
  await expect(page.getByText(/^1\s500,00\s€$/).first()).toBeVisible(); // invoiced excl. tax
  await expect(page.getByText(/^1\s200,00\s€$/).first()).toBeVisible(); // collected
  await expect(page.getByText(/Dont 600,00\s€ en retard/)).toBeVisible();
  await expect(page.getByText('Payée en 10 jours en moyenne')).toBeVisible();
  await expect(page.getByRole('heading', { name: `Meilleurs clients en ${year}` })).toBeVisible();
});
