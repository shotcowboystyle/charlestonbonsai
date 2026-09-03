import type { TreeRow } from '~/server/utils/mappers'
import type { Tree } from '~/types'
import { mapAdminTreeRows } from '~/server/utils/mappers'
import { createServiceClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event): Promise<Tree[]> => {
  requireAdmin(event)

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin listings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch listings',
    })
  }

  return mapAdminTreeRows(data as TreeRow[] | null)
})
