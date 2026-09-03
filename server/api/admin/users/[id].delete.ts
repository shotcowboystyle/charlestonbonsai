import { createServiceClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // 1. Verify admin
  const currentUser = requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    })
  }

  // 2. Prevent self-deletion
  if (currentUser.id === id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'You cannot delete your own account',
    })
  }

  // 3. Create service client to bypass RLS
  const supabase = createServiceClient()

  // 4. Delete user
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete user',
    })
  }

  return { success: true }
})
