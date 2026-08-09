import { expect, test } from '@playwright/test';
import { matrixRequest, redactEvent } from './support/matrix';

const ROOM_ID = '!pFxmCvJLPLEicHDuJi:stablecat.club';
const ROOM_PATH = '%23test%3Astablecat.club/!pFxmCvJLPLEicHDuJi%3Astablecat.club';
const AUDIO_DURATION_SECONDS = 4;

const createSilentWav = (): number[] => {
  const sampleRate = 8000;
  const sampleCount = sampleRate * AUDIO_DURATION_SECONDS;
  const dataSize = sampleCount * 2;
  const wav = Buffer.alloc(44 + dataSize);

  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);

  return Array.from(wav);
};

test('audio timeline supports pointer and keyboard seeking', async ({ page }) => {
  let eventId: string | undefined;

  try {
    await page.goto(`/${ROOM_PATH}`);

    const audioBytes = createSilentWav();
    const contentUri = await page.evaluate(async (bytes) => {
      const homeserver = localStorage.getItem('cinny_hs_base_url');
      const accessToken = localStorage.getItem('cinny_access_token');
      if (!homeserver || !accessToken) throw new Error('Missing authenticated Matrix session');

      const response = await fetch(
        `${homeserver}/_matrix/media/v3/upload?filename=scrub-test.wav`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'audio/wav',
          },
          body: new Uint8Array(bytes),
        }
      );
      if (!response.ok) throw new Error(`Audio upload failed: ${response.status}`);
      const result = (await response.json()) as { content_uri?: string };
      if (!result.content_uri) throw new Error('Audio upload returned no content URI');
      return result.content_uri;
    }, audioBytes);

    const result = await matrixRequest<{ event_id: string }>(page, {
      method: 'PUT',
      path: `/rooms/${encodeURIComponent(ROOM_ID)}/send/m.room.message/${Date.now()}`,
      body: {
        msgtype: 'm.audio',
        body: 'Audio scrubber test',
        url: contentUri,
        info: {
          duration: AUDIO_DURATION_SECONDS * 1000,
          mimetype: 'audio/wav',
          size: audioBytes.length,
        },
      },
    });
    eventId = result?.event_id;
    if (!eventId) throw new Error('Missing sent event ID');

    const message = page.locator(`[data-message-id="${eventId}"]`);
    await expect(message).toBeVisible();
    await message.getByRole('button', { name: 'Play', exact: true }).click();

    const audio = message.locator('audio');
    await expect
      .poll(() => audio.evaluate((element) => element.readyState))
      .toBeGreaterThanOrEqual(1);

    const seekSlider = message.getByRole('slider', { name: 'Seek audio' });
    const seekTrack = seekSlider.locator('..');
    const thumbBox = await seekSlider.boundingBox();
    const trackBox = await seekTrack.boundingBox();
    if (!thumbBox || !trackBox) throw new Error('Audio seek control has no layout box');

    await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(trackBox.x + trackBox.width * 0.75, trackBox.y + trackBox.height / 2);

    await expect
      .poll(async () => Number(await seekSlider.getAttribute('aria-valuenow')))
      .toBeGreaterThan(2);
    await expect.poll(() => audio.evaluate((element) => element.currentTime)).toBeGreaterThan(2);
    await page.mouse.up();

    await seekSlider.focus();
    const beforeKeyboardSeek = await audio.evaluate((element) => element.currentTime);
    await seekSlider.press('ArrowLeft');
    await expect
      .poll(() => audio.evaluate((element) => element.currentTime))
      .toBeLessThan(beforeKeyboardSeek);
  } finally {
    if (eventId) await redactEvent(page, ROOM_ID, eventId);
  }
});
