import {
  createError,
  getHeader,
  getQuery,
  getRouterParam,
  readBody,
  readMultipartFormData,
  sendRedirect,
  setResponseStatus,
} from 'h3'
import { afterEach, vi } from 'vitest'
import { requireAdmin } from '~/server/utils/requireAdmin'

/**
 * Mirrors the shape of nuxt.config.ts runtimeConfig. Exported so tests can sign
 * JWTs with the same secret the handlers verify against.
 */
export const testRuntimeConfig = {
  supabaseServiceKey: 'test-service-key',
  adminEmail: 'admin@example.test',
  adminPasswordHash: '',
  jwtSecret: 'test-jwt-secret',
  public: {
    supabaseUrl: 'http://127.0.0.1:1',
    supabaseAnonKey: 'test-anon-key',
    siteUrl: 'http://localhost:3000',
    siteName: 'Charleston Bonsai',
    siteDomain: 'charlestonbonsai.com',
  },
}

// Nitro auto-imports these into server code, so modules under test reference
// them as bare globals. Install the genuine h3 implementations — nothing is
// simulated — and fake only the two Nuxt-specific ones.
vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)
vi.stubGlobal('useRuntimeConfig', () => testRuntimeConfig)

vi.stubGlobal('createError', createError)
vi.stubGlobal('getHeader', getHeader)
vi.stubGlobal('getQuery', getQuery)
vi.stubGlobal('getRouterParam', getRouterParam)
vi.stubGlobal('readBody', readBody)
vi.stubGlobal('readMultipartFormData', readMultipartFormData)
vi.stubGlobal('sendRedirect', sendRedirect)
vi.stubGlobal('setResponseStatus', setResponseStatus)

// server/utils/* is auto-imported by Nitro too. Using the real implementation
// keeps admin-route tests honest: they must present a validly signed token.
vi.stubGlobal('requireAdmin', requireAdmin)

afterEach(() => {
  vi.clearAllMocks()
})
