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
 * Falls back to the anon key when SUPABASE_SERVICE_KEY is unset, preserving the
 * behaviour every admin handler already had. That fallback is a deployment
 * smell — writes will silently fail under RLS rather than erroring loudly.
 */
export function createServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const config = useRuntimeConfig()
    serviceClient = createClient(
      config.public.supabaseUrl,
      config.supabaseServiceKey || config.public.supabaseAnonKey,
    )
  }
  return serviceClient
}
