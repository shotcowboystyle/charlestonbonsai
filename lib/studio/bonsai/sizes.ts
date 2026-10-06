/**
 * The ten bonsai size classes. Heights are real metres: the generator builds
 * the tree at the midpoint of its class range, and the camera frames it in
 * metres too, so a Keshitsubo really is five centimetres tall in the world.
 */

export type SizeId
  = | 'keshitsubo' | 'shito' | 'mame' | 'shohin' | 'komono'
    | 'katade-mochi' | 'chumono' | 'omono' | 'hachi-uye' | 'imperial'

export interface SizeClass {
  id: SizeId
  name: string
  jp: string
  group: 'Miniature' | 'Medium and large'
  cmMin: number
  cmMax: number
  inMin: number
  inMax: number
  /** How the class is carried, from the traditional descriptions. */
  carry: string
  /** Deepest branch order grown: smaller trees are styled with fewer orders. */
  ramification: number
}

export const SIZES: readonly SizeClass[] = [
  { id: 'keshitsubo', name: 'Keshitsubo', jp: '芥子壺', group: 'Miniature', cmMin: 3, cmMax: 8, inMin: 1, inMax: 3, carry: 'fingertip', ramification: 1 },
  { id: 'shito', name: 'Shito', jp: '指頭', group: 'Miniature', cmMin: 5, cmMax: 10, inMin: 2, inMax: 4, carry: 'fingertip', ramification: 1 },
  { id: 'mame', name: 'Mame', jp: '豆', group: 'Miniature', cmMin: 5, cmMax: 15, inMin: 2, inMax: 6, carry: 'palm', ramification: 2 },
  { id: 'shohin', name: 'Shohin', jp: '小品', group: 'Miniature', cmMin: 13, cmMax: 20, inMin: 5, inMax: 8, carry: 'one hand', ramification: 2 },
  { id: 'komono', name: 'Komono', jp: '小物', group: 'Miniature', cmMin: 15, cmMax: 25, inMin: 6, inMax: 10, carry: 'one hand', ramification: 2 },
  { id: 'katade-mochi', name: 'Katade-mochi', jp: '片手持', group: 'Medium and large', cmMin: 25, cmMax: 46, inMin: 10, inMax: 18, carry: 'one to two hands', ramification: 3 },
  { id: 'chumono', name: 'Chumono', jp: '中物', group: 'Medium and large', cmMin: 41, cmMax: 91, inMin: 16, inMax: 36, carry: 'two hands', ramification: 3 },
  { id: 'omono', name: 'Omono', jp: '大物', group: 'Medium and large', cmMin: 76, cmMax: 122, inMin: 30, inMax: 48, carry: 'four hands', ramification: 3 },
  { id: 'hachi-uye', name: 'Hachi-uye', jp: '鉢植', group: 'Medium and large', cmMin: 102, cmMax: 152, inMin: 40, inMax: 60, carry: 'six hands', ramification: 4 },
  { id: 'imperial', name: 'Imperial', jp: '特大', group: 'Medium and large', cmMin: 152, cmMax: 203, inMin: 60, inMax: 80, carry: 'eight hands, four people', ramification: 4 },
]

export const SIZE_IDS = SIZES.map(s => s.id)

export function isSizeId(v: unknown): v is SizeId {
  return typeof v === 'string' && (SIZE_IDS as readonly string[]).includes(v)
}

export function sizeById(id: SizeId): SizeClass {
  const s = SIZES.find(x => x.id === id)
  if (!s)
    throw new RangeError(`Unknown size class: ${id}`)
  return s
}

/** Tree height in metres: the midpoint of the class range. */
export function sizeHeightM(id: SizeId): number {
  const s = sizeById(id)
  return (s.cmMin + s.cmMax) / 200
}

/** Display string for the plaque: "13–20 cm". */
export function sizeRangeLabel(id: SizeId): string {
  const s = sizeById(id)
  return `${s.cmMin}–${s.cmMax} cm`
}
