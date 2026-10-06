/**
 * Display data for the twelve landscapes, kept free of three.js so the page
 * chrome can import it without pulling the renderer into the route chunk.
 * index.ts joins each entry to its `build`.
 */

export type LandscapeId
  = | 'mountain-dojo' | 'winter-dojo' | 'monastery-courtyard' | 'rock-garden'
    | 'koi-pond' | 'waterfall-grotto' | 'coastal-cliff' | 'teahouse'
    | 'sacred-spring' | 'spring-blossom' | 'water-pavilion' | 'alpine-valley'

export type Season = 'spring' | 'summer' | 'fall' | 'winter'
export type WaterKind = 'ocean' | 'still' | 'stream' | 'spring' | 'waterfall' | 'none'
export type FallingKind = 'cherry' | 'plum' | 'maple' | 'none'
export type MoteKind = 'incense' | 'embers' | 'spray' | 'dust' | 'none'
export type DisplayKind = 'stand' | 'slab' | 'table' | 'rock'

export interface Ambience {
  wind: number
  water: number
  surf: number
  fall: number
  crackle: number
}

export interface LandscapeMeta {
  id: LandscapeId
  jp: string
  en: string
  line: string
  season: Season
  falling: FallingKind
  motes: MoteKind
  water: WaterKind
  interior: boolean
  display: DisplayKind
  ambience: Ambience
}

const amb = (wind: number, water = 0, surf = 0, fall = 0, crackle = 0): Ambience => ({ wind, water, surf, fall, crackle })

export const LANDSCAPE_META: readonly LandscapeMeta[] = [
  { id: 'mountain-dojo', jp: '山道場', en: 'Mountain Dojo at Dawn', line: 'A stone temple on a misty ridge; petals drift through the open doors.', season: 'spring', falling: 'cherry', motes: 'dust', water: 'none', interior: true, display: 'stand', ambience: amb(0.55) },
  { id: 'winter-dojo', jp: '冬道場', en: 'Indoor Dojo, Winter Afternoon', line: 'Golden rectangles on tatami, a brazier glowing, snow beyond the high windows.', season: 'winter', falling: 'none', motes: 'embers', water: 'none', interior: true, display: 'stand', ambience: amb(0.25, 0, 0, 0, 0.7) },
  { id: 'monastery-courtyard', jp: '中庭', en: 'Zen Monastery Inner Courtyard', line: 'Grey stone, a still water basin, one plum blooming white against a dark wall.', season: 'winter', falling: 'plum', motes: 'none', water: 'still', interior: false, display: 'slab', ambience: amb(0.15, 0.35) },
  { id: 'rock-garden', jp: '石庭', en: 'Rock Garden Temple', line: 'Raked gravel waves around mossy boulders under blazing autumn maples.', season: 'fall', falling: 'maple', motes: 'none', water: 'none', interior: false, display: 'slab', ambience: amb(0.45) },
  { id: 'koi-pond', jp: '鯉池', en: 'Koi Pond Garden', line: 'Black water, a vermilion bridge, koi gliding beneath lily pads.', season: 'summer', falling: 'none', motes: 'none', water: 'still', interior: false, display: 'table', ambience: amb(0.3, 0.45) },
  { id: 'waterfall-grotto', jp: '滝窟', en: 'Waterfall Grotto Alcove', line: 'A stone cavern behind falling water; ferns drip and moss covers everything.', season: 'summer', falling: 'none', motes: 'spray', water: 'waterfall', interior: false, display: 'rock', ambience: amb(0.1, 0.3, 0, 1) },
  { id: 'coastal-cliff', jp: '海崖寺', en: 'Coastal Cliff Temple', line: 'Above a churning sea; salt spray and cherry petals on the ocean wind.', season: 'spring', falling: 'cherry', motes: 'none', water: 'ocean', interior: false, display: 'table', ambience: amb(0.7, 0, 1) },
  { id: 'teahouse', jp: '茶室', en: 'Garden Teahouse Platform', line: 'A raised deck over a moss garden; frosted grasses and stepping stones.', season: 'fall', falling: 'none', motes: 'none', water: 'none', interior: false, display: 'stand', ambience: amb(0.35) },
  { id: 'sacred-spring', jp: '御神泉', en: 'Sacred Spring Pool', line: 'Clear water over stone, a torii reflected among ancient cryptomeria.', season: 'summer', falling: 'none', motes: 'dust', water: 'spring', interior: false, display: 'rock', ambience: amb(0.25, 0.55) },
  { id: 'spring-blossom', jp: '花見', en: 'Spring Blossom Garden, Peak Bloom', line: 'White and pink in full bloom; curved bridges and petals falling like snow.', season: 'spring', falling: 'cherry', motes: 'none', water: 'still', interior: false, display: 'table', ambience: amb(0.35, 0.3) },
  { id: 'water-pavilion', jp: '水亭', en: 'Zen Garden Water Pavilion', line: 'A timber pavilion over a stream, dappled light through overhanging trees.', season: 'summer', falling: 'none', motes: 'dust', water: 'stream', interior: false, display: 'stand', ambience: amb(0.2, 0.9) },
  { id: 'alpine-valley', jp: '高山谷', en: 'High Alpine Temple Valley', line: 'Thin air, snow-capped peaks and red shrine markers under close stars.', season: 'fall', falling: 'none', motes: 'none', water: 'none', interior: false, display: 'slab', ambience: amb(0.8) },
]

export const LANDSCAPE_IDS = LANDSCAPE_META.map(l => l.id)

export function isLandscapeId(v: unknown): v is LandscapeId {
  return typeof v === 'string' && (LANDSCAPE_IDS as readonly string[]).includes(v)
}

export function landscapeMetaById(id: LandscapeId): LandscapeMeta {
  const l = LANDSCAPE_META.find(x => x.id === id)
  if (!l)
    throw new RangeError(`Unknown landscape: ${id}`)
  return l
}
