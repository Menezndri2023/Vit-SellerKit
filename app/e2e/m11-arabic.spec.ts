import { expect, test } from '@playwright/test';
import { signUpAndLogin } from './helpers';

test('Arabic interface: RTL, Latin digits, language switch', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('heading', { level: 1, name: 'اكتشف كم تربح فعلًا من كل عملية بيع' })).toBeVisible();
  // Calculator result uses Latin digits
  await expect(page.getByText(/7[.,]13/).first()).toBeVisible();

  // Arabic-Indic digits typed in the calculator are understood
  await page.getByLabel('سعر البيع').fill('٣٠');
  await expect(page.getByText(/تخسر|هامش/).first()).toBeVisible();

  // Switch language on the same page
  await page.getByRole('link', { name: 'Français' }).click();
  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

  // Signed-in app in Arabic
  await signUpAndLogin(page);
  await page.goto('/ar/app/clients');
  await expect(page.getByText('لا يوجد عملاء بعد')).toBeVisible();
  await page.goto('/ar/app/documents');
  await expect(page.getByRole('heading', { level: 1, name: 'المستندات' })).toBeVisible();
  await expect(page.getByText('الخطة المجانية: 0 من 3 مستندات صادرة هذا الشهر.')).toBeVisible();
});
