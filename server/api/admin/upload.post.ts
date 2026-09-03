import { put } from '@vercel/blob'

/** Image formats the gallery renders, plus the glTF models the 3D viewer loads. */
const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'avif',
  'gif',
  'svg',
  'glb',
  'gltf',
])

/**
 * Matches the largest limit the admin forms enforce client-side
 * (MAX_MODEL_SIZE, 50MB — images are capped at 10MB there). This is the
 * server-side backstop for a caller that skips the form.
 */
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export default defineEventHandler(async (event) => {
  // This endpoint writes to public Vercel Blob storage. Without this guard it
  // was the one route under /api/admin that anyone on the internet could call.
  requireAdmin(event)

  // Reject on the declared length first: readMultipartFormData buffers and
  // parses the whole request, so without this a huge body is fully processed
  // before the size check below can reject it.
  const declaredLength = Number(getHeader(event, 'content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File is too large' })
  }

  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const file = formData.find(item => item.name === 'file')

  if (!file || !file.data || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file' })
  }

  if (file.data.length > MAX_UPLOAD_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File is too large' })
  }

  const extension = file.filename.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported file type' })
  }

  try {
    // Upload to Vercel Blob
    const blob = await put(file.filename, file.data, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return {
      url: blob.url,
      pathname: blob.pathname,
    }
  }
  catch (error: any) {
    console.error('Vercel Blob upload error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Upload to Blob failed' })
  }
})
