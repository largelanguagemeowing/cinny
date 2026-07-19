import { expect, test } from '@playwright/test';
import { redactEvent } from './support/matrix';

const ROOM_ID = '!pFxmCvJLPLEicHDuJi:stablecat.club';
const ROOM_PATH = '%23test%3Astablecat.club/!pFxmCvJLPLEicHDuJi%3Astablecat.club';
const MEDIA_URL = 'https://nyafiles.de/TqfpA.mp4';

test('autoembeds negotiated nyafiles video and retains its link', async ({ page }) => {
  let eventId: string | undefined;

  try {
    await page.goto(`/${ROOM_PATH}`);

    const editor = page.locator('[data-editable-name="RoomInput"]');
    await expect(editor).toBeVisible();

    const mediaRequestPromise = page.waitForRequest(
      (request) => request.method() === 'GET' && request.url() === MEDIA_URL
    );
    const sendResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        /\/send\/m\.room\.message\//.test(decodeURIComponent(response.url()))
    );

    await editor.fill(MEDIA_URL);
    await editor.press('Enter');

    const sendResponse = await sendResponsePromise;
    expect(sendResponse.ok()).toBe(true);
    eventId = ((await sendResponse.json()) as { event_id?: string }).event_id;
    expect(eventId).toBeTruthy();
    if (!eventId) throw new Error('Missing sent event ID');

    const mediaRequest = await mediaRequestPromise;
    expect(mediaRequest.headers().accept).toBe('image/*, video/*');
    const mediaResponse = await mediaRequest.response();
    expect(mediaResponse?.ok()).toBe(true);
    expect((await mediaResponse?.allHeaders())?.['content-type']).toContain('video/mp4');

    const message = page.locator(`[data-message-id="${eventId}"]`);
    await expect(message).toBeVisible();
    await expect(message.getByRole('link', { name: MEDIA_URL })).toHaveAttribute('href', MEDIA_URL);

    const video = message.locator('video[aria-label="Embedded video"]');
    await expect(video).toBeVisible();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
      .toBeGreaterThanOrEqual(1);
    expect(await video.evaluate((element: HTMLVideoElement) => element.videoWidth)).toBeGreaterThan(
      0
    );
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.videoHeight)
    ).toBeGreaterThan(0);
  } finally {
    if (eventId) await redactEvent(page, ROOM_ID, eventId);
  }
});
