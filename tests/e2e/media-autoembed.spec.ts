import { expect, test } from '@playwright/test';
import { matrixRequest, redactEvent } from './support/matrix';

const ROOM_ID = '!pFxmCvJLPLEicHDuJi:stablecat.club';
const ROOM_PATH = '%23test%3Astablecat.club/!pFxmCvJLPLEicHDuJi%3Astablecat.club';
const MEDIA_URL = 'https://nyafiles.de/TqfpA.mp4';

type SendEventResponse = {
  event_id?: string;
};

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

test('does not embed media from a reply fallback', async ({ page }) => {
  let targetEventId: string | undefined;
  let replyEventId: string | undefined;

  try {
    await page.goto(`/${ROOM_PATH}`);

    const editor = page.locator('[data-editable-name="RoomInput"]');
    await expect(editor).toBeVisible();

    const target = await matrixRequest<SendEventResponse>(page, {
      method: 'PUT',
      path: `/rooms/${encodeURIComponent(ROOM_ID)}/send/m.room.message/${Date.now()}`,
      body: {
        msgtype: 'm.text',
        body: MEDIA_URL,
      },
    });
    targetEventId = target?.event_id;
    expect(targetEventId).toBeTruthy();
    if (!targetEventId) throw new Error('Missing target event ID');

    const replyText = `media reply ${Date.now()}`;
    const reply = await matrixRequest<SendEventResponse>(page, {
      method: 'PUT',
      path: `/rooms/${encodeURIComponent(ROOM_ID)}/send/m.room.message/${Date.now() + 1}`,
      body: {
        msgtype: 'm.text',
        body: `> <@blong:stablecat.club> ${MEDIA_URL}\n\n${replyText}`,
        format: 'org.matrix.custom.html',
        formatted_body: `<mx-reply><blockquote><a href="https://matrix.to/#/@blong:stablecat.club">blong</a><br />${MEDIA_URL}</blockquote></mx-reply>${replyText}`,
        'm.relates_to': {
          'm.in_reply_to': {
            event_id: targetEventId,
          },
        },
      },
    });
    replyEventId = reply?.event_id;
    expect(replyEventId).toBeTruthy();
    if (!replyEventId) throw new Error('Missing reply event ID');

    const replyMessage = page.locator(`[data-message-id="${replyEventId}"]`);
    await expect(replyMessage).toBeVisible();
    await expect(replyMessage.locator('video')).toHaveCount(0);
  } finally {
    if (replyEventId) await redactEvent(page, ROOM_ID, replyEventId);
    if (targetEventId) await redactEvent(page, ROOM_ID, targetEventId);
  }
});
