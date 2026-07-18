import { test, expect, type Page } from '@playwright/test';

/**
 * E2E test for the Rooms pseudo-space.
 *
 * Rooms without a parent space live under /rooms/ (a pseudo-space tab in the
 * sidebar) while direct messages stay in the Home tab.
 */

const HOMESERVER = 'matrix.unredacted.org';
const USERNAME = 'tezstjidhsfd';
const PASSWORD = 'tezstjidhsfd1337';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://cinny.k8s.mreow.de';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login/${HOMESERVER}`);
  await page.locator('input[name="usernameInput"]').fill(USERNAME);
  await page.locator('input[name="passwordInput"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/\/(home|rooms|%23space)/, { timeout: 60_000 });
  // Give the client time to sync
  await page.waitForTimeout(5_000);
}

test.describe('Rooms pseudo-space', () => {
  test('orphan rooms live under /rooms/, DMs stay in Home', async ({ page }) => {
    await login(page);

    // The Rooms pseudo-space page lists orphan rooms and room actions.
    await page.goto(`${BASE_URL}/rooms/`);
    await expect(page.getByText('Create Room', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Join with Address', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Direct Messages', { exact: true })).toHaveCount(0);

    // Opening an orphan room keeps the URL under /rooms/ and shows the composer.
    const roomLink = page.locator('a[href*="/rooms/!"], a[href*="/rooms/%21"]').first();
    await expect(roomLink).toBeVisible();
    await roomLink.click();
    await expect(
      page.locator('[contenteditable="true"], [data-testid="msg-input"]').first()
    ).toBeVisible({ timeout: 20_000 });
    expect(new URL(page.url()).pathname.startsWith('/rooms/')).toBe(true);

    // Home keeps DMs but no longer offers room actions or a Rooms category.
    await page.goto(`${BASE_URL}/home/`);
    await expect(page.getByText('Home', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Create Room', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Join with Address', { exact: true })).toHaveCount(0);
  });
});
