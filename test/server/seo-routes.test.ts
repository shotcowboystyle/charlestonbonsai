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

const { default: robots } = await import('~/server/routes/robots.txt')
const { default: sitemap } = await import('~/server/routes/sitemap.xml')
const { default: llms } = await import('~/server/routes/llms.txt')

const SITE = 'http://localhost:3000'

beforeEach(() => {
  holder.client = null
})

describe('GET /robots.txt', () => {
  it('blocks admin and points at the sitemap', () => {
    const body = robots(createTestEvent({ path: '/robots.txt' })) as string

    expect(body).toContain('Disallow: /admin')
    expect(body).toContain('Disallow: /api/')
    expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`)
  })
})

describe('GET /sitemap.xml', () => {
  it('lists static pages and every tree with lastmod', async () => {
    holder.client = createSupabaseMock([{ data: [makeTreeRow({ slug: 'old-pine', updated_at: '2026-01-02T00:00:00Z' })], error: null }]).client

    const body = await sitemap(createTestEvent({ path: '/sitemap.xml' }))

    expect(body).toContain(`<loc>${SITE}/gallery</loc>`)
    expect(body).toContain(`<loc>${SITE}/gallery/old-pine</loc><lastmod>2026-01-02T00:00:00.000Z</lastmod>`)
    expect(body).not.toContain('/admin')
  })

  it('still ships static pages when the tree query fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    holder.client = createSupabaseMock([{ data: null, error: { message: 'down' } }]).client

    const body = await sitemap(createTestEvent({ path: '/sitemap.xml' }))

    expect(body).toContain(`<loc>${SITE}/</loc>`)
  })
})

describe('GET /llms.txt', () => {
  it('lists in-stock trees without selecting price', async () => {
    const supabase = createSupabaseMock([{ data: [makeTreeRow({ name: 'Old Pine', slug: 'old-pine' })], error: null }])
    holder.client = supabase.client

    const body = await llms(createTestEvent({ path: '/llms.txt' }))
    const query = expectDefined(supabase.lastQuery(), 'query')

    expect(body).toMatch(/^# Charleston Bonsai\n/)
    expect(body).toContain(`- [Old Pine](${SITE}/gallery/old-pine)`)
    expect(supabase.hasOp(query, 'eq', 'in_stock', true)).toBe(true)
    expect(JSON.stringify(query.ops)).not.toContain('price')
    expect(body).not.toContain('850')
  })
})
