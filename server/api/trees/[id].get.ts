import type { TreeRow } from '~/server/utils/mappers'
import type { PublicTree } from '~/types'
import { mapPublicTreeRow } from '~/server/utils/mappers'
import { createAnonClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event): Promise<PublicTree> => {
  const supabase = createAnonClient()

  // The route param is named `id`, but specimens are addressed by slug.
  const slug = getRouterParam(event, 'id')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing tree slug',
    })
  }

  try {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Tree not found',
        })
      }
      throw error
    }

    return mapPublicTreeRow(data as TreeRow)
  }
  catch (error) {
    console.error('Error fetching tree:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tree',
    })
  }
})
