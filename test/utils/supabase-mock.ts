import type { SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseResult<T = unknown> {
  data: T | null
  error: { message: string, code?: string } | null
  count?: number | null
}

export interface RecordedOp {
  method: string
  args: unknown[]
}

export interface RecordedQuery {
  table: string
  ops: RecordedOp[]
}

export type SupabaseResolver = (query: RecordedQuery) => SupabaseResult | Promise<SupabaseResult>

export interface SupabaseMock {
  /** Cast-ready stand-in for a real SupabaseClient. */
  client: SupabaseClient
  /** Every `.from()` chain, in call order, with its recorded operations. */
  queries: RecordedQuery[]
  /** The most recent chain. */
  lastQuery: () => RecordedQuery | undefined
  /** All chains issued against a given table. */
  queriesFor: (table: string) => RecordedQuery[]
  /** True when e.g. `.eq('in_stock', true)` was applied to a chain. */
  hasOp: (query: RecordedQuery, method: string, ...args: unknown[]) => boolean
}

const NO_RESULT: SupabaseResult = {
  data: null,
  error: { message: 'supabase-mock: no queued result for this query' },
}

/**
 * PostgREST returns a PGRST116 error for `.single()` on an empty set but null
 * for `.maybeSingle()`. Handlers branch on that difference, so model it.
 */
function unwrapSingle(query: RecordedQuery, result: SupabaseResult): SupabaseResult {
  const isSingle = query.ops.some(op => op.method === 'single' || op.method === 'maybeSingle')
  if (!isSingle || !Array.isArray(result.data))
    return result

  const [first] = result.data as unknown[]
  if (first !== undefined)
    return { ...result, data: first }

  const isMaybe = query.ops.some(op => op.method === 'maybeSingle')
  return isMaybe
    ? { ...result, data: null }
    : { ...result, data: null, error: { message: 'No rows found', code: 'PGRST116' } }
}

/**
 * Fake Supabase client.
 *
 * The builder is a Proxy that returns itself for any method and is thenable, so
 * a whole chain resolves while every operation is recorded for assertion.
 *
 * Pass an array to queue results in `.from()` order, or a function to decide per
 * query (needed when a handler issues several chains against one table).
 *
 *   const supabase = createSupabaseMock([{ data: [row], error: null, count: 1 }])
 *   const supabase = createSupabaseMock(q => q.table === 'trees'
 *     ? { data: [row], error: null }
 *     : { data: null, error: { message: 'boom' } })
 */
export function createSupabaseMock(source: SupabaseResult[] | SupabaseResolver): SupabaseMock {
  const queries: RecordedQuery[] = []
  const queue = Array.isArray(source) ? [...source] : null
  const resolver = Array.isArray(source) ? null : source

  const resolve = async (query: RecordedQuery): Promise<SupabaseResult> => {
    const result = resolver ? await resolver(query) : (queue?.shift() ?? NO_RESULT)
    return unwrapSingle(query, result)
  }

  function createBuilder(table: string) {
    const query: RecordedQuery = { table, ops: [] }
    queries.push(query)

    const builder: any = new Proxy({}, {
      get(_target, prop) {
        // Symbol access (inspection, toStringTag, iterators) must not become a stub.
        if (typeof prop === 'symbol')
          return undefined

        if (prop === 'then') {
          return (
            onFulfilled?: (value: SupabaseResult) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) => resolve(query).then(onFulfilled, onRejected)
        }
        if (prop === 'catch')
          return (onRejected: (reason: unknown) => unknown) => resolve(query).catch(onRejected)
        if (prop === 'finally')
          return (onFinally: () => void) => resolve(query).finally(onFinally)

        // Every builder method — select/insert/update/upsert/delete/eq/in/or/
        // ilike/order/range/limit/single/maybeSingle — records and chains.
        return (...args: unknown[]) => {
          query.ops.push({ method: prop, args })
          return builder
        }
      },
    })

    return builder
  }

  const client = {
    from: (table: string) => createBuilder(table),
    rpc: (fn: string, args?: unknown) => createBuilder(`rpc:${fn}`).select(args),
  }

  return {
    client: client as unknown as SupabaseClient,
    queries,
    lastQuery: () => queries.at(-1),
    queriesFor: table => queries.filter(query => query.table === table),
    hasOp: (query, method, ...args) =>
      query.ops.some(op =>
        op.method === method
        && (args.length === 0
          || JSON.stringify(op.args.slice(0, args.length)) === JSON.stringify(args)),
      ),
  }
}
