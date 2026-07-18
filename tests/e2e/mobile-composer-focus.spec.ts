import { devices, expect, test, type Page } from '@playwright/test';

const HOMESERVER = 'matrix.unredacted.org';
const USERNAME = 'tezstjidhsfd';
const PASSWORD = 'tezstjidhsfd1337';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://cinny.k8s.mreow.de';
const ROOM_ID = '!SSZyjqjwolfGYGY6z-4HW4bmdhIW6vnZSN1qgLzxlH0';

test.use({ ...devices['Pixel 5'] });

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login/${HOMESERVER}`);
  await page.locator('input[name="usernameInput"]').fill(USERNAME);
  await page.locator('input[name="passwordInput"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/\/(home|%23space)/, { timeout: 30_000 });
}

test('keeps the mobile composer focused while sending', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/home/${ROOM_ID}`);

  const editor = page.locator('[data-editable-name="RoomInput"]');
  await expect(editor).toBeVisible();
  await editor.click();
  await editor.pressSequentially('mobile composer focus test');

  await editor.evaluate((element) => {
    element.setAttribute('data-blur-count', '0');
    element.addEventListener('blur', () => {
      const blurCount = Number(element.getAttribute('data-blur-count'));
      element.setAttribute('data-blur-count', String(blurCount + 1));
    });
  });

  const composer = editor.locator('xpath=ancestor::div[.//button][1]');
  const sendButton = composer.locator('button').last();
  await sendButton.tap();

  await expect(editor).not.toContainText('mobile composer focus test');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveAttribute('data-blur-count', '0');
});
