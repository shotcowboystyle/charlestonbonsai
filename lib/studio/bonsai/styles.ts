/**
 * Style registry. A style owns the trunk and branch architecture (see
 * branches.ts), the pot shape, and — for the two dwarf presets — the size.
 * Shito and Mame appear in the brief as both styles and sizes; they are
 * modelled as presets that snap the size class so size has one source of truth.
 */
import type { SizeId } from './sizes'

export type StyleId
  = | 'chokkan' | 'shakan' | 'kengai' | 'han-kengai'
    | 'sokan' | 'sankan' | 'yose-ue'
    | 'bunjingi' | 'hokidachi' | 'nejikan' | 'ikadabuki' | 'sekijoju' | 'ishitsuki'
    | 'shito' | 'mame'
    | 'sharimiki' | 'tanuki'

export type StyleGroup = 'Upright forms' | 'Multiple trunks' | 'Specialized' | 'Dwarf forms' | 'Rare and advanced'

export type PotKind = 'rect' | 'oval' | 'round' | 'tall' | 'medium' | 'tray' | 'slab'

export interface StyleDef {
  id: StyleId
  name: string
  jp: string
  english: string
  group: StyleGroup
  pot: PotKind
  /** Dwarf presets pin the size selector to this class. */
  snapSize?: SizeId
  /** Branch orders removed from the size class's ramification. */
  simplify?: number
}

export const STYLES: readonly StyleDef[] = [
  { id: 'chokkan', name: 'Chokkan', jp: '直幹', english: 'Formal upright', group: 'Upright forms', pot: 'rect' },
  { id: 'shakan', name: 'Shakan', jp: '斜幹', english: 'Slanting', group: 'Upright forms', pot: 'oval' },
  { id: 'kengai', name: 'Kengai', jp: '懸崖', english: 'Cascade', group: 'Upright forms', pot: 'tall' },
  { id: 'han-kengai', name: 'Han-kengai', jp: '半懸崖', english: 'Semi-cascade', group: 'Upright forms', pot: 'medium' },
  { id: 'sokan', name: 'Sokan', jp: '双幹', english: 'Twin trunk', group: 'Multiple trunks', pot: 'oval' },
  { id: 'sankan', name: 'Sankan', jp: '三幹', english: 'Triple trunk', group: 'Multiple trunks', pot: 'oval' },
  { id: 'yose-ue', name: 'Yose-ue', jp: '寄植', english: 'Forest group', group: 'Multiple trunks', pot: 'tray' },
  { id: 'bunjingi', name: 'Bunjingi', jp: '文人木', english: 'Literati', group: 'Specialized', pot: 'round' },
  { id: 'hokidachi', name: 'Hokidachi', jp: '箒立', english: 'Broom', group: 'Specialized', pot: 'oval' },
  { id: 'nejikan', name: 'Nejikan', jp: '捻幹', english: 'Twisted trunk', group: 'Specialized', pot: 'rect' },
  { id: 'ikadabuki', name: 'Ikadabuki', jp: '筏吹', english: 'Raft', group: 'Specialized', pot: 'tray' },
  { id: 'sekijoju', name: 'Sekijoju', jp: '石上樹', english: 'Root over rock', group: 'Specialized', pot: 'round' },
  { id: 'ishitsuki', name: 'Ishitsuki', jp: '石付', english: 'Rock planting', group: 'Specialized', pot: 'slab' },
  { id: 'shito', name: 'Shito', jp: '指頭', english: 'Fingertip', group: 'Dwarf forms', pot: 'round', snapSize: 'shito', simplify: 1 },
  { id: 'mame', name: 'Mame', jp: '豆', english: 'Bean', group: 'Dwarf forms', pot: 'round', snapSize: 'mame', simplify: 1 },
  { id: 'sharimiki', name: 'Sharimiki', jp: '舎利幹', english: 'Driftwood', group: 'Rare and advanced', pot: 'rect' },
  { id: 'tanuki', name: 'Tanuki', jp: '狸', english: 'Grafted deadwood', group: 'Rare and advanced', pot: 'oval' },
]

export const STYLE_IDS = STYLES.map(s => s.id)

export const STYLE_GROUPS: readonly StyleGroup[] = ['Upright forms', 'Multiple trunks', 'Specialized', 'Dwarf forms', 'Rare and advanced']

export function isStyleId(v: unknown): v is StyleId {
  return typeof v === 'string' && (STYLE_IDS as readonly string[]).includes(v)
}

export function styleById(id: StyleId): StyleDef {
  const s = STYLES.find(x => x.id === id)
  if (!s)
    throw new RangeError(`Unknown style: ${id}`)
  return s
}
