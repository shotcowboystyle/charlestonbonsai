/**
 * Species registry: foliage form and colour, bark, seasonal behaviour, wire
 * metal and pot glaze. Pure data — the generator and the shaders read it.
 */

export type SpeciesId
  = | 'japanese-maple' | 'trident-maple' | 'elm' | 'beech' | 'larch'
    | 'juniper' | 'black-pine' | 'white-pine' | 'spruce' | 'cypress'
    | 'ficus' | 'privet' | 'boxwood' | 'azalea' | 'myrtle'
    | 'cherry' | 'plum' | 'crabapple' | 'bougainvillea'
    | 'schefflera' | 'pomegranate'

export type SpeciesGroup = 'Deciduous' | 'Conifers' | 'Broadleaf evergreens' | 'Flowering' | 'Tropical'

export type LeafKind
  = | 'palmate' | 'trilobe' | 'oval' | 'needles' | 'needles5' | 'scale' | 'fan'
    | 'tuft' | 'glossy' | 'compound'

export type BloomKind = 'blossom' | 'bract' | 'flower'

export type BarkKind = 'smooth' | 'plates' | 'fissured' | 'flaky' | 'stringy' | 'mottled'

export interface SpeciesDef {
  id: SpeciesId
  common: string
  latin: string
  jp: string
  group: SpeciesGroup
  /** Seasonal behaviour for 3d-four-seasons. */
  habit: 'deciduous' | 'evergreen'
  conifer: boolean
  leaf: LeafKind
  /** Leaf length in metres on a 0.6 m tree; scaled by size in foliage.ts. */
  leafLen: number
  leafColor: string
  springColor: string
  autumnColor: string
  winterColor: string
  bloom?: { kind: BloomKind, color: string, center: string, amount: number, season: 'spring' | 'winter' | 'summer' }
  fruit?: { color: string, amount: number }
  bark: { kind: BarkKind, color: string, dark: string, scale: number }
  /** Leaves per square metre of pad, before quality caps. */
  density: number
  /** Pad thickness relative to its width: pines are flat clouds, elms domes. */
  padFlat: number
  aerialRoots?: boolean
  wire: 'copper' | 'aluminium'
  /** Pot glaze; null is unglazed clay (traditional for conifers). */
  glaze: string | null
}

const D = 'Deciduous' as const
const C = 'Conifers' as const
const B = 'Broadleaf evergreens' as const
const F = 'Flowering' as const
const T = 'Tropical' as const

