const GIF_SIGNATURE = [0x47, 0x49, 0x46, 0x38]; // GIF8
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0): boolean =>
  signature.every((byte, index) => bytes[offset + index] === byte);

const readFourCC = (bytes: Uint8Array, offset: number): string =>
  String.fromCharCode(...bytes.subarray(offset, offset + 4));

const readUint32BE = (bytes: Uint8Array, offset: number): number =>
  bytes[offset] * 2 ** 24 +
  bytes[offset + 1] * 2 ** 16 +
  bytes[offset + 2] * 2 ** 8 +
  bytes[offset + 3];

// GIF sub-blocks are length-prefixed and terminated by a zero-length block
const skipGifSubBlocks = (bytes: Uint8Array, offset: number): number => {
  let pos = offset;
  while (pos < bytes.length && bytes[pos] !== 0) {
    pos += bytes[pos] + 1;
  }
  return pos + 1;
};

const isAnimatedGif = (bytes: Uint8Array): boolean => {
  let pos = 13; // header (6) + logical screen descriptor (7)
  const screenFlags = bytes[10];
  if (screenFlags >= 0x80) pos += 3 * 2 ** ((screenFlags % 8) + 1);

  let frames = 0;
  while (pos < bytes.length) {
    const block = bytes[pos];
    if (block === 0x21) {
      // extension: introducer, label, then sub-blocks
      pos = skipGifSubBlocks(bytes, pos + 2);
    } else if (block === 0x2c) {
      frames += 1;
      if (frames > 1) return true;
      const imageFlags = bytes[pos + 9];
      pos += 10;
      if (imageFlags >= 0x80) pos += 3 * 2 ** ((imageFlags % 8) + 1);
      pos += 1; // LZW minimum code size
      pos = skipGifSubBlocks(bytes, pos);
    } else {
      break;
    }
  }
  return false;
};

const isAnimatedWebP = (bytes: Uint8Array): boolean => {
  // extended format: "RIFF" size "WEBP" "VP8X" size flags, animation is flag bit 0x02
  if (readFourCC(bytes, 12) !== 'VP8X') return false;
  return Math.floor(bytes[20] / 2) % 2 === 1;
};

const isAnimatedPng = (bytes: Uint8Array): boolean => {
  // APNG declares an acTL chunk before the first IDAT chunk
  let pos = 8;
  while (pos + 8 <= bytes.length) {
    const length = readUint32BE(bytes, pos);
    const type = readFourCC(bytes, pos + 4);
    if (type === 'acTL') return true;
    if (type === 'IDAT') return false;
    pos += 12 + length;
  }
  return false;
};

/**
 * Detects animation in GIF, WebP and PNG (APNG) files by inspecting their container
 * structure. Unknown or unreadable files are reported as not animated.
 */
export const isAnimatedImage = async (file: Blob): Promise<boolean> => {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (startsWith(bytes, GIF_SIGNATURE)) return isAnimatedGif(bytes);
    if (readFourCC(bytes, 0) === 'RIFF' && readFourCC(bytes, 8) === 'WEBP') {
      return isAnimatedWebP(bytes);
    }
    if (startsWith(bytes, PNG_SIGNATURE)) return isAnimatedPng(bytes);
    return false;
  } catch {
    return false;
  }
};
