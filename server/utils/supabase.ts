import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

let anonClient: SupabaseClient | null = null
let serviceClient: SupabaseClient | null = null

/**
 * Anonymous, RLS-scoped client. Public read paths only.
 */
export function createAnonClient(): SupabaseClient {
  if (!anonClient) {
    const config = useRuntimeConfig()
    anonClient = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey,
    )
  }
  return anonClient
}

/**
 * Service-role client for admin and write paths.
 *
 * Throws an error if SUPABASE_SERVICE_KEY is unset, rather than falling back
 * to the anon key. Using the anon key for admin handlers is a vulnerability that
 * could result in silent failures under RLS or unintentional access.
 */
export function createServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const config = useRuntimeConfig()

    if (!config.supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_KEY. Admin operations are not allowed without it.')
    }

    serviceClient = createClient(
      config.public.supabaseUrl,
      config.supabaseServiceKey,
    )
  }
  return serviceClient
}
