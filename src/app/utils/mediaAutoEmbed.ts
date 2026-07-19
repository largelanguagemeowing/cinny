const MEDIA_AUTO_EMBED_HOSTS = new Set(['nyafiles.de', 'pissdichal.de']);

export const isMediaAutoEmbedUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      MEDIA_AUTO_EMBED_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
};
