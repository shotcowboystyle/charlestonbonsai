/**
 * The visitor's selection and its URL form (`?style=&tree=&size=&scene=&atmo=`).
 * Pure, so the round-trip and the dwarf-style size snap are unit-tested.
 */
import type { AtmoId } from './atmospheres'
import type { SizeId } from './bonsai/sizes'
import type { SpeciesId } from './bonsai/species'
import type { StyleId } from './bonsai/styles'
import type { LandscapeId } from './landscapes/meta'
import { ATMO_IDS, isAtmoId } from './atmospheres'
import { isSizeId, SIZE_IDS } from './bonsai/sizes'
import { isSpeciesId, SPECIES_IDS } from './bonsai/species'
import { isStyleId, STYLE_IDS, styleById } from './bonsai/styles'
import { isLandscapeId, LANDSCAPE_IDS } from './landscapes/meta'

export interface Selection {
  style: StyleId
  tree: SpeciesId
  size: SizeId
  scene: LandscapeId
  atmo: AtmoId
}

export type SelectionKey = keyof Selection

export const DEFAULT_SELECTION: Selection = {
  style: 'chokkan',
  tree: 'japanese-maple',
  size: 'shohin',
  scene: 'rock-garden',
  atmo: 'asagiri',
}

export const OPTION_IDS: { [K in SelectionKey]: readonly Selection[K][] } = {
  style: STYLE_IDS,
  tree: SPECIES_IDS,
  size: SIZE_IDS,
  scene: LANDSCAPE_IDS,
  atmo: ATMO_IDS,
}

/** A dwarf style owns the size: whatever the size says, the style wins. */
export function normalizeSelection(sel: Selection): Selection {
  const snap = styleById(sel.style).snapSize
  return snap && snap !== sel.size ? { ...sel, size: snap } : sel
}

/** True when the size control is pinned by the current style. */
export function sizeLocked(sel: Selection): boolean {
  return Boolean(styleById(sel.style).snapSize)
}

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v
}

export function parseQuery(q: Record<string, unknown>): Selection {
  const style = first(q.style)
  const tree = first(q.tree)
  const size = first(q.size)
  const scene = first(q.scene)
  const atmo = first(q.atmo)
  return normalizeSelection({
    style: isStyleId(style) ? style : DEFAULT_SELECTION.style,
    tree: isSpeciesId(tree) ? tree : DEFAULT_SELECTION.tree,
    size: isSizeId(size) ? size : DEFAULT_SELECTION.size,
    scene: isLandscapeId(scene) ? scene : DEFAULT_SELECTION.scene,
    atmo: isAtmoId(atmo) ? atmo : DEFAULT_SELECTION.atmo,
  })
}

export function toQuery(sel: Selection): Record<string, string> {
  return { style: sel.style, tree: sel.tree, size: sel.size, scene: sel.scene, atmo: sel.atmo }
}

/** Set one field, re-applying the dwarf snap. Returns the same object when nothing changes. */
export function withValue<K extends SelectionKey>(sel: Selection, key: K, value: Selection[K]): Selection {
  if (key === 'size' && sizeLocked(sel))
    return sel
  if (sel[key] === value)
    return sel
  return normalizeSelection({ ...sel, [key]: value })
}

export function cycleValue<K extends SelectionKey>(sel: Selection, key: K, dir: 1 | -1 = 1): Selection {
  const list = OPTION_IDS[key]
  const i = list.indexOf(sel[key])
  const next = list[(i + dir + list.length) % list.length] as Selection[K]
  return withValue(sel, key, next)
}
