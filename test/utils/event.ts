import type { H3Event } from 'h3'
import { createEvent } from 'h3'

export interface TestEventOptions {
  method?: string
  /** Full path including query string, e.g. '/api/trees/list?page=2'. */
  path?: string
  headers?: Record<string, string>
  /** Object bodies are JSON-encoded and given a JSON content-type. */
  body?: unknown
  /** Values for getRouterParam(), e.g. { id: 'abc' }. */
  params?: Record<string, string>
}

/**
 * Build an H3Event backed by minimal node req/res stand-ins.
 *
 * The shapes below are exactly what h3 1.x touches: `getRequestHeaders` reads
 * `node.req.headers`, `getQuery` derives from `node.req.url`, `readBody` checks
 * `event._requestBody` first, and `sendRedirect`/`setResponseStatus` write to
 * `node.res`.
 */
export function createTestEvent(options: TestEventOptions = {}): H3Event {
  const { method = 'GET', path = '/', headers = {}, body, params } = options

  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers))
    normalized[key.toLowerCase()] = value

  if (body !== undefined && typeof body !== 'string' && !normalized['content-type'])
    normalized['content-type'] = 'application/json'

  const req = {
    method,
    url: path,
    headers: normalized,
    socket: {},
    on: () => req,
    once: () => req,
    removeListener: () => req,
  }

  const responseHeaders: Record<string, string | number | string[]> = {}
  const res = {
    statusCode: 200,
    statusMessage: '',
    headersSent: false,
    writableEnded: false,
    setHeader(name: string, value: string | number | string[]) {
      responseHeaders[name.toLowerCase()] = value
      return res
    },
    getHeader(name: string) {
      return responseHeaders[name.toLowerCase()]
    },
    getHeaders: () => responseHeaders,
    getHeaderNames: () => Object.keys(responseHeaders),
    removeHeader(name: string) {
      delete responseHeaders[name.toLowerCase()]
    },
    write: () => true,
    end() {
      res.writableEnded = true
      res.headersSent = true
      return res
    },
  }

  const event = createEvent(req as never, res as never)

  if (body !== undefined)
    event._requestBody = typeof body === 'string' ? body : JSON.stringify(body)
  if (params)
    event.context.params = params

  return event
}

/** Inspect what a handler wrote to the response. */
export function responseOf(event: H3Event) {
  const res = event.node.res as unknown as {
    statusCode: number
    getHeaders: () => Record<string, unknown>
  }
  return { statusCode: res.statusCode, headers: res.getHeaders() }
}
