import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestEvent } from '../utils/event'
import { expectDefined } from '../utils/expect-defined'
import { createSupabaseMock } from '../utils/supabase-mock'

const holder = vi.hoisted(() => ({ client: null as any }))
const bcryptMock = vi.hoisted(() => ({ compare: true }))

vi.mock('~/server/utils/supabase', () => ({
  createAnonClient: () => holder.client,
  createServiceClient: () => holder.client,
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(async () => bcryptMock.compare),
  },
}))

const { default: login } = await import('~/server/api/admin/auth/login.post')

beforeEach(() => {
  holder.client = null
  bcryptMock.compare = true
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/admin/auth/login', () => {
  it('returns 400 when body is missing', async () => {
    const event = createTestEvent({ method: 'POST', path: '/api/admin/auth/login' })
    await expect(login(event)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Email and password are required' })
  })

  it('returns 400 when email is missing', async () => {
    const event = createTestEvent({ method: 'POST', path: '/api/admin/auth/login', body: { password: 'test-password' } })
    await expect(login(event)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Email and password are required' })
  })

  it('returns 400 when password is missing', async () => {
    const event = createTestEvent({ method: 'POST', path: '/api/admin/auth/login', body: { email: 'admin@example.test' } })
    await expect(login(event)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Email and password are required' })
  })

  it('returns 401 when user is not found', async () => {
    const supabase = createSupabaseMock([{ data: null, error: { message: 'Not found', code: 'PGRST116' } }])
    holder.client = supabase.client

    const event = createTestEvent({ method: 'POST', path: '/api/admin/auth/login', body: { email: 'admin@example.test', password: 'test-password' } })
    await expect(login(event)).rejects.toMatchObject({ statusCode: 401, statusMessage: 'Invalid credentials' })
  })

  it('returns 401 when password is invalid', async () => {
    bcryptMock.compare = false
    const supabase = createSupabaseMock([{ data: [{ id: 'admin-1', email: 'admin@example.test', password_hash: 'hash' }], error: null }])
    holder.client = supabase.client

    const event = createTestEvent({ method: 'POST', path: '/api/admin/auth/login', body: { email: 'admin@example.test', password: 'wrong-password' } })
    await expect(login(event)).rejects.toMatchObject({ statusCode: 401, statusMessage: 'Invalid credentials' })
  })

  it('returns success and token for valid login', async () => {
    bcryptMock.compare = true
    const supabase = createSupabaseMock([{ data: [{ id: 'admin-1', email: 'admin@example.test', password_hash: 'hash' }], error: null }])
    holder.client = supabase.client

    const event = createTestEvent({ method: 'POST', path: '/api/admin/auth/login', body: { email: 'admin@example.test', password: 'test-password' } })
    const result = await login(event)

    const query = expectDefined(supabase.lastQuery(), 'query')
    expect(query.table).toBe('admin_users')
    expect(supabase.hasOp(query, 'eq', 'email', 'admin@example.test')).toBe(true)

    expect(result).toMatchObject({
      success: true,
      user: {
        id: 'admin-1',
        email: 'admin@example.test',
      },
    })
    expect(typeof result.token).toBe('string')
  })

  it('returns 500 when database throws generic error', async () => {
    const supabase = createSupabaseMock([{ data: null, error: { message: 'Database failure' } }])
    holder.client = supabase.client

    const event = createTestEvent({ method: 'POST', path: '/api/admin/auth/login', body: { email: 'admin@example.test', password: 'test-password' } })
    await expect(login(event)).rejects.toMatchObject({ statusCode: 401, statusMessage: 'Invalid credentials' })
  })
})
