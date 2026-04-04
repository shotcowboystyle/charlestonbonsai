import { put } from '@vercel/blob'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const file = formData.find(item => item.name === 'file')

  if (!file || !file.data || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file' })
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
