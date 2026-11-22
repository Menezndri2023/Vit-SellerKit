import { expect, test } from '@playwright/test';

test('guides: list, article with sources and CTA, language switch keeps the guide, Arabic goes to French', async ({ page }) => {
  await page.goto('/fr');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Guides' }).click();
  await expect(page).toHaveURL(/\/fr\/guides$/);
  await page.getByRole('link', { name: /Facture au Maroc/ }).click();
  await expect(page).toHaveURL(/\/fr\/guides\/facture-maroc-mentions-obligatoires$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Facture au Maroc : les mentions obligatoires (article 145 du CGI)' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Direction générale des impôts — Code général des impôts' })).toHaveAttribute('href', 'https://www.tax.gov.ma');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/fr\/guides\/facture-maroc-mentions-obligatoires$/);
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(ld).toContain('"@type":"Article"');

  // Language switch: same guide, English slug
  await page.getByRole('link', { name: 'English' }).first().click();
  await expect(page).toHaveURL(/\/en\/guides\/morocco-invoice-requirements$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Invoicing in Morocco');

  // Arabic URL: French version (no unreviewed translation)
  await page.goto('/ar/guides/calculate-profit-margin-per-sale');
  await expect(page).toHaveURL(/\/fr\/guides\/calculer-marge-benefice-vente$/);
  await expect(page.getByText('48,33 DH')).toBeVisible();
  await page.getByRole('link', { name: 'Calculer mon vrai bénéfice' }).click();
  await expect(page).toHaveURL(/\/fr\/calculator/);
  expect((await page.request.get('/fr/guides/does-not-exist')).status()).toBe(404);
});
