export const isDirectGifUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      !url.username &&
      !url.password &&
      url.pathname.toLowerCase().endsWith('.gif')
    );
  } catch {
    return false;
  }
};
