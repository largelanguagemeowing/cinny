import { expect, test, type Page } from '@playwright/test';

const HOMESERVER = 'matrix.unredacted.org';
const USERNAME = 'tezstjidhsfd';
const PASSWORD = 'tezstjidhsfd1337';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://cinny.k8s.mreow.de';
const ROOM_ID = '!SSZyjqjwolfGYGY6z-4HW4bmdhIW6vnZSN1qgLzxlH0';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login/${HOMESERVER}`);
  await page.locator('input[name="usernameInput"]').fill(USERNAME);
  await page.locator('input[name="passwordInput"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/\/(home|%23space)/, { timeout: 30_000 });
}

async function getDistanceFromBottom(page: Page): Promise<number> {
  return page
    .locator('[data-message-item]')
    .last()
    .evaluate((message) => {
      let scrollElement = message.parentElement;
      while (scrollElement && getComputedStyle(scrollElement).overflowY !== 'scroll') {
        scrollElement = scrollElement.parentElement;
      }
      if (!scrollElement) throw new Error('Timeline scroll element not found');

      return scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;
    });
}

test('keeps following the timeline when content grows asynchronously', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/home/${ROOM_ID}`);

  const lastMessage = page.locator('[data-message-item]').last();
  await expect(lastMessage).toBeVisible();

  await lastMessage.evaluate((message) => {
    const resizeProbe = document.createElement('div');
    resizeProbe.dataset.autoFollowResizeProbe = 'true';
    resizeProbe.style.height = '800px';
    message.append(resizeProbe);

    let scrollElement = message.parentElement;
    while (scrollElement && getComputedStyle(scrollElement).overflowY !== 'scroll') {
      scrollElement = scrollElement.parentElement;
    }
    if (!scrollElement) throw new Error('Timeline scroll element not found');
    scrollElement.scrollTop = scrollElement.scrollHeight;
  });

  await expect.poll(() => getDistanceFromBottom(page)).toBeLessThanOrEqual(1);
  await page.waitForTimeout(1_500);

  await lastMessage.evaluate((message) => {
    const resizeProbe = message.querySelector('[data-auto-follow-resize-probe]');
    if (!(resizeProbe instanceof HTMLElement)) throw new Error('Resize probe not found');
    resizeProbe.style.height = '1400px';
  });

  await expect.poll(() => getDistanceFromBottom(page), { timeout: 5_000 }).toBeLessThanOrEqual(1);
});
