import { describe, expect, it } from 'vitest'
import { createRng, hashString, seedFor } from '~/lib/studio/bonsai/rng'
import { sizeHeightM, sizeRangeLabel, SIZES } from '~/lib/studio/bonsai/sizes'

describe('seeded rng', () => {
  it('repeats exactly for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const xs = Array.from({ length: 50 }, () => a.next())
    expect(Array.from({ length: 50 }, () => b.next())).toEqual(xs)
    expect(new Set(xs).size).toBe(50)
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('seeds from style|species|size so combinations are stable and distinct', () => {
    expect(seedFor('chokkan', 'elm', 'mame')).toBe(hashString('chokkan|elm|mame'))
    expect(seedFor('chokkan', 'elm', 'mame')).not.toBe(seedFor('chokkan', 'elm', 'shohin'))
  })

  it('forks independent streams', () => {
    const r = createRng(7)
    expect(r.fork('a').next()).toBe(createRng(7).fork('a').next())
    expect(r.fork('a').next()).not.toBe(r.fork('b').next())
  })
})

describe('size classes', () => {
  it('has ten classes from Keshitsubo to Imperial', () => {
    expect(SIZES.map(s => s.id)).toEqual(['keshitsubo', 'shito', 'mame', 'shohin', 'komono', 'katade-mochi', 'chumono', 'omono', 'hachi-uye', 'imperial'])
  })

  it('uses the midpoint of each range in metres', () => {
    expect(sizeHeightM('keshitsubo')).toBeCloseTo(0.055)
    expect(sizeHeightM('shohin')).toBeCloseTo(0.165)
    expect(sizeHeightM('imperial')).toBeCloseTo(1.775)
    expect(sizeRangeLabel('mame')).toBe('5–15 cm')
  })

  it('grows ramification depth with size', () => {
    for (let i = 1; i < SIZES.length; i++) expect(SIZES[i]!.ramification).toBeGreaterThanOrEqual(SIZES[i - 1]!.ramification)
  })
})
