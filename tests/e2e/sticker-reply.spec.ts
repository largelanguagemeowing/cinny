import { expect, test } from '@playwright/test';
import { redactEvent } from './support/matrix';

const ROOM_ID = '!pFxmCvJLPLEicHDuJi:stablecat.club';
const ROOM_PATH = '%23test%3Astablecat.club/!pFxmCvJLPLEicHDuJi%3Astablecat.club';

test('renders a sticker as a reply to the selected message', async ({ page }) => {
  let targetEventId: string | undefined;
  let stickerEventId: string | undefined;

  try {
    await page.goto(`/${ROOM_PATH}`);

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
    await expect(page.getByText(marker, { exact: true })).toHaveCount(2);

    await page.getByRole('button', { name: 'Open sticker picker' }).click();
    const stickerResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        /\/send\/m\.sticker\//.test(decodeURIComponent(response.url())),
      { timeout: 30_000 }
    );
    await page.getByRole('button', { name: 'gadsen emoji' }).click();

    const stickerResponse = await stickerResponsePromise;
    expect(stickerResponse.ok()).toBe(true);
    const stickerContent = stickerResponse.request().postDataJSON();
    expect(stickerContent['m.relates_to']?.['m.in_reply_to']?.event_id).toBe(targetEventId);
    stickerEventId = ((await stickerResponse.json()) as { event_id?: string }).event_id;

    const stickerItem = page
      .locator('[data-message-id]')
      .filter({ has: page.locator('img[alt="gadsen"]') })
      .filter({ hasText: marker })
      .last();
    await expect(stickerItem).toBeVisible();
    await expect(stickerItem.locator('img[alt="gadsen"]')).toBeVisible();
    await expect(stickerItem).toContainText(marker);
    await expect.poll(() => stickerItem.getAttribute('data-message-id')).toMatch(/^\$/);
    expect(await stickerItem.getAttribute('data-message-id')).toBe(stickerEventId);
    if (!targetEventId || !stickerEventId) throw new Error('Missing sent event IDs');
  } finally {
    if (stickerEventId) await redactEvent(page, ROOM_ID, stickerEventId);
    if (targetEventId) await redactEvent(page, ROOM_ID, targetEventId);
  }
});
