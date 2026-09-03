import { Buffer } from 'node:buffer'
import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { testRuntimeConfig } from '../setup/nitro-globals'
import { createTestEvent } from '../utils/event'

const blob = vi.hoisted(() => ({ put: vi.fn() }))

vi.mock('@vercel/blob', () => ({ put: blob.put }))

const { default: upload } = await import('~/server/api/admin/upload.post')

function authorization() {
  const token = jwt.sign({ id: 'admin-1', email: 'admin@example.test' }, testRuntimeConfig.jwtSecret)
  return `Bearer ${token}`
}

/**
 * Build an event whose multipart body h3 will parse. The boundary and CRLF
 * framing matter — h3 parses the raw buffer, it does not accept a shortcut.
 */
function uploadEvent({
  filename = 'specimen.jpg',
  size = 16,
  authorized = true,
}: { filename?: string, size?: number, authorized?: boolean } = {}) {
  const boundary = '----charlestonbonsaitest'
  const head = Buffer.from(
    `--${boundary}\r\n`
    + `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`
    + `Content-Type: application/octet-stream\r\n\r\n`,
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  const body = Buffer.concat([head, Buffer.alloc(size, 0x41), tail])

  const headers: Record<string, string> = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  }
  if (authorized)
    headers.authorization = authorization()

  const event = createTestEvent({ method: 'POST', path: '/api/admin/upload', headers })
  event._requestBody = body
  return event
}

beforeEach(() => {
  blob.put.mockReset()
  blob.put.mockResolvedValue({ url: 'https://blob.test/specimen.jpg', pathname: 'specimen.jpg' })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/admin/upload', () => {
  // Regression guard: this was the only route under /api/admin with no auth
  // check, so anyone on the internet could write to public Blob storage.
  it('rejects an unauthenticated request', async () => {
    await expect(upload(uploadEvent({ authorized: false })))
      .rejects
      .toMatchObject({ statusCode: 401 })
  })

  it('does not reach Blob storage when unauthenticated', async () => {
    await expect(upload(uploadEvent({ authorized: false }))).rejects.toThrow()

    expect(blob.put).not.toHaveBeenCalled()
  })

  it('rejects a token signed with the wrong secret', async () => {
    const event = uploadEvent({ authorized: false })
    event.node.req.headers.authorization = `Bearer ${jwt.sign({ id: 'x' }, 'wrong-secret')}`

    await expect(upload(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(blob.put).not.toHaveBeenCalled()
  })

  it('uploads an image for an authenticated admin', async () => {
    const result = await upload(uploadEvent())

    expect(blob.put).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      url: 'https://blob.test/specimen.jpg',
      pathname: 'specimen.jpg',
    })
  })

  it('accepts every supported asset extension', async () => {
    for (const filename of ['a.jpg', 'a.jpeg', 'a.png', 'a.webp', 'a.avif', 'a.gif', 'a.svg', 'a.glb', 'a.gltf'])
      await expect(upload(uploadEvent({ filename })), filename).resolves.toBeDefined()
  })

  it('rejects an executable or script filename', async () => {
    for (const filename of ['payload.html', 'payload.js', 'payload.php', 'payload.sh', 'noextension'])
      await expect(upload(uploadEvent({ filename })), filename).rejects.toMatchObject({ statusCode: 415 })
  })

  it('matches the extension case-insensitively', async () => {
    await expect(upload(uploadEvent({ filename: 'SPECIMEN.JPG' }))).resolves.toBeDefined()
  })

  it('rejects a file over the size cap', async () => {
    await expect(upload(uploadEvent({ size: 50 * 1024 * 1024 + 1 })))
      .rejects
      .toMatchObject({ statusCode: 413 })

    expect(blob.put).not.toHaveBeenCalled()
  })

  // The declared length is rejected before the body is buffered and parsed.
  it('rejects an oversized upload from the content-length header alone', async () => {
    const event = uploadEvent()
    event.node.req.headers['content-length'] = String(50 * 1024 * 1024 + 1)

    await expect(upload(event)).rejects.toMatchObject({ statusCode: 413 })
    expect(blob.put).not.toHaveBeenCalled()
  })

  // A lying or absent content-length must not get past the real check.
  it('still rejects an oversized body when content-length understates it', async () => {
    const event = uploadEvent({ size: 50 * 1024 * 1024 + 1 })
    event.node.req.headers['content-length'] = '10'

    await expect(upload(event)).rejects.toMatchObject({ statusCode: 413 })
    expect(blob.put).not.toHaveBeenCalled()
  }, 30_000)

  it('400s when no file part is present', async () => {
    const event = createTestEvent({
      method: 'POST',
      path: '/api/admin/upload',
      headers: {
        'authorization': authorization(),
        'content-type': 'multipart/form-data; boundary=----empty',
      },
    })
    event._requestBody = Buffer.from('------empty--\r\n')

    await expect(upload(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('500s when Blob storage fails', async () => {
    blob.put.mockRejectedValue(new Error('blob is down'))

    await expect(upload(uploadEvent())).rejects.toMatchObject({ statusCode: 500 })
  })
})
