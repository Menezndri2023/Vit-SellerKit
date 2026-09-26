import 'server-only';

export const MAX_LOGO_BYTES = 200 * 1024;

/** Detects the real image type from the first bytes (never trust the file name or the browser's type). */
/** PNG and JPEG only: both the web page and the PDF generator support them. */
export function sniffImage(bytes: Uint8Array): 'image/png' | 'image/jpeg' | null {
  const b = bytes;
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  return null;
}
