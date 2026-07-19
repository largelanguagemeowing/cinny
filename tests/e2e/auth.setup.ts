import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { test as setup } from '@playwright/test';
import { loginWithTestAccount } from './support/auth';

const authFile = 'playwright/.auth/user.json';

setup('authenticate with the E2E account', async ({ page }) => {
  await loginWithTestAccount(page);
  await mkdir(dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
