const MEDIA_AUTO_EMBED_HOSTS = new Set(['nyafiles.de', 'pissdichal.de']);
const VIDEO_EXTENSIONS = new Set([
  'mp4',
  'm4v',
  'webm',
  'ogv',
  'mov',
  'mkv',
  'avi',
]);

export const isMediaAutoEmbedUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    if (!(url.protocol === 'http:' || url.protocol === 'https:')) return false;
    if (!MEDIA_AUTO_EMBED_HOSTS.has(url.hostname)) return false;
    const ext = url.pathname.split('.').pop()?.toLowerCase();
    return ext !== undefined && ext !== '' && VIDEO_EXTENSIONS.has(ext);
  } catch {
    return false;
  }
};
