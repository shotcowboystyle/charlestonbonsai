import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTreeRow } from '../fixtures/trees'
import { testRuntimeConfig } from '../setup/nitro-globals'
import { createTestEvent } from '../utils/event'
import { expectDefined } from '../utils/expect-defined'
import { createSupabaseMock } from '../utils/supabase-mock'

const holder = vi.hoisted(() => ({ client: null as any }))

vi.mock('~/server/utils/supabase', () => ({
  createAnonClient: () => holder.client,
  createServiceClient: () => holder.client,
}))

const { default: listAdminTrees } = await import('~/server/api/admin/listings/index.get')

function authed() {
  const token = jwt.sign({ id: 'admin-1', email: 'admin@example.test' }, testRuntimeConfig.jwtSecret)
  return createTestEvent({ headers: { authorization: `Bearer ${token}` } })
}

beforeEach(() => {
  holder.client = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/admin/listings', () => {
  it('rejects an unauthenticated request before touching the database', async () => {
    const supabase = createSupabaseMock([{ data: [], error: null }])
    holder.client = supabase.client

    await expect(listAdminTrees(createTestEvent()))
      .rejects
      .toMatchObject({ statusCode: 401 })

    expect(supabase.queries).toHaveLength(0)
  })

  it('rejects a token signed with the wrong secret', async () => {
    holder.client = createSupabaseMock([{ data: [], error: null }]).client
    const event = createTestEvent({
      headers: { authorization: `Bearer ${jwt.sign({ id: 'x' }, 'wrong-secret')}` },
    })

    await expect(listAdminTrees(event)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns newest-first listings for an authenticated admin', async () => {
    const supabase = createSupabaseMock([{ data: [makeTreeRow()], error: null }])
    holder.client = supabase.client

    const trees = await listAdminTrees(authed())

    const query = expectDefined(supabase.lastQuery(), 'query')
    expect(query.table).toBe('trees')
    expect(supabase.hasOp(query, 'order', 'created_at', { ascending: false })).toBe(true)
    expect(trees).toHaveLength(1)
  })

  // The admin mapper is the counterpart to the public one: it must include
  // price, which every consumer-facing endpoint strips.
  it('includes price, unlike the public endpoints', async () => {
    holder.client = createSupabaseMock([{ data: [makeTreeRow({ price: 1250 })], error: null }]).client

    const trees = await listAdminTrees(authed())

    expect(expectDefined(trees[0], 'first tree').price).toBe(1250)
  })

  it('returns an empty array when there are no listings', async () => {
    holder.client = createSupabaseMock([{ data: [], error: null }]).client

    await expect(listAdminTrees(authed())).resolves.toEqual([])
  })

  it('500s when the query errors', async () => {
    holder.client = createSupabaseMock([
      { data: null, error: { message: 'connection refused' } },
    ]).client

    await expect(listAdminTrees(authed())).rejects.toMatchObject({ statusCode: 500 })
  })
})
