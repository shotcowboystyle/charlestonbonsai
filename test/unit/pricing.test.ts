import { describe, expect, it } from 'vitest'
import {
  basePerYearFor,
  calculatePricing,
  DEFAULT_SPECIES_KEY,
  midpointPrice,
  POT_FACTORS,
  sizeFactorFor,
  SPECIES,
  STYLING_MULTIPLIERS,
  TIER_LABELS,
  tierFor,
} from '~/utils/pricing'

const baseInput = {
  species: 'juniper-shimpaku',
  age: 5,
  height: 18,
  potQuality: 'mid',
  stylingLevel: 'refined',
}

describe('basePerYearFor', () => {
  it('bands dollars-per-year by rarity', () => {
    expect(basePerYearFor('premium')).toEqual({ low: 25, high: 50 })
    expect(basePerYearFor('moderate')).toEqual({ low: 20, high: 35 })
    expect(basePerYearFor('common')).toEqual({ low: 15, high: 25 })
  })

  it('treats "varies" as the common band', () => {
    expect(basePerYearFor('varies')).toEqual({ low: 15, high: 25 })
  })
})

describe('sizeFactorFor', () => {
  // The bounds are inclusive upper edges, so each boundary belongs to the
  // band below it. Off-by-one here silently shifts every price in a band.
  it('places each boundary height in the lower band', () => {
    expect(sizeFactorFor(6)).toBe(0.7)
    expect(sizeFactorFor(12)).toBe(0.9)
    expect(sizeFactorFor(24)).toBe(1.0)
    expect(sizeFactorFor(36)).toBe(1.2)
  })

  it('moves to the next band one inch above each boundary', () => {
    expect(sizeFactorFor(7)).toBe(0.9)
    expect(sizeFactorFor(13)).toBe(1.0)
    expect(sizeFactorFor(25)).toBe(1.2)
    expect(sizeFactorFor(37)).toBe(1.5)
  })

  it('increases monotonically with height', () => {
    const heights = [1, 6, 7, 12, 13, 24, 25, 36, 37, 100]
    const factors = heights.map(sizeFactorFor)
    expect(factors).toEqual([...factors].sort((a, b) => a - b))
  })
})

describe('tierFor', () => {
  it('assigns tiers by midpoint price', () => {
    expect(tierFor(0)).toBe('starter')
    expect(tierFor(59)).toBe('starter')
    expect(tierFor(60)).toBe('enthusiast')
    expect(tierFor(249)).toBe('enthusiast')
    expect(tierFor(250)).toBe('advanced')
    expect(tierFor(799)).toBe('advanced')
    expect(tierFor(800)).toBe('showcase')
    expect(tierFor(100_000)).toBe('showcase')
  })

  it('has a label for every tier it can return', () => {
    for (const mid of [0, 100, 500, 5000])
      expect(TIER_LABELS[tierFor(mid)]).toBeTruthy()
  })
})

