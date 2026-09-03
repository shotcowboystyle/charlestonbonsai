export const ALLOWED_SORTS = ['newest', 'oldest', 'name'] as const
export type AllowedSort = typeof ALLOWED_SORTS[number]

export const DEFAULT_PAGE_SIZE = 12
export const MAX_PAGE_SIZE = 48
export const MAX_PAGE = 1000

export interface ParsedTreeListQuery {
  page: number
  pageSize: number
  inStockOnly: boolean
  sizes: string[]
  careLevels: string[]
  treeTypes: string[]
  search: string
  sortBy: AllowedSort
  /** Inclusive Supabase `.range()` bounds. */
  from: number
  to: number
}

export function toArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map(String)
  if (typeof value === 'string' && value.length > 0)
    return [value]
  return []
}

export function toInt(value: unknown, fallback: number, max: number): number {
  const n = Number.parseInt(String(value), 10)
  if (Number.isNaN(n) || n < 1)
    return fallback
  return Math.min(n, max)
}

/**
 * Escape a user search term for a PostgREST `ilike` pattern.
 *
 * `%` and `_` are LIKE wildcards. `,` matters too: `.or()` takes a
 * comma-delimited filter list, so an unescaped comma would let a search term
 * inject an additional filter condition.
 */
export function escapeLikePattern(search: string): string {
  return search.replace(/[%_,]/g, '\\$&')
}

export function parseTreeListQuery(q: Record<string, unknown>): ParsedTreeListQuery {
  const page = toInt(q.page, 1, MAX_PAGE)
  const pageSize = toInt(q.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const from = (page - 1) * pageSize

  return {
    page,
    pageSize,
    // Opt-out, not opt-in: sold specimens stay hidden unless asked for.
    inStockOnly: q.inStockOnly !== 'false',
    sizes: toArray(q.sizes),
    careLevels: toArray(q.careLevels),
    treeTypes: toArray(q.treeTypes),
    search: typeof q.search === 'string' ? q.search : '',
    sortBy: ALLOWED_SORTS.includes(q.sortBy as AllowedSort)
      ? (q.sortBy as AllowedSort)
      : 'newest',
    from,
    to: from + pageSize - 1,
  }
}

/** Whether another page exists after the one bounded by `to`. */
export function hasMorePages(to: number, total: number): boolean {
  return to < total - 1
}
