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

const { default: createListing } = await import('~/server/api/admin/listings/create.post')
const { default: updateListing } = await import('~/server/api/admin/listings/[id].put')

function authed(body: unknown, params?: Record<string, string>) {
  const token = jwt.sign({ id: 'admin-1', email: 'admin@example.test' }, testRuntimeConfig.jwtSecret)
  return createTestEvent({
    method: 'POST',
    path: '/api/admin/listings/create',
    headers: { authorization: `Bearer ${token}` },
    body,
    params,
  })
}

function validCreateBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Windswept Juniper',
    slug: 'windswept-juniper',
    species: 'Juniperus procumbens',
    description: 'A mature specimen.',
    short_description: 'Dramatic deadwood.',
    tree_type: 'juniper',
    care_level: 'advanced',
    size: 'medium',
    age: 20,
    height: '14"',
    pot_type: 'Unglazed Tokoname',
    price: 850,
    thumbnail: 'https://example.test/thumb.jpg',
    images: ['https://example.test/a.jpg'],
    model_3d_url: null,
    features: ['deadwood'],
    in_stock: true,
    featured: false,
    ...overrides,
  }
}

function okClient() {
  const supabase = createSupabaseMock([{ data: [makeTreeRow()], error: null }])
  holder.client = supabase.client
  return supabase
}

beforeEach(() => {
  holder.client = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/admin/listings/create', () => {
  it('rejects an unauthenticated request before touching the database', async () => {
    const supabase = okClient()

    await expect(createListing(createTestEvent({ method: 'POST', body: validCreateBody() })))
      .rejects
      .toMatchObject({ statusCode: 401 })

    expect(supabase.queries).toHaveLength(0)
  })

  it('inserts a validated row for an authenticated admin', async () => {
    const supabase = okClient()

    const result = await createListing(authed(validCreateBody()))

    const query = expectDefined(supabase.lastQuery(), 'query')
    expect(query.table).toBe('trees')
    expect(supabase.hasOp(query, 'insert')).toBe(true)
    expect(result.success).toBe(true)
  })

  // Regression guard: the handler used to pass readBody() straight to
  // .insert(), so an admin could overwrite identity and audit columns.
  it('never writes id, created_at or updated_at from the request body', async () => {
    const supabase = okClient()

    await createListing(authed(validCreateBody({
      id: 'attacker-chosen-id',
      created_at: '1999-01-01T00:00:00.000Z',
      updated_at: '1999-01-01T00:00:00.000Z',
    })))

    const insert = expectDefined(
      supabase.lastQuery()?.ops.find(op => op.method === 'insert'),
      'insert op',
    )
    const row = insert.args[0] as Record<string, unknown>
    expect(row).not.toHaveProperty('id')
    expect(row).not.toHaveProperty('created_at')
    expect(row).not.toHaveProperty('updated_at')
  })

  it('400s on a malformed enum without querying the database', async () => {
    const supabase = okClient()

    await expect(createListing(authed(validCreateBody({ tree_type: 'oak' }))))
      .rejects
      .toMatchObject({ statusCode: 400 })

    expect(supabase.queries).toHaveLength(0)
  })

  it('400s on a missing required field', async () => {
    okClient()
    const body = validCreateBody()
    delete (body as Record<string, unknown>).name

    await expect(createListing(authed(body))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('names the offending field in the error', async () => {
    okClient()

    await expect(createListing(authed(validCreateBody({ price: -1 }))))
      .rejects
      .toMatchObject({ statusCode: 400, data: { field: 'price' } })
  })

  it('409s on a duplicate slug rather than reporting a server fault', async () => {
    holder.client = createSupabaseMock([
      { data: null, error: { message: 'duplicate key value', code: '23505' } },
    ]).client

    await expect(createListing(authed(validCreateBody())))
      .rejects
      .toMatchObject({ statusCode: 409 })
  })

  it('500s on any other database error', async () => {
    holder.client = createSupabaseMock([
      { data: null, error: { message: 'connection refused' } },
    ]).client

    await expect(createListing(authed(validCreateBody())))
      .rejects
      .toMatchObject({ statusCode: 500 })
  })
})

describe('PUT /api/admin/listings/[id]', () => {
  it('rejects an unauthenticated request before touching the database', async () => {
    const supabase = okClient()

    await expect(updateListing(createTestEvent({
      method: 'PUT',
      body: { name: 'Renamed' },
      params: { id: 'tree-1' },
    }))).rejects.toMatchObject({ statusCode: 401 })

    expect(supabase.queries).toHaveLength(0)
  })

  it('400s when the id param is missing', async () => {
    okClient()

    await expect(updateListing(authed({ name: 'Renamed' })))
      .rejects
      .toMatchObject({ statusCode: 400 })
  })

  it('updates only the supplied columns, scoped to the id', async () => {
    const supabase = okClient()

    await updateListing(authed({ name: 'Renamed' }, { id: 'tree-1' }))

    const query = expectDefined(supabase.lastQuery(), 'query')
    const update = expectDefined(query.ops.find(op => op.method === 'update'), 'update op')
    expect(update.args[0]).toEqual({ name: 'Renamed' })
    expect(supabase.hasOp(query, 'eq', 'id', 'tree-1')).toBe(true)
  })

  it('never writes id from the request body', async () => {
    const supabase = okClient()

    await updateListing(authed({ name: 'Renamed', id: 'other-tree' }, { id: 'tree-1' }))

    const update = expectDefined(
      supabase.lastQuery()?.ops.find(op => op.method === 'update'),
      'update op',
    )
    expect(update.args[0]).toEqual({ name: 'Renamed' })
  })

  it('400s when the body contains nothing writable', async () => {
    const supabase = okClient()

    await expect(updateListing(authed({ id: 'other-tree' }, { id: 'tree-1' })))
      .rejects
      .toMatchObject({ statusCode: 400 })

    expect(supabase.queries).toHaveLength(0)
  })

  it('404s when no listing matches the id', async () => {
    holder.client = createSupabaseMock([{ data: [], error: null }]).client

    await expect(updateListing(authed({ name: 'Renamed' }, { id: 'missing' })))
      .rejects
      .toMatchObject({ statusCode: 404 })
  })

  it('500s on any other database error', async () => {
    holder.client = createSupabaseMock([
      { data: null, error: { message: 'connection refused' } },
    ]).client

    await expect(updateListing(authed({ name: 'Renamed' }, { id: 'tree-1' })))
      .rejects
      .toMatchObject({ statusCode: 500 })
  })
})