describe('calculatePricing', () => {
  it('computes the documented worked example', () => {
    // 5 yrs x $25-50 (premium) x 1.0 size (18") x 1.6 shimpaku x 1.15 refined
    //   low : 125 * 1.0 * 1.6 * 1.15 = 230, + $20 mid pot  = 250
    //   high: 250 * 1.0 * 1.6 * 1.15 = 460, + $60 mid pot  = 520
    const result = calculatePricing(baseInput)

    expect(result.low).toBe(250)
    expect(result.high).toBe(520)
    expect(result.tier).toBe('advanced')
    expect(result.tierLabel).toBe('Advanced')
  })

  it('always produces a low bound at or below the high bound', () => {
    for (const species of Object.keys(SPECIES)) {
      for (const potQuality of Object.keys(POT_FACTORS)) {
        for (const stylingLevel of Object.keys(STYLING_MULTIPLIERS)) {
          const result = calculatePricing({ species, age: 10, height: 20, potQuality, stylingLevel })
          expect(result.low).toBeLessThanOrEqual(result.high)
        }
      }
    }
  })

  it('returns whole dollars', () => {
    const result = calculatePricing({ ...baseInput, age: 7, height: 15 })

    expect(Number.isInteger(result.low)).toBe(true)
    expect(Number.isInteger(result.high)).toBe(true)
  })

  it('floors a zero-age specimen at the minimum plausible price', () => {
    // Age 0 zeroes the tree value entirely; only the pot contributes.
    const result = calculatePricing({ ...baseInput, age: 0 })

    expect(result.low).toBeGreaterThanOrEqual(5)
    expect(result.high).toBeGreaterThanOrEqual(10)
  })

  it('never returns a price below the floor for any input', () => {
    const result = calculatePricing({
      species: 'ficus',
      age: 0,
      height: 1,
      potQuality: 'basic',
      stylingLevel: 'raw',
    })

    expect(result.low).toBeGreaterThanOrEqual(5)
    expect(result.high).toBeGreaterThanOrEqual(10)
  })

  it('prices a rarer species above a common one, all else equal', () => {
    const rare = calculatePricing({ ...baseInput, species: 'white-pine' })
    const common = calculatePricing({ ...baseInput, species: 'ficus' })

    expect(rare.low).toBeGreaterThan(common.low)
    expect(rare.high).toBeGreaterThan(common.high)
  })

  it('prices exhibition styling above raw, all else equal', () => {
    const exhibition = calculatePricing({ ...baseInput, stylingLevel: 'exhibition' })
    const raw = calculatePricing({ ...baseInput, stylingLevel: 'raw' })

    expect(exhibition.low).toBeGreaterThan(raw.low)
  })

  it('adds pot value on top of tree value', () => {
    const signed = calculatePricing({ ...baseInput, potQuality: 'signed' })
    const basic = calculatePricing({ ...baseInput, potQuality: 'basic' })

    expect(signed.low - basic.low).toBe(POT_FACTORS.signed.low - POT_FACTORS.basic.low)
  })

  it('scales linearly with age', () => {
    const ten = calculatePricing({ ...baseInput, age: 10 })
    const five = calculatePricing({ ...baseInput, age: 5 })

    // Pot value is a flat addend, so it cancels out of the difference.
    expect(ten.low - POT_FACTORS.mid.low).toBe((five.low - POT_FACTORS.mid.low) * 2)
  })

  it('falls back to the default species for an unknown key', () => {
    const unknown = calculatePricing({ ...baseInput, species: 'no-such-species' })
    const fallback = calculatePricing({ ...baseInput, species: DEFAULT_SPECIES_KEY })

    expect(unknown.low).toBe(fallback.low)
    expect(unknown.high).toBe(fallback.high)
  })

  it('falls back to the mid pot and refined styling for unknown keys', () => {
    const unknown = calculatePricing({ ...baseInput, potQuality: 'gold', stylingLevel: 'perfect' })
    const fallback = calculatePricing({ ...baseInput, potQuality: 'mid', stylingLevel: 'refined' })

    expect(unknown).toEqual(fallback)
  })

  it('returns a five-row breakdown covering every input', () => {
    const labels = calculatePricing(baseInput).breakdown.map(entry => entry.label)

    expect(labels).toHaveLength(5)
    expect(labels[0]).toContain('Age (5 yrs)')
    expect(labels[1]).toContain('Shimpaku Juniper')
    expect(labels[2]).toContain('18"')
    expect(labels[3]).toContain('Refined')
    expect(labels[4]).toContain('Mid-range ceramic')
  })

  it('gives a zero contribution for a factor of exactly 1', () => {
    // Procumbens has multiplier 1.0, so it should move the estimate not at all.
    const result = calculatePricing({ ...baseInput, species: 'juniper-procumbens' })
    const speciesRow = result.breakdown[1]

    expect(speciesRow?.value).toBe(0)
  })

  it('surfaces the species note for the buyer-facing rationale', () => {
    expect(calculatePricing(baseInput).speciesNote).toContain('Itoigawa')
  })
})

describe('midpointPrice', () => {
  it('rounds the midpoint of the range', () => {
    expect(midpointPrice({ low: 250, high: 520 })).toBe(385)
  })

  it('rounds a half-dollar midpoint up', () => {
    expect(midpointPrice({ low: 100, high: 101 })).toBe(101)
  })

  it('returns the exact value when low and high match', () => {
    expect(midpointPrice({ low: 300, high: 300 })).toBe(300)
  })

  it('lands inside the estimated range', () => {
    const result = calculatePricing(baseInput)
    const mid = midpointPrice(result)

    expect(mid).toBeGreaterThanOrEqual(result.low)
    expect(mid).toBeLessThanOrEqual(result.high)
  })
})

describe('SPECIES catalogue', () => {
  it('includes the default species key', () => {
    expect(SPECIES[DEFAULT_SPECIES_KEY]).toBeDefined()
  })

  it('gives every species a positive multiplier and a note', () => {
    for (const [key, info] of Object.entries(SPECIES)) {
      expect(info.multiplier, `${key} multiplier`).toBeGreaterThan(0)
      expect(info.note, `${key} note`).toBeTruthy()
      expect(info.name, `${key} name`).toBeTruthy()
    }
  })

  it('orders pot tiers by ascending value', () => {
    const lows = Object.values(POT_FACTORS).map(pot => pot.low)
    expect(lows).toEqual([...lows].sort((a, b) => a - b))
  })

  it('orders styling tiers by ascending factor', () => {
    const factors = Object.values(STYLING_MULTIPLIERS).map(styling => styling.factor)
    expect(factors).toEqual([...factors].sort((a, b) => a - b))
  })
})
