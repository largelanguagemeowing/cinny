import { expect, test, type Page } from '@playwright/test';

const HOMESERVER = 'matrix.unredacted.org';
const USERNAME = 'tezstjidhsfd';
const PASSWORD = 'tezstjidhsfd1337';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://cinny.k8s.mreow.de';
const ROOM_ID = '!pFxmCvJLPLEicHDuJi:stablecat.club';
const ROOM_PATH = '%23test%3Astablecat.club/!pFxmCvJLPLEicHDuJi%3Astablecat.club';
const MEDIA_URL = 'https://nyafiles.de/TqfpA.mp4';

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

test('autoembeds negotiated nyafiles video and retains its link', async ({ page }) => {
  let eventId: string | undefined;

  try {
    await login(page);
    await page.goto(`${BASE_URL}/${ROOM_PATH}`);

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
    if (eventId) await redactEvent(page, eventId);
  }
});
