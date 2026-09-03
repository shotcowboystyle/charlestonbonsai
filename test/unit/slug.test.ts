import { describe, expect, it } from 'vitest'
import { generateSlug } from '~/utils/slug'

describe('generateSlug', () => {
  it('lowercases and hyphenates a specimen name', () => {
    expect(generateSlug('Windswept Juniper')).toBe('windswept-juniper')
  })

  it('collapses runs of punctuation and whitespace into one hyphen', () => {
    expect(generateSlug('Trident  Maple --- Forest')).toBe('trident-maple-forest')
  })

  it('strips leading and trailing hyphens', () => {
    expect(generateSlug('  Shimpaku!  ')).toBe('shimpaku')
    expect(generateSlug('---Pine---')).toBe('pine')
  })

  it('keeps digits', () => {
    expect(generateSlug('Juniper No. 7')).toBe('juniper-no-7')
  })

  it('produces a URL-safe slug for every input it accepts', () => {
    for (const name of ['Windswept Juniper', 'Ficus & Co.', 'Pine #2', '  spaced  '])
      expect(generateSlug(name), name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('is idempotent — slugging a slug changes nothing', () => {
    const slug = generateSlug('Windswept Juniper')
    expect(generateSlug(slug)).toBe(slug)
  })

  it('returns an empty string when nothing survives', () => {
    expect(generateSlug('!!!')).toBe('')
    expect(generateSlug('')).toBe('')
  })

  // Known limits, documented rather than fixed. Changing either behaviour would
  // change existing specimen URLs, so treat these as a deliberate contract.
  it('drops accented characters instead of transliterating them', () => {
    expect(generateSlug('Ficus Café')).toBe('ficus-caf')
  })

  it('drops non-Latin scripts entirely', () => {
    expect(generateSlug('真柏')).toBe('')
  })

  it('does not deduplicate — two identical names yield the same slug', () => {
    expect(generateSlug('Black Pine')).toBe(generateSlug('black pine'))
  })
})
