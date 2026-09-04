import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

let _anonClient: SupabaseClient | null = null
let _serviceClient: SupabaseClient | null = null

/**
 * Anonymous, RLS-scoped client. Public read paths only.
 */
export function createAnonClient(): SupabaseClient {
  if (_anonClient)
    return _anonClient
  const config = useRuntimeConfig()
  _anonClient = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )
  return _anonClient
}

/**
 * Service-role client for admin and write paths.
 *
 * Falls back to the anon key when SUPABASE_SERVICE_KEY is unset, preserving the
 * behaviour every admin handler already had. That fallback is a deployment
 * smell — writes will silently fail under RLS rather than erroring loudly.
 */
export function createServiceClient(): SupabaseClient {
  if (_serviceClient)
    return _serviceClient
  const config = useRuntimeConfig()
  _serviceClient = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )
  return _serviceClient
}
