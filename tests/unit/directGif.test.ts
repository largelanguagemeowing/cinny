import { describe, expect, it } from 'vitest';
import { isDirectGifUrl } from '../../src/app/utils/directGif';
import { isMediaAutoEmbedUrl } from '../../src/app/utils/mediaAutoEmbed';

const bridgeUrl =
  'https://bridge.agiadn.org/download/discordcdn/1370776315266859131/1549720052788494416/PrimeTime.gif';

describe('direct GIF URLs', () => {
  it('embeds the Discord bridge GIF link instead of requesting a static URL preview', () => {
    expect(isMediaAutoEmbedUrl(bridgeUrl)).toBe(true);
  });

  it('preserves the existing video host restrictions', () => {
    expect(isMediaAutoEmbedUrl('https://nyafiles.de/video.mp4')).toBe(true);
    expect(isMediaAutoEmbedUrl('https://pissdichal.de/video.webm')).toBe(true);
    expect(isMediaAutoEmbedUrl('https://example.org/video.mp4')).toBe(false);
  });

  it.each([
    bridgeUrl,
    `${bridgeUrl}?ex=123&hm=abc#preview`,
    'https://cdn.discordapp.com/attachments/1/2/animation.GIF',
    'http://example.org/animation.gif',
  ])('recognizes %s', (url) => {
    expect(isDirectGifUrl(url)).toBe(true);
  });

  it.each([
    'not a URL',
    // eslint-disable-next-line no-script-url
    'javascript:animation.gif',
    'data:image/gif;base64,AAAA',
    'ftp://example.org/animation.gif',
    'https://example.org/animation.mp4',
    'https://example.org/animation.gif.html',
    'https://example.org/animation.gif/other',
    'https://example.org/?file=animation.gif',
    'https://example.org/#animation.gif',
    'https://user:password@example.org/animation.gif',
  ])('leaves %s as a normal link', (url) => {
    expect(isDirectGifUrl(url)).toBe(false);
  });
});
