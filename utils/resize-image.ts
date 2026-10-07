/**
 * Scale `width`×`height` to fit inside a `max`×`max` box, keeping the aspect
 * ratio. Never upscales.
 */
export function fitWithin(width: number, height: number, max: number): { width: number, height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Downscale a photo in the browser before upload so catalog thumbnails aren't
 * the full 3–5 MB phone original. Re-encodes as WebP; SVG and GIF pass through
 * untouched (vector / animation would be lost), as does anything the
 * re-encode fails to shrink.
 */
export async function resizeImage(file: File, max = 1200, quality = 0.82): Promise<File> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif')
    return file

  const bitmap = await createImageBitmap(file)
  const { width, height } = fitWithin(bitmap.width, bitmap.height, max)
  const canvas = new OffscreenCanvas(width, height)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality })
  if (blob.size >= file.size)
    return file

  const basename = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${basename}.webp`, { type: 'image/webp' })
}
