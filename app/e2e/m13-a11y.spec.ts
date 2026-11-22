import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { setupBusiness, signUpAndLogin } from './helpers';

/** Automated WCAG 2.x A/AA checks (axe). They don't replace a manual audit (keyboard, screen reader). */
async function scan(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return violations.map((v) => `${url} · ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

test('public pages have no automatically detectable WCAG A/AA violations', async ({ page }) => {
  const problems: string[] = [];
  for (const url of ['/fr', '/en', '/ar', '/fr/calculator', '/ar/calculator', '/fr/reviews', '/fr/legal/terms', '/fr/login', '/fr/signup', '/fr/forgot-password']) {
    problems.push(...(await scan(page, url)));
  }
  expect(problems, problems.join('\n')).toEqual([]);
});

test('signed-in pages have no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await signUpAndLogin(page);
  await setupBusiness(page);
  const problems: string[] = [];
  for (const url of ['/fr/app', '/fr/app/documents', '/fr/app/documents/new', '/fr/app/clients', '/fr/app/products/new', '/fr/app/settings', '/fr/activate', '/ar/app']) {
    problems.push(...(await scan(page, url)));
  }
  expect(problems, problems.join('\n')).toEqual([]);
});

test.describe('dark mode', () => {
  test.use({ colorScheme: 'dark' });
  test('public pages keep AA contrast in dark mode', async ({ page }) => {
    const problems: string[] = [];
    for (const url of ['/fr', '/ar', '/fr/calculator', '/fr/login']) problems.push(...(await scan(page, url)));
    expect(problems, problems.join('\n')).toEqual([]);
  });
});
