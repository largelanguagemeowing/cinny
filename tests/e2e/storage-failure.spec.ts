import { expect, test } from '@playwright/test';

test.describe('Browser storage checks', () => {
  test('distinguishes unavailable storage from missing IndexedDB support', async ({ page }) => {
    await page.addInitScript(() => {
      IDBFactory.prototype.open = () => {
        throw new DOMException('Disk quota exceeded', 'QuotaExceededError');
      };
    });

    await page.goto('/home/');

    await expect(page.getByText('Browser Storage Unavailable', { exact: true })).toBeVisible();
    await expect(page.getByText(/free some disk space/i)).toBeVisible();
    await expect(page.getByText('Missing Browser Feature', { exact: true })).toHaveCount(0);
  });

  test('reports IndexedDB as unsupported only when the API is missing', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', { value: undefined });
    });

    await page.goto('/home/');

    await expect(page.getByText('Missing Browser Feature', { exact: true })).toBeVisible();
  });
});
