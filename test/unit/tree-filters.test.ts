import type { FilterState } from '~/types'
import { describe, expect, it } from 'vitest'
import {
  activeFacetCount,
  FACET_KEYS,
  hasActiveFacets,
  sameFacets,
  sameSet,
  snapshotFilters,
  toggleIn,
} from '~/utils/tree-filters'

function filters(overrides: Partial<FilterState> = {}): FilterState {
  return {
    sizes: [],
    careLevels: [],
    treeTypes: [],
    search: '',
    sortBy: 'newest',
    inStockOnly: true,
    ...overrides,
  }
}

describe('toggleIn', () => {
  it('adds a value that is absent', () => {
    expect(toggleIn(['small'], 'large')).toEqual(['small', 'large'])
  })

  it('removes a value that is present', () => {
    expect(toggleIn(['small', 'large'], 'small')).toEqual(['large'])
  })

  it('appends to an empty array', () => {
    expect(toggleIn([], 'small')).toEqual(['small'])
  })

  it('empties a single-element array', () => {
    expect(toggleIn(['small'], 'small')).toEqual([])
  })

  // Vue only reacts to a new array reference, and the mobile sheet edits a
  // draft that must not write through to the live filters.
  it('never mutates the input array', () => {
    const original = ['small']
    const result = toggleIn(original, 'large')

    expect(original).toEqual(['small'])
    expect(result).not.toBe(original)
  })

  it('returns a new reference even when removing', () => {
    const original = ['small']
    expect(toggleIn(original, 'small')).not.toBe(original)
  })

  it('round-trips: toggling twice restores the original set', () => {
    const original = ['small', 'medium']
    expect(toggleIn(toggleIn(original, 'large'), 'large')).toEqual(original)
  })

  it('removes only the first occurrence of a duplicated value', () => {
    expect(toggleIn(['a', 'a', 'b'], 'a')).toEqual(['a', 'b'])
  })
})

describe('sameSet', () => {
  it('is true for the same values in a different order', () => {
    expect(sameSet(['a', 'b'], ['b', 'a'])).toBe(true)
  })

  it('is true for two empty arrays', () => {
    expect(sameSet([], [])).toBe(true)
  })

  it('is false when lengths differ', () => {
    expect(sameSet(['a'], ['a', 'b'])).toBe(false)
  })

  it('is false when values differ', () => {
    expect(sameSet(['a', 'b'], ['a', 'c'])).toBe(false)
  })

  it('is symmetric', () => {
    expect(sameSet(['a', 'b'], ['b', 'a'])).toBe(sameSet(['b', 'a'], ['a', 'b']))
  })
})

describe('snapshotFilters', () => {
  it('preserves every field', () => {
    const state = filters({ sizes: ['small'], search: 'juniper', sortBy: 'name' })

    expect(snapshotFilters(state)).toEqual(state)
  })

  it('detaches each facet array so draft edits do not leak', () => {
    const state = filters({ sizes: ['small'], careLevels: ['expert'], treeTypes: ['pine'] })
    const draft = snapshotFilters(state)

    draft.sizes.push('large')
    draft.careLevels.push('beginner')
    draft.treeTypes.push('elm')

    expect(state.sizes).toEqual(['small'])
    expect(state.careLevels).toEqual(['expert'])
    expect(state.treeTypes).toEqual(['pine'])
  })

  it('returns a distinct object', () => {
    const state = filters()
    expect(snapshotFilters(state)).not.toBe(state)
  })
})

describe('activeFacetCount', () => {
  it('is zero for untouched filters', () => {
    expect(activeFacetCount(filters())).toBe(0)
  })

  it('sums across all three facets', () => {
    expect(activeFacetCount(filters({
      sizes: ['small', 'large'],
      careLevels: ['expert'],
      treeTypes: ['pine'],
    }))).toBe(4)
  })

  // Search and sort change what you see, not which subset is selected, so a
  // "clear filters" badge must not light up for them.
  it('ignores search text and sort order', () => {
    expect(activeFacetCount(filters({ search: 'juniper', sortBy: 'name' }))).toBe(0)
  })

  it('ignores the in-stock toggle', () => {
    expect(activeFacetCount(filters({ inStockOnly: false }))).toBe(0)
  })
})

describe('hasActiveFacets', () => {
  it('is false with no facets selected', () => {
    expect(hasActiveFacets(filters())).toBe(false)
  })

  it('is true when any single facet is selected', () => {
    expect(hasActiveFacets(filters({ sizes: ['small'] }))).toBe(true)
    expect(hasActiveFacets(filters({ careLevels: ['expert'] }))).toBe(true)
    expect(hasActiveFacets(filters({ treeTypes: ['pine'] }))).toBe(true)
  })

  it('agrees with activeFacetCount', () => {
    const state = filters({ sizes: ['small'] })
    expect(hasActiveFacets(state)).toBe(activeFacetCount(state) > 0)
  })
})

describe('sameFacets', () => {
  it('is true when facets match regardless of order', () => {
    const a = filters({ sizes: ['small', 'large'], treeTypes: ['pine'] })
    const b = filters({ sizes: ['large', 'small'], treeTypes: ['pine'] })

    expect(sameFacets(a, b)).toBe(true)
  })

  it('is false when any facet differs', () => {
    expect(sameFacets(filters({ sizes: ['small'] }), filters({ sizes: ['large'] }))).toBe(false)
    expect(sameFacets(filters({ treeTypes: ['pine'] }), filters())).toBe(false)
  })

  it('ignores search and sort, which the toolbar compares separately', () => {
    const a = filters({ sizes: ['small'], search: 'a', sortBy: 'name' })
    const b = filters({ sizes: ['small'], search: 'b', sortBy: 'oldest' })

    expect(sameFacets(a, b)).toBe(true)
  })

  it('covers exactly the three facet keys', () => {
    expect(FACET_KEYS).toEqual(['sizes', 'careLevels', 'treeTypes'])
  })
})
