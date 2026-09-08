const imageAsPng = async (src: string): Promise<Blob> => {
  // The service worker authenticates Matrix media; encrypted images already use blob URLs.
  const response = await fetch(src);
  if (!response.ok) throw new Error('Unable to download image');
  const blob = await response.blob();
  if (blob.type === 'image/png') return blob;

  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to convert image');
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((png) => {
        if (png) resolve(png);
        else reject(new Error('Unable to convert image'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const copyImage = async (src: string): Promise<void> => {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Image copying is unavailable in this browser');
  }
  // Start the clipboard write during the click gesture, before fetching/converting.
  const png = imageAsPng(src);
  // Handle conversion failures even if clipboard permission is rejected first.
  png.catch(() => undefined);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
};
