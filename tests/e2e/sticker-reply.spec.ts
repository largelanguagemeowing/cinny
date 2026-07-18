import { expect, test, type Page } from '@playwright/test';

const HOMESERVER = 'matrix.unredacted.org';
const USERNAME = 'tezstjidhsfd';
const PASSWORD = 'tezstjidhsfd1337';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://cinny.k8s.mreow.de';
const ROOM_ID = '!pFxmCvJLPLEicHDuJi:stablecat.club';
const ROOM_PATH = '%23test%3Astablecat.club/!pFxmCvJLPLEicHDuJi%3Astablecat.club';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login/${HOMESERVER}`);
  await page.locator('input[name="usernameInput"]').fill(USERNAME);
  await page.locator('input[name="passwordInput"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/\/(home|%23space)/, { timeout: 30_000 });
}

async function redactEvent(page: Page, eventId: string) {
  await page.evaluate(
    async ({ roomId, targetEventId }) => {
      const homeserver = localStorage.getItem('cinny_hs_base_url');
      const accessToken = localStorage.getItem('cinny_access_token');
      if (!homeserver || !accessToken) return;

      await fetch(
        `${homeserver}/_matrix/client/v3/rooms/${encodeURIComponent(
          roomId
        )}/redact/${encodeURIComponent(targetEventId)}/${Date.now()}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        }
      );
    },
    { roomId: ROOM_ID, targetEventId: eventId }
  );
}

test('renders a sticker as a reply to the selected message', async ({ page }) => {
  let targetEventId: string | undefined;
  let stickerEventId: string | undefined;

  try {
    await login(page);
    await page.goto(`${BASE_URL}/${ROOM_PATH}`);

    const editor = page.locator('[data-editable-name="RoomInput"]');
    await expect(editor).toBeVisible();

    const marker = `sticker reply e2e ${Date.now()}`;
    await editor.fill(marker);
    await editor.press('Enter');

    const target = page.getByText(marker, { exact: true });
    await expect(target).toBeVisible();
    const targetItem = target.locator('xpath=ancestor::*[@data-message-id][1]');
    await expect.poll(() => targetItem.getAttribute('data-message-id')).toMatch(/^\$/);
    targetEventId = (await targetItem.getAttribute('data-message-id')) ?? undefined;
    expect(targetEventId).toBeTruthy();

    await targetItem.hover();
    await targetItem.locator('button[data-event-id]').first().click();

    const composer = editor.locator('xpath=ancestor::div[.//button][1]');
    await composer.locator('button[aria-pressed]').first().click();
    const stickerRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' && /\/send\/m\.sticker\//.test(decodeURIComponent(request.url()))
    );
    await page.getByRole('button', { name: 'gadsen emoji' }).click();
    const stickerRequest = await stickerRequestPromise;
    const stickerContent = stickerRequest.postDataJSON();
    expect(stickerContent['m.relates_to']?.['m.in_reply_to']?.event_id).toBe(targetEventId);
    const stickerResponse = await stickerRequest.response();
    if (!stickerResponse) throw new Error('Missing sticker send response');
    expect(stickerResponse.ok()).toBe(true);
    stickerEventId = (await stickerResponse.json()).event_id as string | undefined;
    expect(stickerEventId).toBeTruthy();
    if (!targetEventId || !stickerEventId) throw new Error('Missing sent event IDs');

    const stickerItem = page.locator(`[data-message-id="${stickerEventId}"]`);
    await expect(stickerItem).toBeVisible();
    await expect(stickerItem.locator('img[alt="gadsen"]')).toBeVisible();
    await expect(stickerItem).toContainText(marker);
  } finally {
    if (stickerEventId) await redactEvent(page, stickerEventId);
    if (targetEventId) await redactEvent(page, targetEventId);
  }
});
