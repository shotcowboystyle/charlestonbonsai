import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

/**
 * Anonymous, RLS-scoped client. Public read paths only.
 */
export function createAnonClient(): SupabaseClient {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )
}

/**
 * Service-role client for admin and write paths.
 *
 * Falls back to the anon key when SUPABASE_SERVICE_KEY is unset, preserving the
 * behaviour every admin handler already had. That fallback is a deployment
 * smell — writes will silently fail under RLS rather than erroring loudly.
 */
export function createServiceClient(): SupabaseClient {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )
}
