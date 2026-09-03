import { describe, expect, it } from 'vitest'
import {
  CARE_LEVEL_LABELS,
  isCareLevel,
  isTreeSize,
  isTreeType,
  SORT_OPTIONS,
  TREE_SIZE_LABELS,
  TREE_SIZE_SHORT_LABELS,
  TREE_TYPE_LABELS,
} from '~/types/tree'

// Each guard re-lists its union literals by hand, so a guard and its label map
// can silently drift apart. These round-trip assertions are the only thing that
// catches a value added to one and forgotten in the other.
describe('type guard / label map agreement', () => {
  it('accepts every key in TREE_TYPE_LABELS', () => {
    expect(Object.keys(TREE_TYPE_LABELS).filter(key => !isTreeType(key))).toEqual([])
  })

  it('accepts every key in CARE_LEVEL_LABELS', () => {
    expect(Object.keys(CARE_LEVEL_LABELS).filter(key => !isCareLevel(key))).toEqual([])
  })

  it('accepts every key in TREE_SIZE_LABELS', () => {
    expect(Object.keys(TREE_SIZE_LABELS).filter(key => !isTreeSize(key))).toEqual([])
  })

  it('pins the exact accepted tree types', () => {
    expect(Object.keys(TREE_TYPE_LABELS)).toEqual([
      'ficus',
      'juniper',
      'maple',
      'pine',
      'elm',
      'cedar',
      'azalea',
      'bamboo',
      'other',
    ])
  })

  it('pins the exact accepted care levels', () => {
    expect(Object.keys(CARE_LEVEL_LABELS)).toEqual([
      'beginner',
      'intermediate',
      'advanced',
      'expert',
    ])
  })

  it('pins the exact accepted sizes', () => {
    expect(Object.keys(TREE_SIZE_LABELS)).toEqual([
      'mini',
      'small',
      'medium',
      'large',
      'extra-large',
    ])
  })
})

describe('isTreeType', () => {
  it('rejects unknown, cased, and empty values', () => {
    expect(isTreeType('oak')).toBe(false)
    expect(isTreeType('Ficus')).toBe(false)
    expect(isTreeType('')).toBe(false)
  })

  it('rejects inherited Object.prototype members', () => {
    // `.includes()` on an array is safe here, but pin it so a future switch to
    // an object lookup cannot introduce a prototype-pollution style hole.
    expect(isTreeType('toString')).toBe(false)
    expect(isTreeType('constructor')).toBe(false)
  })
})

describe('isCareLevel', () => {
  it('rejects unknown values', () => {
    expect(isCareLevel('novice')).toBe(false)
    expect(isCareLevel('Expert')).toBe(false)
  })
})

describe('isTreeSize', () => {
  it('accepts the hyphenated extra-large key', () => {
    expect(isTreeSize('extra-large')).toBe(true)
  })

  it('rejects near-miss spellings', () => {
    expect(isTreeSize('extralarge')).toBe(false)
    expect(isTreeSize('extra large')).toBe(false)
    expect(isTreeSize('xl')).toBe(false)
  })
})

describe('label maps', () => {
  it('gives every size both a long and a short label', () => {
    expect(Object.keys(TREE_SIZE_SHORT_LABELS)).toEqual(Object.keys(TREE_SIZE_LABELS))
  })

  it('drops the dimension parenthetical in the short labels', () => {
    for (const label of Object.values(TREE_SIZE_SHORT_LABELS))
      expect(label).not.toContain('(')
  })

  it('keeps the dimension parenthetical in the long labels', () => {
    for (const label of Object.values(TREE_SIZE_LABELS))
      expect(label).toContain('(')
  })

  it('has no empty labels', () => {
    const all = [
      ...Object.values(TREE_TYPE_LABELS),
      ...Object.values(CARE_LEVEL_LABELS),
      ...Object.values(TREE_SIZE_LABELS),
      ...Object.values(TREE_SIZE_SHORT_LABELS),
    ]
    expect(all.filter(label => label.trim() === '')).toEqual([])
  })
})

describe('SORT_OPTIONS', () => {
  it('offers newest first, which is the API default', () => {
    expect(SORT_OPTIONS[0]?.value).toBe('newest')
  })

  it('lists each sort option exactly once', () => {
    const values = SORT_OPTIONS.map(option => option.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('covers every sort key the API accepts', () => {
    expect(SORT_OPTIONS.map(option => option.value).sort()).toEqual(['name', 'newest', 'oldest'])
  })

  it('labels every option', () => {
    expect(SORT_OPTIONS.filter(option => !option.label)).toEqual([])
  })
})
