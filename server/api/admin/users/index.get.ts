// import { serverSupabaseServiceRole } from 'supabase/server'
// We are not using @nuxtjs/supabase, we use custom
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // 1. Verify admin
  requireAdmin(event)

  const config = useRuntimeConfig()

  // 2. Create service client to bypass RLS
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey || config.public.supabaseAnonKey,
  )

  // 3. Fetch all admins safely
  const { data: users, error } = await supabase
    .from('admin_users')
    .select('id, email, last_password_change, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users',
    })
  }

  return { users }
})
