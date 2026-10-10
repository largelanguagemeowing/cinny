const OVERLAY_SIZE = 32;

// Discord-style red bubble with the mention count, used as the Windows taskbar overlay.
export const renderBadgeOverlay = (count: number): string | undefined => {
  const canvas = document.createElement('canvas');
  canvas.width = OVERLAY_SIZE;
  canvas.height = OVERLAY_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const label = count > 99 ? '99+' : String(count);
  const radius = OVERLAY_SIZE / 2;

  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f23f43';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${label.length > 2 ? 13 : 18}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, radius, radius + 1);

  return canvas.toDataURL('image/png');
};
