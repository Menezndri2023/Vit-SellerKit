import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
export const E2E_DB = 'mongodb://127.0.0.1:27018/margokit_e2e?replicaSet=rs0';
export const E2E_ENCRYPTION_KEY = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
export const E2E_PING_SECRET = 'ping-secret-for-e2e-0123456789';
export const E2E_CRON_SECRET = 'cron-secret-for-e2e-0123456789';

// Runs against a production build (`npm run build` first) and the local dev database (`npm run db`).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, locale: 'fr-FR', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    { command: 'node e2e/gumroad-mock.mjs', port: 3999, reuseExistingServer: false },
    {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: false,
    env: { MONGODB_URI: E2E_DB, NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`, BETTER_AUTH_URL: `http://localhost:${PORT}`, BETTER_AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-123', E2E_DISABLE_RATE_LIMIT: '1', APP_ENCRYPTION_KEY: E2E_ENCRYPTION_KEY,
      GUMROAD_API_URL: 'http://localhost:3999',
      GUMROAD_PRODUCT_ID_MONTHLY: 'prod_monthly',
      GUMROAD_PRODUCT_ID_LIFETIME: 'prod_lifetime',
      GUMROAD_PING_SECRET: E2E_PING_SECRET,
      CRON_SECRET: E2E_CRON_SECRET,
    },
    },
  ],
});