export const SPECIES: readonly SpeciesDef[] = [
  { id: 'japanese-maple', common: 'Japanese maple', latin: 'Acer palmatum', jp: '紅葉', group: D, habit: 'deciduous', conifer: false, leaf: 'palmate', leafLen: 0.03, leafColor: '#4f7a2c', springColor: '#8db24a', autumnColor: '#b5231b', winterColor: '#7a4a2a', bark: { kind: 'smooth', color: '#7d7a68', dark: '#4b4a3d', scale: 1 }, density: 2400, padFlat: 0.42, wire: 'aluminium', glaze: '#3d5a6e' },
  { id: 'trident-maple', common: 'Trident maple', latin: 'Acer buergerianum', jp: '唐楓', group: D, habit: 'deciduous', conifer: false, leaf: 'trilobe', leafLen: 0.026, leafColor: '#567f2e', springColor: '#9cb850', autumnColor: '#d0601e', winterColor: '#8a5a32', bark: { kind: 'flaky', color: '#8f8270', dark: '#5a4d3c', scale: 1.1 }, density: 2600, padFlat: 0.45, wire: 'aluminium', glaze: '#c9b98f' },
  { id: 'elm', common: 'Chinese elm', latin: 'Ulmus parvifolia', jp: '榔楡', group: D, habit: 'deciduous', conifer: false, leaf: 'oval', leafLen: 0.016, leafColor: '#4a6e2a', springColor: '#86a648', autumnColor: '#c49a2c', winterColor: '#7d6438', bark: { kind: 'mottled', color: '#8a7a66', dark: '#55473a', scale: 0.9 }, density: 5200, padFlat: 0.5, wire: 'aluminium', glaze: '#5c7a68' },
  { id: 'beech', common: 'Japanese beech', latin: 'Fagus crenata', jp: '橅', group: D, habit: 'deciduous', conifer: false, leaf: 'oval', leafLen: 0.024, leafColor: '#55752e', springColor: '#a4c25a', autumnColor: '#b0702c', winterColor: '#a77a46', bark: { kind: 'smooth', color: '#a6a69b', dark: '#6c6c62', scale: 1 }, density: 3000, padFlat: 0.4, wire: 'aluminium', glaze: '#3f5146' },
  { id: 'larch', common: 'Japanese larch', latin: 'Larix kaempferi', jp: '唐松', group: D, habit: 'deciduous', conifer: true, leaf: 'tuft', leafLen: 0.018, leafColor: '#6d8f3a', springColor: '#a8c76a', autumnColor: '#d39a2a', winterColor: '#9c6d36', bark: { kind: 'flaky', color: '#6e4e3a', dark: '#3d2a1f', scale: 1 }, density: 3600, padFlat: 0.36, wire: 'copper', glaze: null },
  { id: 'juniper', common: 'Juniper', latin: 'Juniperus procumbens', jp: '杜松', group: C, habit: 'evergreen', conifer: true, leaf: 'scale', leafLen: 0.03, leafColor: '#3f6a3a', springColor: '#5d8a42', autumnColor: '#456a38', winterColor: '#4a5a34', bark: { kind: 'stringy', color: '#7b4c33', dark: '#3e2418', scale: 1.2 }, density: 2600, padFlat: 0.32, wire: 'copper', glaze: null },
  { id: 'black-pine', common: 'Japanese black pine', latin: 'Pinus thunbergii', jp: '黒松', group: C, habit: 'evergreen', conifer: true, leaf: 'needles', leafLen: 0.05, leafColor: '#2f4f2c', springColor: '#3e5f32', autumnColor: '#33522e', winterColor: '#2f4a2c', bark: { kind: 'plates', color: '#4e4038', dark: '#221a16', scale: 1.4 }, density: 900, padFlat: 0.3, wire: 'copper', glaze: null },
  { id: 'white-pine', common: 'Japanese white pine', latin: 'Pinus parviflora', jp: '五葉松', group: C, habit: 'evergreen', conifer: true, leaf: 'needles5', leafLen: 0.032, leafColor: '#3d5c4a', springColor: '#4f7155', autumnColor: '#3d5c4a', winterColor: '#3a5546', bark: { kind: 'plates', color: '#5d5550', dark: '#2c2724', scale: 1.1 }, density: 1300, padFlat: 0.3, wire: 'copper', glaze: null },
  { id: 'spruce', common: 'Ezo spruce', latin: 'Picea jezoensis', jp: '蝦夷松', group: C, habit: 'evergreen', conifer: true, leaf: 'tuft', leafLen: 0.016, leafColor: '#2f4a32', springColor: '#5b8048', autumnColor: '#2f4a32', winterColor: '#2c4430', bark: { kind: 'flaky', color: '#6a5a4c', dark: '#3a2f26', scale: 0.9 }, density: 4200, padFlat: 0.34, wire: 'copper', glaze: null },
  { id: 'cypress', common: 'Hinoki cypress', latin: 'Chamaecyparis obtusa', jp: '檜', group: C, habit: 'evergreen', conifer: true, leaf: 'fan', leafLen: 0.034, leafColor: '#36603a', springColor: '#4f7d45', autumnColor: '#3a5e38', winterColor: '#4d5a34', bark: { kind: 'stringy', color: '#8a5038', dark: '#4a2818', scale: 1 }, density: 2200, padFlat: 0.3, wire: 'copper', glaze: null },
  { id: 'ficus', common: 'Ficus', latin: 'Ficus retusa', jp: '榕樹', group: B, habit: 'evergreen', conifer: false, leaf: 'glossy', leafLen: 0.03, leafColor: '#2d5a26', springColor: '#3f7430', autumnColor: '#2d5a26', winterColor: '#2d5a26', bark: { kind: 'smooth', color: '#8e8a7c', dark: '#5b584c', scale: 1 }, density: 2400, padFlat: 0.5, aerialRoots: true, wire: 'aluminium', glaze: '#7a3b2a' },
  { id: 'privet', common: 'Privet', latin: 'Ligustrum sinense', jp: '水蝋', group: B, habit: 'evergreen', conifer: false, leaf: 'oval', leafLen: 0.02, leafColor: '#3c6328', springColor: '#5d8a36', autumnColor: '#3c6328', winterColor: '#3c5a2a', bark: { kind: 'smooth', color: '#7f7a6c', dark: '#4e4a40', scale: 1 }, density: 4200, padFlat: 0.5, wire: 'aluminium', glaze: '#6b7a86' },
  { id: 'boxwood', common: 'Boxwood', latin: 'Buxus sinica', jp: '柘植', group: B, habit: 'evergreen', conifer: false, leaf: 'oval', leafLen: 0.011, leafColor: '#35562a', springColor: '#58803a', autumnColor: '#3c5a2a', winterColor: '#4a5a30', bark: { kind: 'fissured', color: '#9a8a70', dark: '#5f5442', scale: 0.8 }, density: 9000, padFlat: 0.55, wire: 'aluminium', glaze: '#c2b49a' },
  { id: 'azalea', common: 'Satsuki azalea', latin: 'Rhododendron indicum', jp: '皐月', group: B, habit: 'evergreen', conifer: false, leaf: 'oval', leafLen: 0.018, leafColor: '#3a5a2a', springColor: '#5a7f38', autumnColor: '#5a4a2a', winterColor: '#4a4a2a', bloom: { kind: 'flower', color: '#d6336c', center: '#f5c2d4', amount: 0.32, season: 'spring' }, bark: { kind: 'smooth', color: '#8a6e58', dark: '#57432f', scale: 1 }, density: 4000, padFlat: 0.45, wire: 'aluminium', glaze: '#e8e0cc' },
  { id: 'myrtle', common: 'Myrtle', latin: 'Myrtus communis', jp: '銀梅花', group: B, habit: 'evergreen', conifer: false, leaf: 'oval', leafLen: 0.014, leafColor: '#3a5c30', springColor: '#5a8040', autumnColor: '#3a5c30', winterColor: '#3a5430', bark: { kind: 'flaky', color: '#a08468', dark: '#64503c', scale: 0.8 }, density: 6400, padFlat: 0.5, wire: 'aluminium', glaze: '#8a9a7a' },
  { id: 'cherry', common: 'Japanese cherry', latin: 'Prunus serrulata', jp: '桜', group: F, habit: 'deciduous', conifer: false, leaf: 'oval', leafLen: 0.03, leafColor: '#4f6e2c', springColor: '#7a6a36', autumnColor: '#c0502a', winterColor: '#7a4a30', bloom: { kind: 'blossom', color: '#f4c6d3', center: '#c2506e', amount: 0.62, season: 'spring' }, bark: { kind: 'smooth', color: '#5a3a30', dark: '#2e1c18', scale: 1 }, density: 1800, padFlat: 0.42, wire: 'aluminium', glaze: '#f0ebe0' },
  { id: 'plum', common: 'Japanese plum', latin: 'Prunus mume', jp: '梅', group: F, habit: 'deciduous', conifer: false, leaf: 'oval', leafLen: 0.026, leafColor: '#4c6a2c', springColor: '#6f8a3c', autumnColor: '#a0702a', winterColor: '#6a4a30', bloom: { kind: 'blossom', color: '#f7f2ea', center: '#d9a441', amount: 0.7, season: 'winter' }, bark: { kind: 'fissured', color: '#4a3a30', dark: '#211814', scale: 1.1 }, density: 1500, padFlat: 0.4, wire: 'aluminium', glaze: '#2f4a5c' },
  { id: 'crabapple', common: 'Crabapple', latin: 'Malus halliana', jp: '海棠', group: F, habit: 'deciduous', conifer: false, leaf: 'oval', leafLen: 0.026, leafColor: '#496a2a', springColor: '#6c8a38', autumnColor: '#b86a2a', winterColor: '#7a4a2a', bloom: { kind: 'blossom', color: '#f6d0d8', center: '#e2a0b0', amount: 0.45, season: 'spring' }, fruit: { color: '#b3261e', amount: 0.12 }, bark: { kind: 'fissured', color: '#6a5444', dark: '#3a2c22', scale: 1 }, density: 2000, padFlat: 0.45, wire: 'aluminium', glaze: '#4a6a7a' },
  { id: 'bougainvillea', common: 'Bougainvillea', latin: 'Bougainvillea glabra', jp: 'ブーゲンビリア', group: F, habit: 'evergreen', conifer: false, leaf: 'oval', leafLen: 0.03, leafColor: '#3d6a2c', springColor: '#5a8a38', autumnColor: '#3d6a2c', winterColor: '#3d6a2c', bloom: { kind: 'bract', color: '#c2187a', center: '#f2ecd8', amount: 0.5, season: 'summer' }, bark: { kind: 'fissured', color: '#8a7864', dark: '#54463a', scale: 1 }, density: 2000, padFlat: 0.5, wire: 'aluminium', glaze: '#d8c9a6' },
  { id: 'schefflera', common: 'Schefflera', latin: 'Schefflera arboricola', jp: 'ヤドリフカノキ', group: T, habit: 'evergreen', conifer: false, leaf: 'compound', leafLen: 0.06, leafColor: '#2f6a2a', springColor: '#4a8a38', autumnColor: '#2f6a2a', winterColor: '#2f6a2a', bark: { kind: 'smooth', color: '#8a8470', dark: '#5a5646', scale: 1 }, density: 500, padFlat: 0.55, aerialRoots: true, wire: 'aluminium', glaze: '#2a5a5a' },
  { id: 'pomegranate', common: 'Dwarf pomegranate', latin: 'Punica granatum var. nana', jp: '姫石榴', group: T, habit: 'deciduous', conifer: false, leaf: 'oval', leafLen: 0.016, leafColor: '#4a6e2a', springColor: '#8a7a30', autumnColor: '#d4a020', winterColor: '#8a6a30', bloom: { kind: 'flower', color: '#e2461e', center: '#f2a83a', amount: 0.14, season: 'summer' }, fruit: { color: '#c0391b', amount: 0.08 }, bark: { kind: 'fissured', color: '#8a7058', dark: '#54402e', scale: 1 }, density: 4200, padFlat: 0.45, wire: 'aluminium', glaze: '#c9c2b0' },
]

