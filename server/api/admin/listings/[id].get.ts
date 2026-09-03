import type { TreeRow } from '~/server/utils/mappers'
import type { Tree } from '~/types'
import { mapAdminTreeRow } from '~/server/utils/mappers'
import { createServiceClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event): Promise<Tree> => {
  requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing tree id',
    })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tree not found',
      })
    }
    console.error('Error fetching admin listing:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch listing',
    })
  }

  return mapAdminTreeRow(data as TreeRow)
})
