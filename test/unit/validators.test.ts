import { describe, expect, it } from 'vitest'
import {
  asBoundedInt,
  asOptionalSmallInt,
  asPartySize,
  asString,
  EMAIL_PATTERN,
  isValidDateString,
  isValidEmail,
  MAX_EMAIL_LENGTH,
} from '~/server/utils/validators'

describe('EMAIL_PATTERN', () => {
  it('accepts ordinary addresses', () => {
    for (const email of [
      'a@b.co',
      'curt.blanton@gmail.com',
      'first+tag@sub.domain.org',
      'UPPER@EXAMPLE.COM',
    ])
      expect(EMAIL_PATTERN.test(email), email).toBe(true)
  })

  it('rejects malformed addresses', () => {
    for (const email of [
      '',
      'no-at-sign',
      '@no-local.com',
      'no-domain@',
      'no-tld@example',
      'spaces in@example.com',
      'trailing@space.com ',
      'two@@example.com',
    ])
      expect(EMAIL_PATTERN.test(email), email).toBe(false)
  })

  // Known gap, documented rather than fixed: the first character after `@` is
  // matched by [^\s@], which permits a leading dot. Harmless in practice — the
  // confirmation email is what actually proves an address — but pinned so a
  // future tightening of the pattern is a deliberate change, not a surprise.
  it('accepts a domain with a leading dot', () => {
    expect(EMAIL_PATTERN.test('dot@.example.com')).toBe(true)
  })

  it('has no global flag, so repeated tests do not alternate', () => {
    // A /g regex carries lastIndex between .test() calls — a classic bug when
    // a shared pattern is reused across requests.
    expect(EMAIL_PATTERN.global).toBe(false)
    expect(EMAIL_PATTERN.test('a@b.co')).toBe(true)
    expect(EMAIL_PATTERN.test('a@b.co')).toBe(true)
  })
})

describe('isValidEmail', () => {
  it('accepts a well-formed address', () => {
    expect(isValidEmail('curt.blanton@gmail.com')).toBe(true)
  })

  it('rejects non-strings', () => {
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail(42)).toBe(false)
    expect(isValidEmail(['a@b.co'])).toBe(false)
  })

  it('rejects an address longer than the column allows', () => {
    const tooLong = `${'a'.repeat(MAX_EMAIL_LENGTH)}@example.com`
    expect(tooLong.length).toBeGreaterThan(MAX_EMAIL_LENGTH)
    expect(isValidEmail(tooLong)).toBe(false)
  })

  it('accepts an address exactly at the length limit', () => {
    const local = 'a'.repeat(MAX_EMAIL_LENGTH - '@example.com'.length)
    const atLimit = `${local}@example.com`
    expect(atLimit).toHaveLength(MAX_EMAIL_LENGTH)
    expect(isValidEmail(atLimit)).toBe(true)
  })
})

describe('asString', () => {
  it('trims surrounding whitespace', () => {
    expect(asString('  Windswept Juniper  ', 120)).toBe('Windswept Juniper')
  })

  it('rejects a value that is only whitespace', () => {
    expect(asString('   ', 120)).toBeNull()
  })

  it('rejects an empty string', () => {
    expect(asString('', 120)).toBeNull()
  })

  it('rejects non-strings', () => {
    expect(asString(undefined, 120)).toBeNull()
    expect(asString(null, 120)).toBeNull()
    expect(asString(5, 120)).toBeNull()
  })

  it('rejects a value over the maximum length', () => {
    expect(asString('a'.repeat(121), 120)).toBeNull()
  })

  it('accepts a value exactly at the maximum length', () => {
    expect(asString('a'.repeat(120), 120)).toHaveLength(120)
  })

  // Length is measured after trimming, so padding does not push a valid value
  // over the limit.
  it('measures length after trimming', () => {
    expect(asString(`  ${'a'.repeat(120)}  `, 120)).toHaveLength(120)
  })
})

describe('asBoundedInt', () => {
  it('accepts an integer inside the range', () => {
    expect(asBoundedInt(5, 1, 10)).toBe(5)
  })

  it('accepts a numeric string', () => {
    expect(asBoundedInt('5', 1, 10)).toBe(5)
  })

  it('accepts both range boundaries', () => {
    expect(asBoundedInt(1, 1, 10)).toBe(1)
    expect(asBoundedInt(10, 1, 10)).toBe(10)
  })

  it('rejects values outside the range', () => {
    expect(asBoundedInt(0, 1, 10)).toBeNull()
    expect(asBoundedInt(11, 1, 10)).toBeNull()
  })

  it('treats empty, null, and undefined as not supplied', () => {
    expect(asBoundedInt('', 1, 10)).toBeNull()
    expect(asBoundedInt(null, 1, 10)).toBeNull()
    expect(asBoundedInt(undefined, 1, 10)).toBeNull()
  })

  it('rejects non-integers and non-finite values', () => {
    expect(asBoundedInt(2.5, 1, 10)).toBeNull()
    expect(asBoundedInt('abc', 1, 10)).toBeNull()
    expect(asBoundedInt(Number.NaN, 1, 10)).toBeNull()
    expect(asBoundedInt(Number.POSITIVE_INFINITY, 1, 10)).toBeNull()
  })
})

describe('asOptionalSmallInt', () => {
  it('accepts a realistic headcount', () => {
    expect(asOptionalSmallInt(120)).toBe(120)
  })

  it('caps at 5000 and floors at 1', () => {
    expect(asOptionalSmallInt(5000)).toBe(5000)
    expect(asOptionalSmallInt(5001)).toBeNull()
    expect(asOptionalSmallInt(0)).toBeNull()
    expect(asOptionalSmallInt(-1)).toBeNull()
  })
})

describe('asPartySize', () => {
  it('accepts a party of one through six', () => {
    for (const size of [1, 2, 3, 4, 5, 6])
      expect(asPartySize(size), String(size)).toBe(size)
  })

  it('rejects a party of seven or more', () => {
    expect(asPartySize(7)).toBeNull()
  })

  it('rejects a party of zero', () => {
    expect(asPartySize(0)).toBeNull()
  })
})

describe('isValidDateString', () => {
  it('accepts the YYYY-MM-DD form an <input type="date"> emits', () => {
    expect(isValidDateString('2026-06-15')).toBe(true)
  })

  it('accepts a leap day in a leap year', () => {
    expect(isValidDateString('2028-02-29')).toBe(true)
  })

  it('rejects other date formats', () => {
    expect(isValidDateString('06/15/2026')).toBe(false)
    expect(isValidDateString('2026-6-15')).toBe(false)
    expect(isValidDateString('2026-06-15T10:00:00Z')).toBe(false)
  })

  it('rejects non-strings and empty input', () => {
    expect(isValidDateString(undefined)).toBe(false)
    expect(isValidDateString(null)).toBe(false)
    expect(isValidDateString(20260615)).toBe(false)
    expect(isValidDateString('')).toBe(false)
  })

  it('rejects an impossible month', () => {
    expect(isValidDateString('2026-13-01')).toBe(false)
  })

  // Documents a real gap: the shape is right and Date accepts it by rolling
  // over to March 1, so an impossible day passes. Tighten here if it matters.
  it('accepts an out-of-range day that Date silently rolls over', () => {
    expect(isValidDateString('2026-02-30')).toBe(true)
  })
})
