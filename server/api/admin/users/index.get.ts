import { createServiceClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // 1. Verify admin
  requireAdmin(event)

  // 2. Create service client to bypass RLS
  const supabase = createServiceClient()

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
