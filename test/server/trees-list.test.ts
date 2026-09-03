import type { RecordedQuery } from '../utils/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTreeRow } from '../fixtures/trees'
import { createTestEvent } from '../utils/event'
import { expectDefined } from '../utils/expect-defined'
import { createSupabaseMock } from '../utils/supabase-mock'

// vi.mock factories are hoisted above imports, so the client holder must be too.
const holder = vi.hoisted(() => ({ client: null as any }))

vi.mock('~/server/utils/supabase', () => ({
  createAnonClient: () => holder.client,
  createServiceClient: () => holder.client,
}))

const { default: listTrees } = await import('~/server/api/trees/list.get')

function setup(result = { data: [] as unknown[], error: null, count: 0 }) {
  const supabase = createSupabaseMock([result])
  holder.client = supabase.client
  return supabase
}

async function run(path: string, result?: Parameters<typeof setup>[0]) {
  const supabase = setup(result)
  const response = await listTrees(createTestEvent({ path }))
  return { response, supabase, query: expectDefined(supabase.lastQuery(), 'query') as RecordedQuery }
}

beforeEach(() => {
  holder.client = null
})

describe('GET /api/trees/list', () => {
  it('queries the trees table with an exact count', async () => {
    const { query, supabase } = await run('/api/trees/list')

    expect(query.table).toBe('trees')
    expect(supabase.hasOp(query, 'select', '*', { count: 'exact' })).toBe(true)
  })

  it('filters to in-stock specimens by default', async () => {
    const { query, supabase } = await run('/api/trees/list')

    expect(supabase.hasOp(query, 'eq', 'in_stock', true)).toBe(true)
  })

  it('drops the in-stock filter only when inStockOnly=false', async () => {
    const { query, supabase } = await run('/api/trees/list?inStockOnly=false')

    expect(supabase.hasOp(query, 'eq', 'in_stock')).toBe(false)
  })

  it('paginates with inclusive range bounds', async () => {
    const { query, supabase, response } = await run('/api/trees/list?page=2&pageSize=10')

    expect(supabase.hasOp(query, 'range', 10, 19)).toBe(true)
    expect(response.page).toBe(2)
    expect(response.pageSize).toBe(10)
  })

  it('clamps an oversized pageSize', async () => {
    const { query, supabase, response } = await run('/api/trees/list?pageSize=500')

    expect(response.pageSize).toBe(48)
    expect(supabase.hasOp(query, 'range', 0, 47)).toBe(true)
  })

  it('applies facet filters with in()', async () => {
    const { query, supabase } = await run(
      '/api/trees/list?sizes=small&careLevels=beginner&treeTypes=juniper',
    )

    expect(supabase.hasOp(query, 'in', 'size', ['small'])).toBe(true)
    expect(supabase.hasOp(query, 'in', 'care_level', ['beginner'])).toBe(true)
    expect(supabase.hasOp(query, 'in', 'tree_type', ['juniper'])).toBe(true)
  })

  it('omits facet filters that were not requested', async () => {
    const { query, supabase } = await run('/api/trees/list')

    expect(supabase.hasOp(query, 'in')).toBe(false)
  })

  it('searches name and species with an escaped ilike pattern', async () => {
    const { query, supabase } = await run('/api/trees/list?search=juniper')

    expect(supabase.hasOp(query, 'or', 'name.ilike.%juniper%,species.ilike.%juniper%')).toBe(true)
  })

  it('escapes wildcards and commas so a search term cannot inject a filter', async () => {
    const { query } = await run('/api/trees/list?search=a%2Cprice.gt.0')

    const orOp = expectDefined(query.ops.find(op => op.method === 'or'), 'or() op')
    expect(String(orOp.args[0])).toContain('a\\,price.gt.0')
  })

  it('skips the search filter for an empty term', async () => {
    const { query, supabase } = await run('/api/trees/list?search=')

    expect(supabase.hasOp(query, 'or')).toBe(false)
  })

  it('sorts newest first by default', async () => {
    const { query, supabase } = await run('/api/trees/list')

    expect(supabase.hasOp(query, 'order', 'created_at', { ascending: false })).toBe(true)
  })

  it('sorts by name ascending when asked', async () => {
    const { query, supabase } = await run('/api/trees/list?sortBy=name')

    expect(supabase.hasOp(query, 'order', 'name', { ascending: true })).toBe(true)
  })

  it('sorts oldest first when asked', async () => {
    const { query, supabase } = await run('/api/trees/list?sortBy=oldest')

    expect(supabase.hasOp(query, 'order', 'created_at', { ascending: true })).toBe(true)
  })

  it('falls back to newest for an unknown sort key', async () => {
    const { query, supabase } = await run('/api/trees/list?sortBy=price')

    expect(supabase.hasOp(query, 'order', 'created_at', { ascending: false })).toBe(true)
  })

  it('maps rows to the public camelCase shape without price', async () => {
    const { response } = await run('/api/trees/list', {
      data: [makeTreeRow()],
      error: null,
      count: 1,
    })

    const tree = expectDefined(response.trees[0], 'first tree')
    expect(tree.name).toBe('Windswept Juniper')
    expect(tree.shortDescription).toBe('Dramatic deadwood, 20 years in training.')
    expect(tree).not.toHaveProperty('price')
  })

  it('reports hasMore when rows remain', async () => {
    const { response } = await run('/api/trees/list?page=1&pageSize=1', {
      data: [makeTreeRow()],
      error: null,
      count: 5,
    })

    expect(response.total).toBe(5)
    expect(response.hasMore).toBe(true)
  })

  it('reports hasMore false on the final page', async () => {
    const { response } = await run('/api/trees/list?page=5&pageSize=1', {
      data: [makeTreeRow()],
      error: null,
      count: 5,
    })

    expect(response.hasMore).toBe(false)
  })

  it('returns an empty, zero-total response when Supabase sends no rows', async () => {
    const { response } = await run('/api/trees/list', { data: null as any, error: null, count: null as any })

    expect(response.trees).toEqual([])
    expect(response.total).toBe(0)
    expect(response.hasMore).toBe(false)
  })

  it('throws a 500 when the query errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const supabase = createSupabaseMock([
      { data: null, error: { message: 'connection refused' } },
    ])
    holder.client = supabase.client

    await expect(listTrees(createTestEvent({ path: '/api/trees/list' })))
      .rejects
      .toMatchObject({ statusCode: 500 })

    consoleError.mockRestore()
  })
})
