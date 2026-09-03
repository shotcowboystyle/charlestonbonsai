import type { TreeRow } from '~/server/utils/mappers'
import type { PublicTree } from '~/types'
import { mapPublicTreeRows } from '~/server/utils/mappers'
import { createAnonClient } from '~/server/utils/supabase'

export default defineEventHandler(async (): Promise<PublicTree[]> => {
  const supabase = createAnonClient()

  try {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .eq('featured', true)
      .limit(5)

    if (error)
      throw error

    return mapPublicTreeRows(data as TreeRow[] | null)
  }
  catch (error) {
    // Degrade to an empty rail rather than failing the page. This handler runs
    // during prerender, so throwing here would break the build.
    console.error('Error fetching featured trees:', error)
    return []
  }
})
