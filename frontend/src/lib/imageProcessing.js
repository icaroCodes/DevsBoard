/**
 * Client-side image normalization for avatar uploads.
 *
 * The backend writes whatever bytes the frontend sends to Supabase Storage,
 * with the content-type derived from the data URL prefix. That breaks for
 * iPhones: photos come out as HEIC (`data:image/heic;base64,…`), which
 *   - Supabase Storage may reject if the bucket doesn't allow it; and
 *   - Chrome / Firefox / Edge cannot render even if the upload succeeds.
 *
 * Fix: decode the file via an <img> (Safari iOS handles HEIC natively here),
 * draw it onto a canvas, and re-encode as JPEG. After this the rest of the
 * pipeline never sees HEIC. As a side effect we also cap the resolution and
 * compress, which keeps avatar payloads small (~50–150 KB).
 *
 * Runs entirely in the browser. Returns a data URL the existing Settings
 * code already knows how to send.
 */

const DEFAULT_OPTS = {
  maxSide: 512,
  mimeType: 'image/jpeg',
  quality: 0.9,
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_decode_failed'));
    img.src = src;
  });

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('file_read_failed'));
    reader.readAsDataURL(file);
  });

/**
 * Normalize an image File for upload as an avatar.
 *
 * @param {File} file
 * @param {{ maxSide?: number, mimeType?: string, quality?: number }} [opts]
 * @returns {Promise<string>} JPEG data URL ready to send as `avatar_base64`.
 */
export async function processAvatar(file, opts = {}) {
  if (!file) throw new Error('no_file');
  const { maxSide, mimeType, quality } = { ...DEFAULT_OPTS, ...opts };

  // Read first, then decode. We can't use createObjectURL for HEIC reliably
  // on every Safari version — the FileReader path works in more contexts.
  const dataUrl = await readAsDataUrl(file);
  let img;
  try {
    img = await loadImage(dataUrl);
  } catch (err) {
    // If <img> can't decode it, the platform doesn't support this format.
    // Most likely a HEIC opened on a non-Safari browser. Surface a clear
    // error so the UI can prompt the user instead of silently failing.
    const e = new Error('unsupported_image_format');
    e.cause = err;
    throw e;
  }

  const { width, height } = img;
  if (!width || !height) throw new Error('image_decode_failed');

  // Square crop centered. Avatars look bad otherwise.
  const side = Math.min(width, height);
  const sx = Math.floor((width - side) / 2);
  const sy = Math.floor((height - side) / 2);

  const targetSide = Math.min(maxSide, side);
  const canvas = document.createElement('canvas');
  canvas.width = targetSide;
  canvas.height = targetSide;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  ctx.drawImage(img, sx, sy, side, side, 0, 0, targetSide, targetSide);

  const result = canvas.toDataURL(mimeType, quality);
  if (!result || !result.startsWith('data:')) {
    throw new Error('encode_failed');
  }
  return result;
}
