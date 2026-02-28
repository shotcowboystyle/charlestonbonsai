import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

export const useSupabaseClient = () => {
  const config = useRuntimeConfig()
  
  const client = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey
  )
  
  return client
}
