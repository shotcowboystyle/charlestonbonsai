/**
 * Valuation model behind the admin pricing drawer.
 *
 * Kept as a plain module rather than a `computed` inside the component so the
 * arithmetic can be tested directly — it is the only place in the app where a
 * wrong number turns into a wrong price on a listing.
 */

export type Rarity = 'premium' | 'moderate' | 'common' | 'varies'

export interface SpeciesInfo {
  name: string
  multiplier: number
  rarity: Rarity
  note: string
}

export const SPECIES: Record<string, SpeciesInfo> = {
  'juniper-shimpaku': {
    name: 'Shimpaku Juniper',
    multiplier: 1.6,
    rarity: 'premium',
    note: 'Highly prized for fine foliage and natural jin/shari. Itoigawa variety commands top prices.',
  },
  'juniper-procumbens': {
    name: 'Juniper Procumbens Nana',
    multiplier: 1.0,
    rarity: 'common',
    note: 'Most popular beginner species. Widely available and forgiving. Good starter stock.',
  },
  'juniper-rocky-mountain': {
    name: 'Rocky Mountain Juniper',
    multiplier: 1.3,
    rarity: 'moderate',
    note: 'Excellent collected (yamadori) material with dramatic deadwood and trunk character.',
  },
  'japanese-maple': {
    name: 'Japanese Maple',
    multiplier: 1.5,
    rarity: 'premium',
    note: 'Prized for seasonal color changes. Delicate ramification adds significant value.',
  },
  'black-pine': {
    name: 'Japanese Black Pine',
    multiplier: 1.7,
    rarity: 'premium',
    note: 'Classic bonsai species. Thick bark and powerful character. Slow development adds value.',
  },
  'chinese-elm': {
    name: 'Chinese Elm',
    multiplier: 0.9,
    rarity: 'common',
    note: 'Hardy and forgiving. Excellent ramification potential. Abundant availability keeps prices accessible.',
  },
  'ficus': {
    name: 'Ficus (Tropical)',
    multiplier: 0.8,
    rarity: 'common',
    note: 'Popular indoor species. Easy to grow and style. Mass production reduces premium potential.',
  },
  'azalea-satsuki': {
    name: 'Satsuki Azalea',
    multiplier: 1.4,
    rarity: 'moderate',
    note: 'Spectacular flowering adds value. Japanese cultivars command premium prices.',
  },
  'trident-maple': {
    name: 'Trident Maple',
    multiplier: 1.3,
    rarity: 'moderate',
    note: 'Excellent nebari development and fall color. Fusion plantings popular.',
  },
  'white-pine': {
    name: 'Japanese White Pine',
    multiplier: 1.8,
    rarity: 'premium',
    note: 'The aristocrat of bonsai. Slow growth, blue-green needles. Grafted varieties especially valued.',
  },
  'bald-cypress': {
    name: 'Bald Cypress',
    multiplier: 1.1,
    rarity: 'moderate',
    note: 'Unique deciduous conifer. Buttressed trunk and fine ramification. Growing in popularity.',
  },
  'other': {
    name: 'Other / Mixed Species',
    multiplier: 1.0,
    rarity: 'varies',
    note: 'Pricing varies widely by species rarity and regional demand.',
  },
}

export const POT_FACTORS = {
  basic: { low: 5, high: 20, label: 'Basic plastic/mica' },
  mid: { low: 20, high: 60, label: 'Mid-range ceramic' },
  handmade: { low: 60, high: 150, label: 'Handmade artisan' },
  signed: { low: 150, high: 500, label: 'Signed/collectible' },
} as const

export const STYLING_MULTIPLIERS = {
  raw: { factor: 0.6, label: 'Raw / unstyled' },
  developing: { factor: 0.85, label: 'Developing' },
  refined: { factor: 1.15, label: 'Refined' },
  exhibition: { factor: 1.5, label: 'Exhibition-ready' },
} as const

export const DEFAULT_SPECIES_KEY = 'juniper-shimpaku'

// Fallbacks for an unrecognised key. The maps always contain the UI's own
// values, but the inputs are plain strings, so TypeScript cannot prove it.
const DEFAULT_SPECIES: SpeciesInfo = SPECIES[DEFAULT_SPECIES_KEY]!
const DEFAULT_POT = POT_FACTORS.mid
const DEFAULT_STYLING = STYLING_MULTIPLIERS.refined

