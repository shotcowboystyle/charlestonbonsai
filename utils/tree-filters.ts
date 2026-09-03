import type { FilterState } from '~/types'

/**
 * Pure helpers shared by the gallery's three filter surfaces (desktop toolbar,
 * mobile sheet, sidebar). Each previously carried its own copy of `toggleIn`,
 * which is how they drifted apart.
 */

/** The three multi-select facet keys on FilterState. */
export type FacetKey = 'sizes' | 'careLevels' | 'treeTypes'

export const FACET_KEYS: FacetKey[] = ['sizes', 'careLevels', 'treeTypes']

/**
 * Add a value if absent, remove it if present. Always returns a new array so
 * Vue sees the change; never mutates the input.
 */
export function toggleIn<T>(values: T[], value: T): T[] {
  const index = values.indexOf(value)
  if (index === -1)
    return [...values, value]
  const next = [...values]
  next.splice(index, 1)
  return next
}

/** Order-insensitive equality, used to skip no-op filter emissions. */
export function sameSet<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length)
    return false
  const seen = new Set(b)
  return a.every(value => seen.has(value))
}

/**
 * Copy a FilterState with its facet arrays detached.
 *
 * The mobile sheet edits a draft and discards it unless Apply is pressed, so a
 * shallow spread would let draft edits leak into the live filters.
 */
export function snapshotFilters(state: FilterState): FilterState {
  return {
    ...state,
    sizes: [...state.sizes],
    careLevels: [...state.careLevels],
    treeTypes: [...state.treeTypes],
  }
}

/** How many facet values are selected — the number shown on the filter badge. */
export function activeFacetCount(state: FilterState): number {
  return state.sizes.length + state.careLevels.length + state.treeTypes.length
}

/**
 * Whether any facet is narrowing the catalogue.
 *
 * Search text and sort order deliberately do not count: they change what you
 * see but not which subset is selected, and a "clear filters" affordance that
 * appears for a sort change reads as a bug.
 */
export function hasActiveFacets(state: FilterState): boolean {
  return activeFacetCount(state) > 0
}

/** Order-insensitive equality across every facet. */
export function sameFacets(a: FilterState, b: FilterState): boolean {
  return FACET_KEYS.every(key => sameSet(a[key] as string[], b[key] as string[]))
}
