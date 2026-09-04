import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

let cachedAnonClient: SupabaseClient | null = null
let cachedServiceClient: SupabaseClient | null = null

/**
 * Anonymous, RLS-scoped client. Public read paths only.
 */
export function createAnonClient(): SupabaseClient {
  if (cachedAnonClient)
    return cachedAnonClient

  const config = useRuntimeConfig()
  cachedAnonClient = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )
  return cachedAnonClient
}

/**
 * Service-role client for admin and write paths.
 *
 * Falls back to the anon key when SUPABASE_SERVICE_KEY is unset, preserving the
 * behaviour every admin handler already had. That fallback is a deployment
 * smell — writes will silently fail under RLS rather than erroring loudly.
 */
export function createServiceClient(): SupabaseClient {
  if (cachedServiceClient)
    return cachedServiceClient

  const config = useRuntimeConfig()
  cachedServiceClient = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )
  return cachedServiceClient
}