/** Minimum plausible sale price, in dollars, for the low and high bounds. */
const MIN_LOW = 5
const MIN_HIGH = 10

export type PriceTier = 'starter' | 'enthusiast' | 'advanced' | 'showcase'

export const TIER_LABELS: Record<PriceTier, string> = {
  starter: 'Starter / Gift',
  enthusiast: 'Enthusiast',
  advanced: 'Advanced',
  showcase: 'Showcase',
}

export interface PricingInput {
  species: string
  /** Years in training. */
  age: number
  /** Overall height in inches. */
  height: number
  potQuality: string
  stylingLevel: string
}

export interface BreakdownEntry {
  label: string
  value: number
  color: string
}

export interface PricingResult {
  low: number
  high: number
  tier: PriceTier
  tierLabel: string
  breakdown: BreakdownEntry[]
  speciesNote: string
}

/** Dollars of value per year in training, banded by species rarity. */
export function basePerYearFor(rarity: Rarity): { low: number, high: number } {
  switch (rarity) {
    case 'premium':
      return { low: 25, high: 50 }
    case 'moderate':
      return { low: 20, high: 35 }
    default:
      return { low: 15, high: 25 }
  }
}

/** Height in inches to a value multiplier. Bounds are inclusive upper edges. */
export function sizeFactorFor(height: number): number {
  if (height <= 6)
    return 0.7
  if (height <= 12)
    return 0.9
  if (height <= 24)
    return 1.0
  if (height <= 36)
    return 1.2
  return 1.5
}

/** Market tier from the midpoint of the estimated range. */
export function tierFor(midPrice: number): PriceTier {
  if (midPrice < 60)
    return 'starter'
  if (midPrice < 250)
    return 'enthusiast'
  if (midPrice < 800)
    return 'advanced'
  return 'showcase'
}

export function calculatePricing(input: PricingInput): PricingResult {
  const { species, age, height, potQuality, stylingLevel } = input

  const sp = SPECIES[species] ?? DEFAULT_SPECIES
  const pot = POT_FACTORS[potQuality as keyof typeof POT_FACTORS] ?? DEFAULT_POT
  const styling = STYLING_MULTIPLIERS[stylingLevel as keyof typeof STYLING_MULTIPLIERS] ?? DEFAULT_STYLING

  const basePerYear = basePerYearFor(sp.rarity)
  const baseValueLow = age * basePerYear.low
  const baseValueHigh = age * basePerYear.high
  const sizeFactor = sizeFactorFor(height)

  const treeLow = baseValueLow * sizeFactor * sp.multiplier * styling.factor
  const treeHigh = baseValueHigh * sizeFactor * sp.multiplier * styling.factor

  const low = Math.max(Math.round(treeLow + pot.low), MIN_LOW)
  const high = Math.max(Math.round(treeHigh + pot.high), MIN_HIGH)

  const tier = tierFor((low + high) / 2)

  // Contributions are presentational: each shows how far one input moves the
  // midpoint away from the age-only baseline. They do not sum to `low`/`high`.
  const ageContribution = (baseValueLow + baseValueHigh) / 2

  return {
    low,
    high,
    tier,
    tierLabel: TIER_LABELS[tier],
    breakdown: [
      { label: `Age (${age} yrs)`, value: ageContribution, color: 'bg-forest' },
      { label: `Species (${sp.name})`, value: ageContribution * (sp.multiplier - 1), color: 'bg-bark' },
      { label: `Size (${height}")`, value: ageContribution * (sizeFactor - 1), color: 'bg-sage' },
      { label: `Styling (${styling.label})`, value: ageContribution * (styling.factor - 1), color: 'bg-moss' },
      { label: `Pot (${pot.label})`, value: (pot.low + pot.high) / 2, color: 'bg-stone' },
    ],
    speciesNote: sp.note,
  }
}

/** The price the "apply midpoint" action writes to the listing. */
export function midpointPrice(result: Pick<PricingResult, 'low' | 'high'>): number {
  return Math.round((result.low + result.high) / 2)
}
