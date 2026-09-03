import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PAGE_SIZE,
  escapeLikePattern,
  hasMorePages,
  MAX_PAGE,
  MAX_PAGE_SIZE,
  parseTreeListQuery,
  toArray,
  toInt,
} from '~/server/utils/tree-query'

describe('toArray', () => {
  it('wraps a non-empty string in an array', () => {
    expect(toArray('small')).toEqual(['small'])
  })

  it('returns an empty array for an empty string', () => {
    expect(toArray('')).toEqual([])
  })

  it('passes an array through, stringifying members', () => {
    expect(toArray(['small', 'large'])).toEqual(['small', 'large'])
    expect(toArray([1, 2])).toEqual(['1', '2'])
  })

  it('returns an empty array for undefined, null, and non-string scalars', () => {
    expect(toArray(undefined)).toEqual([])
    expect(toArray(null)).toEqual([])
    expect(toArray(42)).toEqual([])
    expect(toArray({})).toEqual([])
  })
})

describe('toInt', () => {
  it('parses a numeric string', () => {
    expect(toInt('5', 1, 100)).toBe(5)
  })

  it('falls back for non-numeric input', () => {
    expect(toInt('abc', 7, 100)).toBe(7)
    expect(toInt(undefined, 7, 100)).toBe(7)
    expect(toInt(null, 7, 100)).toBe(7)
  })

  it('falls back for zero and negatives rather than clamping to 1', () => {
    expect(toInt('0', 3, 100)).toBe(3)
    expect(toInt('-10', 3, 100)).toBe(3)
  })

  it('clamps to the maximum', () => {
    expect(toInt('9999', 1, 48)).toBe(48)
  })

  it('truncates a decimal via parseInt', () => {
    expect(toInt('3.9', 1, 100)).toBe(3)
  })
})

describe('escapeLikePattern', () => {
  it('escapes LIKE wildcards', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%')
    expect(escapeLikePattern('a_b')).toBe('a\\_b')
  })

  // A bare comma would terminate the current filter inside PostgREST's
  // comma-delimited `.or()` list and let a search term inject another condition.
  it('escapes commas so a search term cannot inject an extra or() filter', () => {
    expect(escapeLikePattern('juniper,price.gt.0')).toBe('juniper\\,price.gt.0')
  })

  it('escapes every occurrence, not just the first', () => {
    expect(escapeLikePattern('%_,%')).toBe('\\%\\_\\,\\%')
  })

  it('leaves ordinary search text untouched', () => {
    expect(escapeLikePattern('windswept juniper')).toBe('windswept juniper')
  })

  it('returns an empty string unchanged', () => {
    expect(escapeLikePattern('')).toBe('')
  })
})

describe('parseTreeListQuery', () => {
  it('applies defaults for an empty query', () => {
    expect(parseTreeListQuery({})).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      inStockOnly: true,
      sizes: [],
      careLevels: [],
      treeTypes: [],
      search: '',
      sortBy: 'newest',
      from: 0,
      to: DEFAULT_PAGE_SIZE - 1,
    })
  })

  // Opt-out, not opt-in: only the literal string 'false' reveals sold trees.
  it('keeps inStockOnly true unless the query says exactly "false"', () => {
    expect(parseTreeListQuery({}).inStockOnly).toBe(true)
    expect(parseTreeListQuery({ inStockOnly: 'true' }).inStockOnly).toBe(true)
    expect(parseTreeListQuery({ inStockOnly: '0' }).inStockOnly).toBe(true)
    expect(parseTreeListQuery({ inStockOnly: false }).inStockOnly).toBe(true)
    expect(parseTreeListQuery({ inStockOnly: 'false' }).inStockOnly).toBe(false)
  })

  it('computes inclusive range bounds for page 1', () => {
    const parsed = parseTreeListQuery({ page: '1', pageSize: '12' })
    expect([parsed.from, parsed.to]).toEqual([0, 11])
  })

  it('computes inclusive range bounds for a later page', () => {
    const parsed = parseTreeListQuery({ page: '3', pageSize: '10' })
    expect([parsed.from, parsed.to]).toEqual([20, 29])
  })

  it('clamps pageSize to the maximum and page to its ceiling', () => {
    expect(parseTreeListQuery({ pageSize: '500' }).pageSize).toBe(MAX_PAGE_SIZE)
    expect(parseTreeListQuery({ page: '99999' }).page).toBe(MAX_PAGE)
  })

  it('falls back to newest for an unknown or malicious sort key', () => {
    expect(parseTreeListQuery({ sortBy: 'price' }).sortBy).toBe('newest')
    expect(parseTreeListQuery({ sortBy: 'created_at; drop table trees' }).sortBy).toBe('newest')
    expect(parseTreeListQuery({ sortBy: ['name'] }).sortBy).toBe('newest')
  })

  it('accepts each allowed sort key', () => {
    expect(parseTreeListQuery({ sortBy: 'name' }).sortBy).toBe('name')
    expect(parseTreeListQuery({ sortBy: 'oldest' }).sortBy).toBe('oldest')
    expect(parseTreeListQuery({ sortBy: 'newest' }).sortBy).toBe('newest')
  })

  it('normalises single and repeated facet params to arrays', () => {
    const parsed = parseTreeListQuery({
      sizes: 'small',
      careLevels: ['beginner', 'expert'],
      treeTypes: [],
    })

    expect(parsed.sizes).toEqual(['small'])
    expect(parsed.careLevels).toEqual(['beginner', 'expert'])
    expect(parsed.treeTypes).toEqual([])
  })

  it('ignores a non-string search value', () => {
    expect(parseTreeListQuery({ search: ['a', 'b'] }).search).toBe('')
    expect(parseTreeListQuery({ search: 42 }).search).toBe('')
  })

  it('keeps the raw search term — escaping is the caller’s job at query time', () => {
    expect(parseTreeListQuery({ search: '100%' }).search).toBe('100%')
  })
})

describe('hasMorePages', () => {
  it('is false when the page ends exactly at the last row', () => {
    // Rows 0..11 of 12 total: `to` is 11, last index is 11.
    expect(hasMorePages(11, 12)).toBe(false)
  })

  it('is true when rows remain beyond the page', () => {
    expect(hasMorePages(11, 13)).toBe(true)
  })

  it('is false when the page overshoots the result set', () => {
    expect(hasMorePages(23, 12)).toBe(false)
  })

  it('is false for an empty result set', () => {
    expect(hasMorePages(11, 0)).toBe(false)
  })

  it('agrees with parseTreeListQuery bounds on a full first page', () => {
    const { to } = parseTreeListQuery({ page: '1', pageSize: '12' })
    expect(hasMorePages(to, 12)).toBe(false)
    expect(hasMorePages(to, 24)).toBe(true)
  })
})
