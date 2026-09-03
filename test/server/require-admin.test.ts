import type { H3Error } from 'h3'
import { Buffer } from 'node:buffer'
import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import { requireAdmin } from '~/server/utils/requireAdmin'
import { testRuntimeConfig } from '../setup/nitro-globals'
import { createTestEvent } from '../utils/event'

function bearer(payload: object, options: jwt.SignOptions = {}) {
  return `Bearer ${jwt.sign(payload, testRuntimeConfig.jwtSecret, options)}`
}

function catchH3Error(fn: () => unknown): H3Error {
  try {
    fn()
  }
  catch (error) {
    return error as H3Error
  }
  throw new Error('expected requireAdmin to throw')
}

describe('requireAdmin', () => {
  it('returns the decoded payload for a valid bearer token', () => {
    const event = createTestEvent({
      headers: { authorization: bearer({ id: 'admin-1', email: 'admin@example.test' }) },
    })

    expect(requireAdmin(event)).toMatchObject({
      id: 'admin-1',
      email: 'admin@example.test',
    })
  })

  it('rejects a request with no authorization header', () => {
    const error = catchH3Error(() => requireAdmin(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(error.statusMessage).toContain('Unauthorized')
  })

  it('rejects an empty authorization header', () => {
    const event = createTestEvent({ headers: { authorization: '' } })

    expect(catchH3Error(() => requireAdmin(event)).statusCode).toBe(401)
  })

  it('rejects a non-bearer authorization scheme', () => {
    const event = createTestEvent({ headers: { authorization: 'Basic abc123' } })

    expect(catchH3Error(() => requireAdmin(event)).statusCode).toBe(401)
  })

  it('rejects a bearer prefix with no token', () => {
    const event = createTestEvent({ headers: { authorization: 'Bearer ' } })

    expect(catchH3Error(() => requireAdmin(event)).statusCode).toBe(401)
  })

  it('rejects a token signed with a different secret', () => {
    const event = createTestEvent({
      headers: { authorization: `Bearer ${jwt.sign({ id: 'x' }, 'wrong-secret')}` },
    })

    expect(catchH3Error(() => requireAdmin(event)).statusCode).toBe(401)
  })

  it('rejects a tampered payload', () => {
    const token = jwt.sign({ id: 'admin-1' }, testRuntimeConfig.jwtSecret)
    const [header, , signature] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ id: 'attacker' })).toString('base64url')

    const event = createTestEvent({
      headers: { authorization: `Bearer ${header}.${forged}.${signature}` },
    })

    expect(catchH3Error(() => requireAdmin(event)).statusCode).toBe(401)
  })

  it('rejects an expired token', () => {
    const event = createTestEvent({
      headers: { authorization: bearer({ id: 'admin-1' }, { expiresIn: '-1s' }) },
    })

    expect(catchH3Error(() => requireAdmin(event)).statusCode).toBe(401)
  })

  it('accepts a token that is still within its 7-day window', () => {
    const event = createTestEvent({
      headers: { authorization: bearer({ id: 'admin-1', email: 'a@b.test' }, { expiresIn: '7d' }) },
    })

    expect(requireAdmin(event).id).toBe('admin-1')
  })

  it('reads the header case-insensitively', () => {
    const event = createTestEvent({
      headers: { Authorization: bearer({ id: 'admin-1', email: 'a@b.test' }) },
    })

    expect(requireAdmin(event).id).toBe('admin-1')
  })
})
