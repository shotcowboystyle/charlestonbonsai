import { createServiceClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Listing ID is required',
    })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('trees')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting listing:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete listing',
    })
  }

  return { success: true }
})
