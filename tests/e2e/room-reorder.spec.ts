import { test, expect, type Page } from '@playwright/test';

/**
 * E2E test for per-user room reordering in the space sidebar.
 *
 * Verifies that dragging a room nav item onto another reorders them,
 * and that the order persists across a page reload (account-data backed).
 */

const HOMESERVER = 'matrix.unredacted.org';
const USERNAME = 'tezstjidhsfd';
const PASSWORD = 'tezstjidhsfd1337';
const BASE_URL = 'https://cinny.k8s.mreow.de';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login/${HOMESERVER}`);
  await page.locator('input[name="usernameInput"]').fill(USERNAME);
  await page.locator('input[name="passwordInput"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  // Wait for the app to load and redirect to /home/ or a space
  await page.waitForURL(/\/(home|%23space)/, { timeout: 30_000 });
  // Give the client time to sync
  await page.waitForTimeout(3_000);
}

/** Navigate to the Unredacted Space lobby and wait for the sidebar to render rooms. */
async function goToSpace(page: Page) {
  await page.goto(`${BASE_URL}/%23space%3Aunredacted.org/lobby`);
  await page.waitForTimeout(2_000);
}

/** Returns the visible room names in the space sidebar "Rooms" section, top to bottom. */
async function getRoomNames(page: Page): Promise<string[]> {
  // Room nav links have a room alias (#room:server) in the URL, encoded as %23.
  // The Lobby and Search links don't have this pattern.
  const links = page.locator('a[href*="unredacted.org/%23"]');
  const texts = await links.evaluateAll((els) =>
    els.map((el) => el.textContent?.trim() ?? '').filter(Boolean)
  );
  return texts;
}

test.describe('Space sidebar room reordering', () => {
  test('drag reorders rooms and persists across reload', async ({ page }) => {
    await login(page);
    await goToSpace(page);

    // Wait until at least 2 rooms are visible
    await expect.poll(async () => (await getRoomNames(page)).length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

    const before = await getRoomNames(page);
    expect(before.length).toBeGreaterThanOrEqual(2);

    // Drag the second room onto the first room (insert before)
    const secondRoom = page.getByRole('link', { name: before[1] }).first();
    const firstRoom = page.getByRole('link', { name: before[0] }).first();
    await secondRoom.dragTo(firstRoom);
    await page.waitForTimeout(1_000);

    // Verify the order changed
    const after = await getRoomNames(page);
    expect(after.length).toBe(before.length);
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);

    // Verify persistence: reload and check the order is the same
    await page.reload();
    await page.waitForTimeout(3_000);
    const afterReload = await getRoomNames(page);
    expect(afterReload).toEqual(after);
  });
});
