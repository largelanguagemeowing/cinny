import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e', quiet: true });

const authFile = 'playwright/.auth/user.json';
const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
if (!baseURL) {
  throw new Error(
    'Missing PLAYWRIGHT_BASE_URL. Copy .env.e2e.example to .env.e2e and set the deployment URL.'
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
      use: { browserName: 'chromium', storageState: authFile },
    },
  ],
});
