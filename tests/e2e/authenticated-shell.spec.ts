import { expect, test } from '@playwright/test';

test.describe('Authenticated application shell', () => {
  test('loads the account and opens user settings', async ({ page }) => {
    await page.goto('/home/');

    const settingsButton = page.getByRole('button', { name: 'User Settings' });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    await expect(page.getByText('Settings', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('General', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Account', { exact: true }).first()).toBeVisible();
  });

  test('redirects authenticated users away from login', async ({ page }) => {
    await page.goto('/login/');
    await page.waitForURL(/\/home\//);
    await expect(page.getByRole('button', { name: 'User Settings' })).toBeVisible();
  });
});
