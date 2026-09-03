import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import {
  generateResetToken,
  hashPassword,
  hashToken,
  isTokenExpired,
  verifyPassword,
} from '~/server/utils/tokens'

describe('generateResetToken', () => {
  it('returns 64 lowercase hex characters (32 random bytes)', () => {
    expect(generateResetToken()).toMatch(/^[0-9a-f]{64}$/)
  })

  it('does not repeat across calls', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateResetToken()))
    expect(tokens.size).toBe(100)
  })
})

describe('hashToken', () => {
  it('matches a known sha256 vector', () => {
    // Golden vector: sha256('abc') per FIPS 180-4.
    expect(hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('is deterministic for the same input', () => {
    const token = generateResetToken()
    expect(hashToken(token)).toBe(hashToken(token))
  })

  it('agrees with node crypto for a generated token', () => {
    const token = generateResetToken()
    const expected = createHash('sha256').update(token).digest('hex')
    expect(hashToken(token)).toBe(expected)
  })

  it('produces a different hash for a one-character change', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'))
  })
})

describe('isTokenExpired', () => {
  it('is true for a past timestamp', () => {
    expect(isTokenExpired(new Date(Date.now() - 1000))).toBe(true)
  })

  it('is false for a future timestamp', () => {
    expect(isTokenExpired(new Date(Date.now() + 60_000))).toBe(false)
  })

  it('accepts an ISO string, matching what Supabase returns', () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    const future = new Date(Date.now() + 60_000).toISOString()
    expect(isTokenExpired(past)).toBe(true)
    expect(isTokenExpired(future)).toBe(false)
  })

  it('treats the exact expiry instant as not yet expired', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    // `new Date(expiresAt) < new Date()` is strict, so equal timestamps pass.
    expect(isTokenExpired(now)).toBe(false)
    vi.useRealTimers()
  })

  it('returns false for an unparseable date — an invalid Date compares false', () => {
    // Documents current behaviour, which is fail-OPEN: a corrupt expires_at
    // column would let a reset token through rather than rejecting it.
    expect(isTokenExpired('not-a-date')).toBe(false)
  })
})

describe('password hashing', () => {
  it('round-trips a password through hash and verify', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('wrong password', hash)).toBe(false)
  })

  it('produces a bcrypt hash at cost factor 10', async () => {
    const hash = await hashPassword('whatever')
    expect(hash).toMatch(/^\$2[aby]\$10\$/)
  })

  it('salts, so the same password hashes differently each time', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')])
    expect(a).not.toBe(b)
  })

  it('returns false rather than throwing on a malformed hash', async () => {
    expect(await verifyPassword('password', 'not-a-bcrypt-hash')).toBe(false)
  })
})