export const SPECIES_IDS = SPECIES.map(s => s.id)

export const SPECIES_GROUPS: readonly SpeciesGroup[] = ['Deciduous', 'Conifers', 'Broadleaf evergreens', 'Flowering', 'Tropical']

export function isSpeciesId(v: unknown): v is SpeciesId {
  return typeof v === 'string' && (SPECIES_IDS as readonly string[]).includes(v)
}

export function speciesById(id: SpeciesId): SpeciesDef {
  const s = SPECIES.find(x => x.id === id)
  if (!s)
    throw new RangeError(`Unknown species: ${id}`)
  return s
}

export interface SeasonWeights {
  spring: number
  summer: number
  fall: number
  winter: number
}

/**
 * What a species shows in a season (3d-four-seasons): deciduous trees thin
 * in winter, blossoms follow their bloom season, fruit follows autumn.
 */
export function seasonalDisplay(sp: SpeciesDef, w: SeasonWeights): { thin: number, bloomHide: number, fruitHide: number } {
  const thin = sp.habit === 'deciduous' ? w.winter * 0.55 : 0
  let bloom = 0
  if (sp.bloom) {
    const peak = sp.bloom.season === 'spring' ? w.spring : sp.bloom.season === 'winter' ? w.winter + w.spring * 0.6 : w.summer + w.spring * 0.5
    bloom = Math.min(1, peak)
  }
  const fruit = sp.fruit ? Math.max(0.35, w.fall + w.summer * 0.4) : 0
  return { thin, bloomHide: 1 - bloom, fruitHide: 1 - fruit }
}
