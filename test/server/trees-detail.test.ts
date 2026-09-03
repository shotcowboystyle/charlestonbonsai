import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTreeRow } from '../fixtures/trees'
import { createTestEvent } from '../utils/event'
import { expectDefined } from '../utils/expect-defined'
import { createSupabaseMock } from '../utils/supabase-mock'

const holder = vi.hoisted(() => ({ client: null as any }))

vi.mock('~/server/utils/supabase', () => ({
  createAnonClient: () => holder.client,
  createServiceClient: () => holder.client,
}))

const { default: getTree } = await import('~/server/api/trees/[id].get')
const { default: getFeatured } = await import('~/server/api/trees/featured.get')

beforeEach(() => {
  holder.client = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/trees/[id]', () => {
  it('looks the specimen up by slug, not by id', async () => {
    const supabase = createSupabaseMock([{ data: [makeTreeRow()], error: null }])
    holder.client = supabase.client

    await getTree(createTestEvent({ params: { id: 'windswept-juniper' } }))

    const query = expectDefined(supabase.lastQuery(), 'query')
    expect(query.table).toBe('trees')
    expect(supabase.hasOp(query, 'eq', 'slug', 'windswept-juniper')).toBe(true)
    expect(supabase.hasOp(query, 'single')).toBe(true)
  })

  it('returns the public shape without price', async () => {
    holder.client = createSupabaseMock([{ data: [makeTreeRow()], error: null }]).client

    const tree = await getTree(createTestEvent({ params: { id: 'windswept-juniper' } }))

    expect(tree.slug).toBe('windswept-juniper')
    expect(tree.potType).toBe('Unglazed Tokoname')
    expect(tree).not.toHaveProperty('price')
  })

  it('400s when the slug param is missing', async () => {
    await expect(getTree(createTestEvent()))
      .rejects
      .toMatchObject({ statusCode: 400 })
  })

  // `.single()` on an empty set is a PGRST116 error, not a null row — the 404
  // path depends on that distinction.
  it('404s when no row matches the slug', async () => {
    holder.client = createSupabaseMock([{ data: [], error: null }]).client

    await expect(getTree(createTestEvent({ params: { id: 'nope' } })))
      .rejects
      .toMatchObject({ statusCode: 404 })
  })

  it('500s on any other database error', async () => {
    holder.client = createSupabaseMock([
      { data: null, error: { message: 'connection refused' } },
    ]).client

    await expect(getTree(createTestEvent({ params: { id: 'windswept-juniper' } })))
      .rejects
      .toMatchObject({ statusCode: 500 })
  })

  it('does not downgrade a 404 into a 500 when rethrowing', async () => {
    holder.client = createSupabaseMock([{ data: [], error: null }]).client

    await expect(getTree(createTestEvent({ params: { id: 'nope' } })))
      .rejects
      .toMatchObject({ statusCode: 404 })
  })
})

describe('GET /api/trees/featured', () => {
  it('requests at most five featured specimens', async () => {
    const supabase = createSupabaseMock([{ data: [makeTreeRow()], error: null }])
    holder.client = supabase.client

    await getFeatured(createTestEvent())

    const query = expectDefined(supabase.lastQuery(), 'query')
    expect(supabase.hasOp(query, 'eq', 'featured', true)).toBe(true)
    expect(supabase.hasOp(query, 'limit', 5)).toBe(true)
  })

  it('maps rows to the public shape without price', async () => {
    holder.client = createSupabaseMock([{ data: [makeTreeRow()], error: null }]).client

    const trees = await getFeatured(createTestEvent())

    expect(trees).toHaveLength(1)
    expect(expectDefined(trees[0], 'first tree')).not.toHaveProperty('price')
  })

  // This handler runs during `nitro.prerender`. Throwing here would fail the
  // production build, so an unreachable database must degrade to an empty rail.
  it('returns an empty array instead of throwing when the query errors', async () => {
    holder.client = createSupabaseMock([
      { data: null, error: { message: 'ECONNREFUSED' } },
    ]).client

    await expect(getFeatured(createTestEvent())).resolves.toEqual([])
  })

  it('returns an empty array when there are no featured specimens', async () => {
    holder.client = createSupabaseMock([{ data: [], error: null }]).client

    await expect(getFeatured(createTestEvent())).resolves.toEqual([])
  })
})
